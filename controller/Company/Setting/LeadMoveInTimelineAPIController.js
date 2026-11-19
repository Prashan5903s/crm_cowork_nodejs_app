const LeadMoveInTimeline = require('../../../model/LeadMoveInTimeline');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getLeadMoveInLine = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const leadMoveInTimeline = await LeadMoveInTimeline.find({ created_by: userId })

        if (!leadMoveInTimeline) {
            return errorResponse(res, "Lead Move In Timeline does not exist", {}, 404)
        }

        return successResponse(res, "Lead Move In Timeline fetched successfully", leadMoveInTimeline)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const leadMoveInTimeline = new LeadMoveInTimeline({
            name,
            color,
            created_by: userId
        })

        await leadMoveInTimeline.save()

        return successResponse(res, "Lead Move In Timeline saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const id = req.params.id;

        const leadMoveInTimeline = await LeadMoveInTimeline.findOne({ created_by: userId, _id: id })

        if (!leadMoveInTimeline) {
            return errorResponse(res, "Lead Move In Timeline does not exist", {}, 404)
        }

        await leadMoveInTimeline.findOneAndUpdate({ created_by: userId, _id: id }, {
            name,
            color
        })

        return successResponse(res, "Lead Move In Timeline updated successfully")

    } catch (error) {
        next(error)
    }
}