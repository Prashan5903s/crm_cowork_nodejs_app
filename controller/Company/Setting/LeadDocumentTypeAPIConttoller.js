const LeadDocumentType = require('../../../model/LeadDocumentType');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getLeadDocumentType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const leadDocumentType = await LeadDocumentType.find({ created_by: userId })

        if (!leadDocumentType) {
            return errorResponse(res, "Lead Document Type does not exist", {}, 404)
        }

        return successResponse(res, "Lead Document Type fetched successfully", leadDocumentType)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const leadDocumentType = new LeadDocumentType({
            name,
            color,
            created_by: userId
        })

        await leadDocumentType.save()

        return successResponse(res, "Lead Document Type saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const id = req.params.id;

        const leadDocumentType = await LeadDocumentType.findOne({ created_by: userId, _id: id })

        if (!leadDocumentType) {
            return errorResponse(res, "Lead Document Type does not exist", {}, 404)
        }

        await LeadDocumentType.findOneAndUpdate({ created_by: userId, _id: id }, {
            name,
            color
        })

        return successResponse(res, "Lead Document Type updated successfully")

    } catch (error) {
        next(error)
    }
}