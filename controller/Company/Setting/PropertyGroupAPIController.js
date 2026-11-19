const PropertyGroup = require('../../../model/PropertyGroup');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getPropertyGroup = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const propertyGroup = await PropertyGroup.find({ created_by: userId })

        if (!propertyGroup) {
            return errorResponse(res, "Property group does not exist", {}, 404)
        }

        return successResponse(res, "Property group fetched successfully", propertyGroup)

    } catch (error) {
        next(error)
    }
}

exports.postPropertyGroup = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const propertyGroup = new PropertyGroup({
            name,
            created_by: userId
        })

        await propertyGroup.save()

        return successResponse(res, "Property group saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updatePropertyGroup = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const id = req.params.id;

        const propertyGroup = await PropertyGroup.findOne({ created_by: userId, _id: id })

        if (!propertyGroup) {
            return errorResponse(res, "Property group does not exist", {}, 404)
        }

        await PropertyGroup.findOneAndUpdate({ created_by: userId, _id: id }, {
            name
        })

        return successResponse(res, "Property group updated successfully")

    } catch (error) {
        next(error)
    }
}