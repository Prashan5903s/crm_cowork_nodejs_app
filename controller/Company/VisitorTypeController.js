const VisitorType = require('../../model/VisitorType');
const { errorResponse, successResponse } = require('../../util/response');

exports.getVisitorType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const visitorType = await VisitorType.find({ created_by: userId })

        if (!visitorType) {
            return errorResponse(res, "Apartment type does not exist", {}, 404)
        }

        return successResponse(res, "Apartment fetched successfully", visitorType)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const visitorType = new VisitorType({
            name,
            created_by: userId
        })

        await visitorType.save()

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

        const visitorType = await VisitorType.findOne({ created_by: userId, _id: id })

        if (!visitorType) {
            return errorResponse(res, "Visitor type does not exist", {}, 404)
        }

        await VisitorType.findOneAndUpdate({ created_by: userId, _id: id }, {
            name
        })

        return successResponse(res, "Visitor type updated successfully")

    } catch (error) {
        next(error)
    }
}