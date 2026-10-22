const LeadType = require('../../../model/LeadType');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getLeadType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const leadSource = await LeadType.find({ created_by: userId })

        if (!leadSource) {
            return errorResponse(res, "Lead Type does not exist", {}, 404)
        }

        return successResponse(res, "Lead Type fetched successfully", leadSource)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const leadSource = new LeadType({
            name,
            color,
            created_by: userId
        })

        await leadSource.save()

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

        const leadSource = await LeadType.findOne({ created_by: userId, _id: id })

        if (!leadSource) {
            return errorResponse(res, "Lead Type does not exist", {}, 404)
        }

        await LeadType.findOneAndUpdate({ created_by: userId, _id: id }, {
            name,
            color
        })

        return successResponse(res, "Lead Type updated successfully")

    } catch (error) {
        next(error)
    }
}