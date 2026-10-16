const AssetCategory = require('../../../model/AssetCategory');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getAssetCategory = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const assetCategory = await AssetCategory.find({ created_by: userId })

        if (!assetCategory) {
            return errorResponse(res, "Asset category does not exist", {}, 404)
        }

        return successResponse(res, "Asset category fetched successfully", assetCategory)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const assetCategory = new AssetCategory({
            name,
            created_by: userId
        })

        await assetCategory.save()

        return successResponse(res, "Amenity type saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const id = req.params.id;

        const assetCategory = await AssetCategory.findOne({ created_by: userId, _id: id })

        if (!assetCategory) {
            return errorResponse(res, "Amenity type does not exist", {}, 404)
        }

        await AssetCategory.findOneAndUpdate({ created_by: userId, _id: id }, {
            name
        })

        return successResponse(res, "Asset category updated successfully")

    } catch (error) {
        next(error)
    }
}