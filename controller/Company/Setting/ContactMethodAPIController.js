const ConatactMethod = require('../../../model/ContactMethod');
const { errorResponse, successResponse } = require('../../../util/response');

exports.getConatactMethod = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const conatactMethod = await ConatactMethod.find({ created_by: userId })

        if (!conatactMethod) {
            return errorResponse(res, "Conatact Method does not exist", {}, 404)
        }

        return successResponse(res, "Conatact Method fetched successfully", conatactMethod)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const conatactMethod = new ConatactMethod({
            name,
            color,
            created_by: userId
        })

        await conatactMethod.save()

        return successResponse(res, "Conatact Method saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, color } = req.body

        const id = req.params.id;

        const conatactMethod = await ConatactMethod.findOne({ created_by: userId, _id: id })

        if (!conatactMethod) {
            return errorResponse(res, "Conatact Method does not exist", {}, 404)
        }

        await ConatactMethod.findOneAndUpdate({ created_by: userId, _id: id }, {
            name,
            color
        })

        return successResponse(res, "Conatact Method updated successfully")

    } catch (error) {
        next(error)
    }
}