const LeadSource = require('../../../model/LeadSource');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getLeadSource = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const leadSource = await LeadSource.find({ created_by: userId })

        if (!leadSource) {
            return errorResponse(res, "Lead Source does not exist", {}, 404)
        }

        return successResponse(res, "Lead Source fetched successfully", leadSource)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const leadSource = new LeadSource({
            name,
            color,
            created_by: userId
        })

        await leadSource.save()

        return successResponse(res, "Lead Source saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const id = req.params.id;

        const leadSource = await LeadSource.findOne({ created_by: userId, _id: id })

        if (!leadSource) {
            return errorResponse(res, "Lead Source does not exist", {}, 404)
        }

        await LeadSource.findOneAndUpdate({ created_by: userId, _id: id }, {
            name,
            color
        })

        return successResponse(res, "Lead Source updated successfully")

    } catch (error) {
        next(error)
    }
}