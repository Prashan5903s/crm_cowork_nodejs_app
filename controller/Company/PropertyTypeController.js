const PropertyType = require('../../model/PropertyType');
const { errorResponse, successResponse } = require('../../util/response');

exports.getPropertyType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const propertyType = await PropertyType.find({ created_by: userId })

        if (!propertyType) {
            return errorResponse(res, "Property type does not exist", {}, 404)
        }

        return successResponse(res, "Property type fetched successfully", propertyType)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const propertyType = new PropertyType({
            name,
            created_by: userId
        })

        await propertyType.save()

        return successResponse(res, "Property type saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const id = req.params.id;

        const propertyType = await PropertyType.findOne({ created_by: userId, _id: id })

        if (!propertyType) {
            return errorResponse(res, "Property type does not exist", {}, 404)
        }

        await PropertyType.findOneAndUpdate({ created_by: userId, _id: id }, {
            name
        })

        return successResponse(res, "Property type updated successfully")

    } catch (error) {
        next(error)
    }
}