const mongoose = require("mongoose")

const Lead = require("../../model/Leads")
const LeadStatus = require("../../model/LeadStatus")
const LeadSource = require("../../model/LeadSource")
const LeadPurpose = require("../../model/LeadPurpose")
const LeadType = require("../../model/LeadType")
const Country = require("../../model/Country")
const Role = require("../../model/Role")
const LeadDocumentType = require("../../model/LeadDocumentType")
const LeadPropertyType = require("../../model/LeadPropertyType")
const ContactMethod = require("../../model/ContactMethod")
const Vendor = require("../../model/Vendor")
const ContactCategory = require("../../model/ContactCategory")
const Department = require("../../model/Department")
const Contact = require("../../model/Contact")
const { successResponse, errorResponse } = require("../../util/response")

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const num = v => (v === undefined || v === '' ? undefined : Number(v))
const phoneOf = c => (c.phones?.[0] ? `${c.phones[0].country_code || ''}${c.phones[0].number}` : '')

const KYC_TYPES = [
    "Aadhaar",
    "PAN",
    "Passport",
    "Driving License",
    "Voter ID",
    "GST",
];

const isPlainObject = v => v && typeof v === "object" && !Array.isArray(v)

// Fields the client must never set directly on a lead
const PROTECTED_LEAD_FIELDS = ["_id", "__v", "created_by", "created_at", "updated_at", "is_converted", "converted_at"]

const UNASSIGNED = { _id: "unassigned", title: "Unassigned", name: "Unassigned", color: "#9e9e9e" }

const join = (Model, localField, as) => [
    { $lookup: { from: Model.collection.name, localField, foreignField: "_id", as } },
    { $unwind: { path: `$${as}`, preserveNullAndEmptyArrays: true } }
]

exports.getSearchData = async (req, res) => {
    try {
        const q = String(req.query.q || '').trim()

        if (q.length < 2) return successResponse(res, "Success", [], 200)

        const rx = new RegExp(esc(q), 'i')

        const contacts = await Contact.find({
            $or: [{ full_name: rx }, { emails: rx }, { 'phones.number': rx }]
        }).limit(8).lean()

        const leads = await Lead.find({ contact_id: { $in: contacts.map(c => c._id) } }, 'contact_id').lean()
        const leadByContact = new Map(leads.map(l => [String(l.contact_id), l]))

        const data = contacts.flatMap(c => {
            const base = { name: c.full_name, email: c.emails?.[0], phone: phoneOf(c) }
            const lead = leadByContact.get(String(c._id))

            return [
                ...(lead ? [{ type: 'lead', _id: lead._id, ...base }] : []),
                { type: 'contact', ...c, ...base } // keeps contact _id + full_name, kyc_documents, state, city...
            ]
        })

        return successResponse(res, "Success", data, 200)
    } catch (e) {
        console.error(e)

        return errorResponse(res, "Search failed", {}, 500)
    }
}

exports.getLeadList = async (req, res) => {
    try {
        // route must be: router.get("/leads/data/:view", ...)
        const view = req.params?.view === "kanban" ? "kanban" : "table"

        const rows = await Lead.aggregate([
            { $sort: { created_at: -1 } },

            ...join(Contact, "contact_id", "contact"),
            ...join(LeadStatus, "status_id", "status"),
            ...join(LeadSource, "source_id", "source"),

            // Lookup KYC document types from the actual collection name
            {
                $lookup: {
                    from: "lead_document_type",
                    localField: "contact.kyc_documents.type",
                    foreignField: "_id",
                    as: "kyc_document_types"
                }
            },

            {
                $addFields: {
                    name: "$contact.full_name",

                    email: {
                        $arrayElemAt: [
                            { $ifNull: ["$contact.emails", []] },
                            0
                        ]
                    },

                    phone: {
                        $arrayElemAt: [
                            { $ifNull: ["$contact.phones.number", []] },
                            0
                        ]
                    },

                    country_code: {
                        $arrayElemAt: [
                            { $ifNull: ["$contact.phones.country_code", []] },
                            0
                        ]
                    },

                    company_name: {
                        $cond: [
                            { $eq: ["$contact.contact_type", "COMPANY"] },
                            "$contact.full_name",
                            null
                        ]
                    },

                    kyc: {
                        $map: {
                            input: {
                                $ifNull: ["$contact.kyc_documents", []]
                            },
                            as: "doc",
                            in: {
                                _id: "$$doc._id",
                                number: "$$doc.number",
                                file: "$$doc.file",
                                type: "$$doc.type",

                                document_type: {
                                    $ifNull: [
                                        {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$kyc_document_types",
                                                        as: "dt",
                                                        cond: {
                                                            $eq: [
                                                                "$$dt._id",
                                                                "$$doc.type"
                                                            ]
                                                        }
                                                    }
                                                },
                                                0
                                            ]
                                        },
                                        null
                                    ]
                                }
                            }
                        }
                    },

                    nationality: "$contact.nationality",
                    website: "$contact.website",
                    contact_type: "$contact.contact_type",
                    lead_status_id: "$status_id",
                    lead_status: {
                        status: "$status"
                    }
                }
            },

            {
                $project: {
                    contact: 0,
                    status: 0,
                    // kyc_document_types: 0
                }
            }
        ]);

        // TABLE: flat array
        if (view === "table") {
            return successResponse(res, "Success", rows, 200)
        }

        // KANBAN: [{ status, leads }]
        const statuses = await LeadStatus.find({}).sort({ order: 1 }).lean()

        const byStatus = new Map()
        for (const r of rows) {
            const key = r.status_id ? String(r.status_id) : "unassigned"
            if (!byStatus.has(key)) byStatus.set(key, [])
            byStatus.get(key).push(r)
        }

        const data = statuses.map(s => ({
            status: s,
            leads: byStatus.get(String(s._id)) || []
        }))

        // only show the Unassigned column if it has leads
        if (byStatus.has("unassigned")) {
            data.push({ status: UNASSIGNED, leads: byStatus.get("unassigned") })
        }

        return successResponse(res, "Success", data, 200)
    } catch (e) {
        console.error("getLeadList error:", e)
        return errorResponse(res, "Could not load leads", {}, 500)
    }
}

exports.getLeadCreateData = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const role = await Role.find({
            created_by: { $in: [userId, "6ac87727ca7c0ad2edab51f9"] }
        })
            .select('type name description status permissions created_by')
            .populate('company_id', 'first_name last_name email');

        const leadStatus = await LeadStatus.find({
            created_by: userId
        })

        const leadSource = await LeadSource.find({
            created_by: userId
        })

        const contactMethod = await ContactMethod.find({
            created_by: userId
        })

        const leadPurpose = await LeadPurpose.find({
            created_by: userId
        })

        const leadType = await LeadType.find({
            created_by: userId
        })

        const leadPropertyType = await LeadPropertyType.find({
            created_by: userId
        })

        const leadDocumentType = await LeadDocumentType.find({
            created_by: userId
        })

        const department = await Department.find({
            created_by: userId
        })

        const vendor = await Vendor.find({
            created_by: userId
        })

        const contactCategory = await ContactCategory.find({
            created_by: userId
        })

        const country = await Country.find()

        const leadPriority = [
            {
                _id: "high",
                name: "High"
            },
            {
                _id: "low",
                name: "Low"
            },
            {
                _id: "urgent",
                name: "Urgent"
            },
            {
                _id: "medium",
                name: "Medium"
            },
        ]

        const timelineData = [
            {
                _id: "immediata",
                name: "Immediate"
            },
            {
                _id: "30",
                name: "Within 30 days"
            },
            {
                _id: "60",
                name: "Within 60 days"
            },
            {
                _id: "90",
                name: "Within 90 days"
            },
            {
                _id: "120",
                name: "Within 120 days"
            }
        ]

        const finalData = {
            country,
            contactMethod,
            leadStatus,
            leadSource,
            leadPurpose,
            leadPriority,
            leadPropertyType,
            leadDocumentType,
            leadType,
            role,
            timelineData,
            department,
            contactCategory,
            vendor
        }

        return successResponse(res, "Lead create data fetched successfully", finalData)

    } catch (error) {
        next(error)
    }
}

exports.postCreateLead = async (req, res) => {
    let createdContactId = null;

    try {

        const payload = typeof req.body.payload === "string" ? JSON.parse(req.body.payload || "{}") : req.body.payload || {};

        const { contact, contact_id, lead, lead_id } = payload;
        const userId = req.userId;

        if (!userId || !mongoose.isValidObjectId(userId)) {

            return errorResponse(res, "User not authenticated", {}, 401);
        }

        if (!isPlainObject(lead)) {

            return errorResponse(res, "Valid lead data is required", {}, 400);
        }

        let contactId = contact_id;

        if (contactId) {

            if (!mongoose.isValidObjectId(contactId)) {

                return errorResponse(res, "Invalid contact ID", {}, 400);
            }

            const existingContact = await Contact.findById(contactId);

            if (!existingContact) {

                return errorResponse(res, "Contact not found", {}, 404);
            }
        } else {

            if (!isPlainObject(contact)) {

                return errorResponse(res, "Contact data is required", {}, 400);
            }

            const fullName = String(contact.full_name || contact.name || "").trim();

            if (!fullName) {

                return errorResponse(res, "Contact full_name is required", {}, 400);
            }

            const emails = (Array.isArray(contact.emails) ? contact.emails : [])
                .map(email => {
                    const value = typeof email === "string" ? email : email?.value;
                    return typeof value === "string" ? value.trim().toLowerCase() : "";
                })
                .filter(Boolean);

            const phones = (Array.isArray(contact.phones) ? contact.phones : [])
                .map(phone => {
                    if (typeof phone === "string") {
                        return {
                            country_code: "+91",
                            number: phone.trim(),
                        };
                    }

                    return {
                        country_code: phone?.country_code || "+91",
                        number: typeof phone?.number === "string" ? phone.number.trim() : "",
                    };
                })
                .filter(phone => phone.number);

            const rawKyc = Array.isArray(contact.kyc) ? contact.kyc : Array.isArray(contact.kyc_documents) ? contact.kyc_documents : [];

            const kycDocuments = rawKyc.map(document => {

                const documentTypeId = document.doc_type || document.type;
                const documentNumber = document.doc_number ?? document.number;

                if (!documentTypeId || !mongoose.isValidObjectId(documentTypeId)) {

                    throw new Error(`Invalid KYC document type ID: ${documentTypeId || "missing"}`);
                }

                return {
                    type: documentTypeId,
                    number: documentNumber != null ? String(documentNumber).trim() : "",
                    file: document.file || "",
                };
            });

            const contactData = {
                contact_type: contact.contact_type || "INDIVIDUAL",
                contact_category_id: contact.category_id || contact.contact_category_id || null,
                country: contact.country ?? contact.country_id ?? "",
                state: contact.state ?? contact.state_id ?? "",
                city: contact.city ?? contact.city_id ?? "",
                reference_number: contact.reference_number || "",
                full_name: fullName,
                nationality: contact.nationality || "",
                photo: req.file ? `uploads/${req.file.filename}` : contact.photo || "",
                emails,
                phones,
                kyc_documents: kycDocuments,
                mailing_address: contact.mailing_address ?? contact.address ?? "",
                website: contact.website || "",
                emergency_contact_name: contact.emergency_contact_name || "",
                created_by: userId,
            };

            const duplicateConditions = [];

            if (emails.length) {
                duplicateConditions.push({
                    emails: { $in: emails },
                });
            }

            if (phones.length) {
                duplicateConditions.push({
                    "phones.number": {
                        $in: phones.map(phone => phone.number),
                    },
                });
            }

            if (duplicateConditions.length) {
                const duplicate = await Contact.findOne({
                    $or: duplicateConditions,
                });

                if (duplicate) {

                    return errorResponse(res, `A contact with this email or phone already exists (${duplicate.full_name}). Search for it instead.`, {}, 409);
                }
            }

            const createdContact = await Contact.create(contactData);

            createdContactId = createdContact._id;
            contactId = createdContact._id;
        }

        const leadData = { ...lead };

        (PROTECTED_LEAD_FIELDS || []).forEach(field => {
            delete leadData[field];
        });

        const commissionValue = num(lead.commission_value);
        const commissionAmount = num(lead.commission_amount);

        delete leadData.commission_value;
        delete leadData.commission_amount;

        const leadToSave = {
            ...leadData,
            contact_id: contactId,
            created_by: userId,
        };

        if (commissionValue !== undefined) {
            leadToSave.commission_value = commissionValue;
        }

        if (commissionAmount !== undefined) {
            leadToSave.commission_amount = commissionAmount;
        }

        let savedLead;
        let statusCode;
        let message;

        if (lead_id) {
            if (!mongoose.isValidObjectId(lead_id)) {
                return errorResponse(res, "Invalid lead ID", {}, 400);
            }

            // Do not overwrite created_by when editing.
            const updateData = { ...leadToSave };
            delete updateData.created_by;

            savedLead = await Lead.findByIdAndUpdate(
                lead_id,
                { $set: updateData },
                {
                    new: true,
                    runValidators: true,
                }
            );

            if (!savedLead) {
                return errorResponse(res, "Lead not found", {}, 404);
            }

            statusCode = 200;
            message = "Lead updated successfully";
        } else {
            savedLead = await Lead.create(leadToSave);

            statusCode = 201;
            message = "Lead created successfully";
        }

        return successResponse(
            res,
            message,
            {
                lead: savedLead,
                contact_id: contactId,
            },
            statusCode
        );

    } catch (error) {

        if (createdContactId) {

            await Contact.deleteOne({ _id: createdContactId, }).catch(rollbackError => {
                console.error("Contact rollback failed:", rollbackError);
            });
        }

        const clientError = [
            "ValidationError",
            "CastError",
            "SyntaxError",
        ].includes(error.name);

        return errorResponse(res, error.message || "Could not create lead", {}, clientError ? 400 : 500);
    }
};
