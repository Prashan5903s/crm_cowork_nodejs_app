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
    let createdContactId

    try {
        const { contact, contact_id, lead } = JSON.parse(req.body.payload || '{}')
        const userId = req.user?._id // contact.created_by is required

        let contactId = contact_id

        if (contactId) {
            if (!(await Contact.exists({ _id: contactId }))) {
                return errorResponse(res, "Contact not found", {}, 404)
            }
        } else {
            const emails = (contact?.emails || []).map(e => e.toLowerCase())
            const phones = contact?.phones || []

            const dup = await Contact.findOne({
                $or: [
                    ...(emails.length ? [{ emails: { $in: emails } }] : []),
                    ...(phones.length ? [{ 'phones.number': { $in: phones.map(p => p.number) } }] : [])
                ]
            })

            if (dup) {
                return errorResponse(res, `A contact with this email or phone already exists (${dup.full_name}). Search for it instead.`, {}, 403)
            }

            const created = await Contact.create({
                ...contact,
                photo: req.file ? `uploads/${req.file.filename}` : undefined,
                created_by: userId
            })

            createdContactId = contactId = created._id
        }

        const doc = await Lead.create({
            ...lead,
            contact_id: contactId,
            commission_value: num(lead?.commission_value),
            commission_amount: num(lead?.commission_amount),
            created_by: userId
        })

        return successResponse(res, "Lead created", doc, 201)
    } catch (e) {
        if (createdContactId) await Contact.deleteOne({ _id: createdContactId }).catch(() => { }) // no orphan contact
        console.error(e)

        return errorResponse(
            res,
            e.message || "Could not create lead",
            {},
            e.name === 'ValidationError' ? 400 : 500
        )
    }
}

exports.getLeadList = async (req, res) => {
    try {
        const rows = await Lead.aggregate([
            { $sort: { created_at: -1 } },
            { $lookup: { from: 'contact', localField: 'contact_id', foreignField: '_id', as: 'contact' } }, // collection: "contact"
            { $unwind: '$contact' },
            { $lookup: { from: 'leadstatuses', localField: 'status_id', foreignField: '_id', as: 'status' } }, // <- your status collection
            { $unwind: { path: '$status', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    name: '$contact.full_name',
                    email: { $arrayElemAt: ['$contact.emails', 0] },
                    phone: { $arrayElemAt: ['$contact.phones.number', 0] },
                    lead_status_id: '$status_id',
                    lead_status: { status: '$status' }
                }
            }
        ])

        if (req.query.view !== 'kanban') return successResponse(res, "Success", rows, 200)

        const statuses = await Lead.db.collection('leadstatuses').find({}).sort({ order: 1 }).toArray() // <- same collection

        const data = statuses.map(s => ({
            status: s,
            leads: rows.filter(r => String(r.status_id) === String(s._id))
        }))

        return successResponse(res, "Success", data, 200)
    } catch (e) {
        console.error(e)

        return errorResponse(res, "Could not load leads", {}, 500)
    }
}