const ContractDocumentType = require('../../../model/ContractDocumentType');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getContractDocumentType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const contractDocumentType = await ContractDocumentType.find({ created_by: userId })

        if (!contractDocumentType) {
            return errorResponse(res, "Contract Document Type does not exist", {}, 404)
        }

        return successResponse(res, "Contract Document Type fetched successfully", contractDocumentType)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const contractDocumentType = new ContractDocumentType({
            name,
            created_by: userId
        })

        await contractDocumentType.save()

        return successResponse(res, "Contract Document Type saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const id = req.params.id;

        const contractDocumentType = await ContractDocumentType.findOne({ created_by: userId, _id: id })

        if (!contractDocumentType) {
            return errorResponse(res, "Contract Document Type does not exist", {}, 404)
        }

        await ContractDocumentType.findOneAndUpdate({ created_by: userId, _id: id }, {
            name,
        })

        return successResponse(res, "Contract Document Type updated successfully")

    } catch (error) {
        next(error)
    }
}