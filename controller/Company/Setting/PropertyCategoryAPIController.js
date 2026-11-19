const PropertyCategory = require('../../../model/PropertyCategory');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getPropertyCategory = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const propertyCategory = await PropertyCategory.find({ created_by: userId })

        if (!propertyCategory) {
            return errorResponse(res, "Property category does not exist", {}, 404)
        }

        return successResponse(res, "Property category fetched successfully", propertyCategory)

    } catch (error) {
        next(error)
    }
}

exports.postCategory = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const propertyCategory = new PropertyCategory({
            name,
            created_by: userId
        })

        await propertyCategory.save()

        return successResponse(res, "Property category saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateCategory = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const id = req.params.id;

        const propertyCategory = await PropertyCategory.findOne({ created_by: userId, _id: id })

        if (!propertyCategory) {
            return errorResponse(res, "Property category does not exist", {}, 404)
        }

        await PropertyCategory.findOneAndUpdate({ created_by: userId, _id: id }, {
            name
        })

        return successResponse(res, "Property category updated successfully")

    } catch (error) {
        next(error)
    }
}