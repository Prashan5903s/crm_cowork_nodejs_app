const AmenityType = require('../../../model/AmenityType');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getAmenityType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const amenityType = await AmenityType.find({ created_by: userId })

        if (!amenityType) {
            return errorResponse(res, "Amenity type does not exist", {}, 404)
        }

        return successResponse(res, "Amenity type fetched successfully", amenityType)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const amenityType = new AmenityType({
            name,
            created_by: userId
        })

        await amenityType.save()

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

        const amenityType = await AmenityType.findOne({ created_by: userId, _id: id })

        if (!amenityType) {
            return errorResponse(res, "Amenity type does not exist", {}, 404)
        }

        await AmenityType.findOneAndUpdate({ created_by: userId, _id: id }, {
            name
        })

        return successResponse(res, "Amenity type updated successfully")

    } catch (error) {
        next(error)
    }
}