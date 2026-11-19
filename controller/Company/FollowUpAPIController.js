const mongoose = require("mongoose")

const FollowUp = require("../../model/FollowUp")
const Lead = require("../../model/Leads")
const LeadStatus = require("../../model/LeadStatus")
const {
    successResponse
} = require("../../util/response")

const isId = v => mongoose.isValidObjectId(v)

const fail = (res, code, message) =>
    res.status(code).json({
        status: "Error",
        statusCode: code,
        message
    })

// _id === value stored in the DB, so the dialog <Select> values line up
const TYPES = [{
        _id: "calls",
        name: "Calls"
    },
    {
        _id: "emails",
        name: "Emails"
    },
    {
        _id: "meetings",
        name: "Meetings"
    },
    {
        _id: "whatsapp",
        name: "Whatsapp"
    },
]
const STATUSES = [{
        _id: "in_progress",
        name: "In progress"
    },
    {
        _id: "completed",
        name: "Completed"
    },
    {
        _id: "missed",
        name: "Missed"
    },
]
const PRIORITIES = [{
        _id: "low",
        name: "Low"
    },
    {
        _id: "medium",
        name: "Medium"
    },
    {
        _id: "high",
        name: "High"
    },
]

const has = (list, v) => list.some(i => i._id === v)

const toDate = v => {
    if (v === undefined || v === null || v === "") return null

    const d = new Date(v)

    return isNaN(d) ? undefined : d // undefined = invalid
}

/* Validates + normalises the body. Returns { error } or { data } */
const parseBody = (b = {}) => {
    const followUpDate = toDate(b.follow_up_date)
    const nextDate = toDate(b.next_follow_up_date)

    if (!followUpDate) return {
        error: "Valid follow up date is required"
    }
    if (nextDate === undefined) return {
        error: "Invalid next follow up date"
    }

    if (nextDate && nextDate < new Date(followUpDate.toISOString().slice(0, 10) + "T00:00:00")) {
        return {
            error: "Next follow up date cannot be before the follow up date"
        }
    }

    if (!isId(b.lead_status_id)) return {
        error: "Lead status is required"
    }
    if (!has(TYPES, b.follow_up_type)) return {
        error: "Invalid follow up type"
    }
    if (!has(STATUSES, b.status)) return {
        error: "Invalid follow up status"
    }
    if (!has(PRIORITIES, b.priority)) return {
        error: "Invalid priority"
    }

    let reminder = null

    if (b.reminder_before !== undefined && b.reminder_before !== null && b.reminder_before !== "") {
        reminder = Number(b.reminder_before)

        if (!Number.isFinite(reminder) || reminder < 0) return {
            error: "Invalid reminder"
        }
    }

    return {
        data: {
            follow_up_date: followUpDate,
            next_follow_up_date: nextDate,
            lead_status_id: b.lead_status_id,
            follow_up_type: b.follow_up_type,
            status: b.status,
            priority: b.priority,
            notes: b.notes ? String(b.notes).trim() : null,
            reminder_before: reminder,
        },
    }
}

// the lead's current status follows its latest follow up (this is what unlocks "Send proposal")
const syncLeadStatus = (leadId, statusId) =>
    Lead.updateOne({
        _id: leadId
    }, {
        $set: {
            status_id: statusId,
            updated_at: new Date()
        }
    })

/* GET /follow-up/create/data */
exports.getFollowUpCreateData = async (req, res, next) => {
    try {
        const leadStatusData = await LeadStatus.find({
            created_by: req.userId
        }).lean()

        return successResponse(res, "Follow up create data fetched successfully", {
            leadStatusData,
            followUpType: TYPES,
            followUpStatus: STATUSES,
            followUpPriority: PRIORITIES,
        })
    } catch (error) {
        next(error)
    }
}

/* GET /follow-up/lead/:leadId */
exports.getLeadFollowUps = async (req, res, next) => {
    try {
        const {
            leadId
        } = req.params

        if (!isId(leadId)) return fail(res, 400, "Invalid lead")

        const data = await FollowUp.find({
            lead_id: leadId
        }).sort({
            follow_up_date: 1,
            created_at: 1
        }).lean()

        return successResponse(res, "Follow ups fetched successfully", data)
    } catch (error) {
        next(error)
    }
}

/* POST /follow-up/post/:leadId */
exports.postFollowUp = async (req, res, next) => {
    try {
        const {
            leadId
        } = req.params

        if (!isId(leadId)) return fail(res, 400, "Invalid lead")

        const lead = await Lead.findById(leadId).select("_id").lean()

        if (!lead) return fail(res, 404, "Lead not found")

        const {
            error,
            data
        } = parseBody(req.body)

        if (error) return fail(res, 400, error)

        const followUp = await FollowUp.create({
            ...data,
            lead_id: lead._id,
            created_by: req.userId
        })

        await syncLeadStatus(lead._id, data.lead_status_id)

        return successResponse(res, "Follow up created successfully", followUp, 201)
    } catch (error) {
        if (error?.name === "ValidationError") return fail(res, 400, error.message)

        next(error)
    }
}

/* PUT /follow-up/put/data/:id */
exports.putFollowUp = async (req, res, next) => {
    try {
        const {
            id
        } = req.params

        if (!isId(id)) return fail(res, 400, "Invalid follow up")

        const {
            error,
            data
        } = parseBody(req.body)

        if (error) return fail(res, 400, error)

        const followUp = await FollowUp.findByIdAndUpdate(
            id, {
                $set: {
                    ...data,
                    updated_by: req.userId
                }
            }, {
                new: true,
                runValidators: true
            }
        )

        if (!followUp) return fail(res, 404, "Follow up not found")

        // only move the lead if this is its most recent follow up
        const latest = await FollowUp.findOne({
            lead_id: followUp.lead_id
        }).sort({
            created_at: -1
        }).select("_id").lean()

        if (latest && String(latest._id) === String(followUp._id)) {
            await syncLeadStatus(followUp.lead_id, data.lead_status_id)
        }

        return successResponse(res, "Follow up updated successfully", followUp)
    } catch (error) {
        if (error?.name === "ValidationError") return fail(res, 400, error.message)

        next(error)
    }
}