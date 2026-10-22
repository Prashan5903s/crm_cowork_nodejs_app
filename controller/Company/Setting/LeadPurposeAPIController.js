const LeadPurpose = require('../../../model/LeadPurpose');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getLeadPurpose = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const leadPurpose = await LeadPurpose.find({ created_by: userId })

        if (!leadPurpose) {
            return errorResponse(res, "Lead Source does not exist", {}, 404)
        }

        return successResponse(res, "Lead Source fetched successfully", leadPurpose)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const leadPurpose = new LeadPurpose({
            name,
            color,
            created_by: userId
        })

        await leadPurpose.save()

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

        const leadPurpose = await LeadPurpose.findOne({ created_by: userId, _id: id })

        if (!leadPurpose) {
            return errorResponse(res, "Lead Source does not exist", {}, 404)
        }

        await LeadPurpose.findOneAndUpdate({ created_by: userId, _id: id }, {
            name,
            color
        })

        return successResponse(res, "Lead Source updated successfully")

    } catch (error) {
        next(error)
    }
}