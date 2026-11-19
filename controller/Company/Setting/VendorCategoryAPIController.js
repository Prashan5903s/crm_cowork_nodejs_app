const VendorCategory = require('../../../model/VendorCategory');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getVendorCategory = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const vendorCategory = await VendorCategory.find({ created_by: userId })

        if (!vendorCategory) {
            return errorResponse(res, "Vendor Category does not exist", {}, 404)
        }

        return successResponse(res, "Vendor Category fetched successfully", vendorCategory)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const vendorCategory = new VendorCategory({
            name,
            created_by: userId
        })

        await vendorCategory.save()

        return successResponse(res, "Vendor Category saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const id = req.params.id;

        const vendorCategory = await VendorCategory.findOne({ created_by: userId, _id: id })

        if (!vendorCategory) {
            return errorResponse(res, "Vendor Category does not exist", {}, 404)
        }

        await VendorCategory.findOneAndUpdate({ created_by: userId, _id: id }, {
            name,
        })

        return successResponse(res, "Vendor Category updated successfully")

    } catch (error) {
        next(error)
    }
}