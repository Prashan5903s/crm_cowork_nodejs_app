const fs = require('fs')
const crypto = require('crypto')
const mongoose = require('mongoose')
const Complain = require('../../model/Complain')

const user = require("../../model/User")

const {
    successResponse,
    errorResponse
} = require('../../util/response')

const {
    STATUS,
    TICKET_TYPES
} = Complain

// Statuses an employee can set manually (Assigned is set by the assign action)
const CHANGEABLE_STATUS = [
    STATUS.OPEN,
    STATUS.IN_PROGRESS,
    STATUS.WAITING,
    STATUS.RESOLVED,
    STATUS.CLOSED
]

const ALL_STATUS = Object.values(STATUS)

const TICKET_TYPE_VALUES = TICKET_TYPES.map(t => t.value)

const USER_FIELDS = 'first_name last_name email'

// Random 6-digit code (100000-999999), generated with a secure RNG
const generateHappyCode = () => crypto.randomInt(100000, 1000000)

// Shape a DB document the way the front-end table expects it
const toRow = complain => {
    const history = Array.isArray(complain.history) ? complain.history : []
    const latest = history.length ? history[history.length - 1] : null

    return {
        ...complain,
        ticket_id: complain.complain_no,
        assigned_user: complain.assigned_to?.user || null,
        latest_complain_user: {
            complaint_status: complain.complain_status,
            remark: latest?.remark || ''
        },
        // newest first
        all_complain_users: [...history].reverse()
    }
}

/* -------------------------------------------------------------------------- */
/*  GET /complain/data/:status                                                */
/* -------------------------------------------------------------------------- */
exports.getComplainAPIController = async (req, res) => {
    try {

        const userId = req?.userId;

        const status = Number(req.params.status)

        if (!ALL_STATUS.includes(status)) {
            return errorResponse(res, 'Invalid status', {}, 400)
        }

        const complains = await Complain.find({
                company_id: userId,
                complain_status: status
            })
            // happy_code is not sent to the list
            .select('-happy_code')
            .populate('created_by', USER_FIELDS)
            .populate('assigned_to.user', USER_FIELDS)
            .populate('escalated_assigned_to.user', USER_FIELDS)
            .sort({
                created_at: -1
            })
            .lean()

        return successResponse(res, 'Complains fetched successfully', complains.map(toRow))
    } catch (error) {
        console.error('getComplainAPIController error:', error)

        return errorResponse(res, 'Failed to fetch tickets', {}, 500)
    }
}

/* -------------------------------------------------------------------------- */
/*  GET /complain/create  -> employees that a ticket can be assigned to       */
/* -------------------------------------------------------------------------- */
exports.getComplainCreateAPIController = async (req, res) => {
    try {

        const userId = req?.userId;

        const users = await user.find({
                created_by: userId
            })
            .select(USER_FIELDS)
            .sort({
                first_name: 1
            })
            .lean()

        return successResponse(res, 'Employees fetched successfully', users)
    } catch (error) {
        console.error('getComplainCreateAPIController error:', error)

        return errorResponse(res, 'Failed to fetch employees', {}, 500)
    }
}

/* -------------------------------------------------------------------------- */
/*  POST /complain/data/:id/:code                                             */
/*  code 1 = assign employee, code 2 = change status                          */
/* -------------------------------------------------------------------------- */
exports.postComplainAPIController = async (req, res) => {
    try {

        const userId = req?.userId;

        const {
            id
        } = req.params
        const code = Number(req.params.code)
        const {
            user,
            status
        } = req.body
        const remark = typeof req.body.remark === 'string' ? req.body.remark.trim() : ''

        if (!mongoose.isValidObjectId(id)) {
            return errorResponse(res, 'Invalid ticket id', {}, 400)
        }

        if (![1, 2].includes(code)) {
            return errorResponse(res, 'Invalid action', {}, 400)
        }

        if (remark.length > 5000) {
            return errorResponse(res, 'Remark is too long', {}, 400)
        }

        const complain = await Complain.findOne({
            _id: id,
            company_id: userId
        })

        if (!complain) {
            return errorResponse(res, 'Ticket not found', {}, 404)
        }

        if (complain.complain_status === STATUS.CLOSED) {
            return errorResponse(res, 'Closed tickets cannot be updated', {}, 409)
        }

        /* ----------------------------- assign employee ---------------------------- */
        if (code === 1) {
            if (complain.complain_status === STATUS.RESOLVED) {
                return errorResponse(res, 'Resolved tickets cannot be reassigned', {}, 409)
            }

            if (!user || !mongoose.isValidObjectId(user)) {
                return errorResponse(res, 'Employee is required', {}, 400)
            }

            // The employee must belong to the same company
            const employeeExists = await user.exists({
                _id: user,
                company_id: userId
            })

            if (!employeeExists) {
                return errorResponse(res, 'Employee not found', {}, 400)
            }

            complain.assigned_to = {
                user,
                remark
            }

            // Only an Open ticket moves to Assigned; reassigning keeps the current status
            if (complain.complain_status === STATUS.OPEN) {
                complain.complain_status = STATUS.ASSIGNED
            }

            complain.history.push({
                complaint_status: complain.complain_status,
                remark,
                assigned_user: user,
                updated_by: userId
            })
        }

        /* ------------------------------ change status ----------------------------- */
        if (code === 2) {
            const newStatus = Number(status)

            if (!CHANGEABLE_STATUS.includes(newStatus)) {
                return errorResponse(res, 'Invalid status', {}, 400)
            }

            complain.complain_status = newStatus

            complain.history.push({
                complaint_status: newStatus,
                remark,
                assigned_user: complain.assigned_to?.user,
                updated_by: userId
            })
        }

        await complain.save()

        return successResponse(res, 'Ticket updated successfully')
    } catch (error) {
        console.error('postComplainAPIController error:', error)

        return errorResponse(res, 'Failed to update ticket', {}, 500)
    }
}

/* -------------------------------------------------------------------------- */
/*  GET /complain/categories  -> STATIC ticket types                          */
/*  Kept only so the existing route keeps working; the front-end no longer    */
/*  calls it. You can delete this and its route.                              */
/* -------------------------------------------------------------------------- */
exports.getComplainCategoriesAPIController = async (req, res) => {
    return successResponse(res, 'Ticket types fetched successfully', TICKET_TYPES)
}

/* -------------------------------------------------------------------------- */
/*  POST /complain/create  (multipart/form-data, optional file: complain_img) */
/*  happy_code is generated here, it is NOT accepted from the client          */
/* -------------------------------------------------------------------------- */
exports.postComplainCreateAPIController = async (req, res) => {

    const userId = req?.userId;

    // Remove the uploaded file again when the request is rejected
    const reject = (status, message) => {
        if (req.file?.path) fs.unlink(req.file.path, () => {})

        return errorResponse(res, message, {}, status)
    }

    try {
        const {
            nature,
            complain_type,
            category,
            priority
        } = req.body
        const description = typeof req.body.description === 'string' ? req.body.description.trim() : ''

        if (!['1', '2'].includes(String(nature))) return reject(400, 'Nature is required')

        if (!['1', '2'].includes(String(complain_type))) return reject(400, 'Complain type is required')

        if (!TICKET_TYPE_VALUES.includes(String(category))) return reject(400, 'Ticket type is required')

        if (!['1', '2', '3'].includes(String(priority))) return reject(400, 'Priority is required')

        if (!description) return reject(400, 'Description is required')

        if (description.length > 5000) return reject(400, 'Description is too long')

        const complain = await Complain.create({
            company_id: userId,
            happy_code: generateHappyCode(),
            nature: Number(nature),
            complain_type: Number(complain_type),
            complain_img: req.file?.filename,
            description,
            priority: String(priority),
            category: String(category),
            created_by: userId,
            history: [{
                complaint_status: STATUS.OPEN,
                remark: 'Ticket created',
                updated_by: userId
            }]
        })

        return successResponse(
            res,
            'Complain added successfully', {
                _id: complain._id,
                ticket_id: complain.complain_no,
                happy_code: complain.happy_code
            },
            201
        )
    } catch (error) {
        console.error('postComplainCreateAPIController error:', error)

        return reject(500, 'Failed to add complain')
    }
}