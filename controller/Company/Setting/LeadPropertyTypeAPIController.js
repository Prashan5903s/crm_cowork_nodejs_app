const LeadPropertyType = require('../../../model/LeadPropertyType');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getLeadType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const leadType = await LeadPropertyType.find({ created_by: userId })

        if (!leadType) {
            return errorResponse(res, "Lead Type does not exist", {}, 404)
        }

        return successResponse(res, "Lead Type fetched successfully", leadType)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const leadType = new LeadPropertyType({
            name,
            color,
            created_by: userId
        })

        await leadType.save()

        return successResponse(res, "Lead Type saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const id = req.params.id;

        const leadType = await LeadPropertyType.findOne({ created_by: userId, _id: id })

        if (!leadType) {
            return errorResponse(res, "Lead Type does not exist", {}, 404)
        }

        await LeadPropertyType.findOneAndUpdate({ created_by: userId, _id: id }, {
            name,
            color
        })

        return successResponse(res, "Lead Type updated successfully")

    } catch (error) {
        next(error)
    }
}