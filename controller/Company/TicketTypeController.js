const TicketType = require('../../model/TicketType');
const { errorResponse, successResponse } = require('../../util/response');

exports.getTicketType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const ticketType = await TicketType.find({ created_by: userId })

        if (!ticketType) {
            return errorResponse(res, "Apartment type does not exist", {}, 404)
        }

        return successResponse(res, "Apartment fetched successfully", ticketType)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const ticketType = new TicketType({
            name,
            created_by: userId
        })

        await ticketType.save()

        return successResponse(res, "Ticket type saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const id = req.params.id;

        const ticketType = await TicketType.findOne({ created_by: userId, _id: id })

        if (!ticketType) {
            return errorResponse(res, "Ticket type does not exist", {}, 404)
        }

        await TicketType.findOneAndUpdate({ created_by: userId, _id: id }, {
            name
        })

        return successResponse(res, "Ticket type updated successfully")

    } catch (error) {
        next(error)
    }
}