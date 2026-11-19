const LeadStatus = require('../../../model/LeadStatus');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getLeadStatus = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const leadStatus = await LeadStatus.find({ created_by: userId })

        if (!leadStatus) {
            return errorResponse(res, "Lead status does not exist", {}, 404)
        }

        return successResponse(res, "Lead status fetched successfully", leadStatus)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const leadStatus = new LeadStatus({
            name,
            color,
            created_by: userId
        })

        await leadStatus.save()

        return successResponse(res, "Lead status saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const id = req.params.id;

        const leadStatus = await LeadStatus.findOne({ created_by: userId, _id: id })

        if (!leadStatus) {
            return errorResponse(res, "Lead status does not exist", {}, 404)
        }

        await LeadStatus.findOneAndUpdate({ created_by: userId, _id: id }, {
            name,
            color
        })

        return successResponse(res, "Lead status updated successfully")

    } catch (error) {
        next(error)
    }
}