const fs = require('fs');
const path = require('path');
const Contact = require("../../model/Contact");
const Country = require("../../model/Country")
const ContactCategory = require("../../model/ContactCategory")
const { successResponse } = require("../../util/response");

const CONTACT_DIR = path.join(__dirname, '..', 'public', 'contacts');

const removeFile = (name) => {
    if (!name) return;
    fs.unlink(path.join(CONTACT_DIR, path.basename(name)), () => { });
};

exports.getContactAPIController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const contacts = await Contact.find({
            created_by: userId
        }).populate("contact_category_id")

        const contactCategory = await ContactCategory.find({
            created_by: userId
        })

        const finalData = {
            contacts,
            contactCategory
        }

        return successResponse(res, "Contact fetched successfully", finalData)

    } catch (error) {
        next(error)
    }
}

exports.getContactCreateAPIController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const contactCategory = await ContactCategory.find({
            created_by: userId
        })
        const country = await Country.find()

        const finalData = {
            country,
            contactCategory
        }

        return successResponse(res, "Contact create fetched successfully", finalData)

    } catch (error) {
        next(error)
    }
}

exports.getContactEditAPIController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { id } = req?.params;

        const contacts = await Contact.findOne({
            _id: id,
            created_by: userId
        })

        return successResponse(res, "Contact fetched successfully", contacts)

    } catch (error) {
        next(error)
    }
}

exports.postContactAPIController = async (req, res, next) => {
    try {
        const userId = req?.userId

        const {
            state, city, contactType, fullName, category, country,
            mailingAddress, emails, phones, referenceNumber,
            kycDocuments, emergencyContactName, website,
        } = req.body;

        // Files (multer .fields() puts them in req.files as { fieldName: [files] })
        const photo = req.files?.photo?.[0]?.filename || '';
        const kycFiles = req.files?.kycFiles || [];

        const parseJSON = (value, fallback = []) => {
            if (value === undefined || value === null || value === '') return fallback;
            if (typeof value !== 'string') return value;
            try { return JSON.parse(value); } catch { return fallback; }
        };

        // Map each KYC entry to its uploaded file via fileIndex
        const kyc_documents = parseJSON(kycDocuments)
            .filter((d) => d?.type) // enum requires a valid type
            .map((d) => ({
                type: d.type,
                number: d.number || '',
                file: Number.isInteger(d.fileIndex)
                    ? kycFiles[d.fileIndex]?.filename || ''
                    : '',
            }));

        // Frontend sends countryCode, schema expects country_code
        const normalizedPhones = parseJSON(phones).map((p) => ({
            country_code: p.countryCode || p.country_code || '+91',
            number: p.number,
        }));

        await Contact.create({
            full_name: fullName,
            contact_category_id: category || null,
            contact_type: contactType,
            emails: parseJSON(emails),
            photo,
            phones: normalizedPhones,
            mailing_address: mailingAddress,
            country,
            state,
            city,
            website,
            reference_number: referenceNumber,
            emergency_contact_name: emergencyContactName,
            kyc_documents,
            created_by: userId,
        });

        return successResponse(res, 'Contact saved successfully');
    } catch (error) {
        next(error);
    }
};


exports.putContactAPIController = async (req, res, next) => {
    const uploaded = Object.values(req.files || {}).flat();
    const cleanupUploads = () => {
        uploaded.forEach((file) => {
            if (file.filename) removeFile(file.filename);
        });
    };

    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!userId) {
            cleanupUploads();
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const parseJSON = (value, fallback = []) => {
            if (value === undefined || value === null || value === '') {
                return fallback;
            }

            if (typeof value !== 'string') return value;

            try {
                return JSON.parse(value);
            } catch {
                return fallback;
            }
        };

        const existing = await Contact.findOne({
            _id: id,
            created_by: userId,
        });

        if (!existing) {
            cleanupUploads();
            return res.status(404).json({
                success: false,
                message: 'Contact not found',
            });
        }

        const {
            state,
            city,
            contactType,
            fullName,
            category,
            country,
            mailingAddress,
            emails,
            phones,
            referenceNumber,
            kycDocuments,
            emergencyContactName,
            website,
        } = req.body;

        const newPhoto = req.files?.photo?.[0];
        const kycFiles = req.files?.kycFiles || [];

        const existingKyc = new Map(
            (existing.kyc_documents || []).map((doc) => [
                String(doc._id),
                doc,
            ])
        );

        const keptIds = new Set();
        const filesToDelete = new Set();

        const submittedKyc = parseJSON(kycDocuments, []);

        const kyc_documents = submittedKyc
            .filter((doc) => doc?.type)
            .map((doc) => {
                const previous = doc._id
                    ? existingKyc.get(String(doc._id))
                    : null;

                // Only use an upload when a valid file index is supplied.
                const hasNewFile =
                    Number.isInteger(Number(doc.fileIndex)) &&
                    doc.fileIndex !== '' &&
                    doc.fileIndex !== null &&
                    kycFiles[Number(doc.fileIndex)];

                if (previous) {
                    keptIds.add(String(previous._id));
                }

                let file = previous?.file || '';

                if (hasNewFile) {
                    file = kycFiles[Number(doc.fileIndex)].filename;

                    if (previous?.file && previous.file !== file) {
                        filesToDelete.add(previous.file);
                    }
                }

                const entry = {
                    type: doc.type,
                    number: doc.number || '',
                    file,
                };

                // Preserve the existing MongoDB subdocument ID.
                if (previous) {
                    entry._id = previous._id;
                }

                return entry;
            });

        // Delete files only for KYC documents explicitly removed.
        existingKyc.forEach((doc, key) => {
            if (!keptIds.has(key) && doc.file) {
                filesToDelete.add(doc.file);
            }
        });

        const update = {
            full_name: fullName,
            contact_category_id: category || null,
            contact_type: contactType,
            emails: parseJSON(emails, []),
            phones: parseJSON(phones, []).map((phone) => ({
                country_code:
                    phone.countryCode ||
                    phone.country_code ||
                    '+91',
                number: phone.number,
            })),
            mailing_address: mailingAddress,
            country,
            state,
            city,
            website,
            reference_number: referenceNumber,
            emergency_contact_name: emergencyContactName,
            kyc_documents,
            updated_by: userId,
        };

        // Keep the existing photo unless a replacement is uploaded.
        if (newPhoto?.filename) {
            update.photo = newPhoto.filename;

            if (existing.photo && existing.photo !== newPhoto.filename) {
                filesToDelete.add(existing.photo);
            }
        }

        const updatedContact = await Contact.findOneAndUpdate(
            {
                _id: id,
                created_by: userId,
            },
            {
                $set: update,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedContact) {
            cleanupUploads();

            return res.status(404).json({
                success: false,
                message: 'Contact not found',
            });
        }

        // Remove obsolete files only after a successful DB update.
        filesToDelete.forEach((filename) => {
            removeFile(filename);
        });

        return successResponse(
            res,
            'Contact updated successfully',
            updatedContact
        );
    } catch (error) {
        cleanupUploads();
        next(error);
    }
};

