
const ContactCategory = require("../../../model/ContactCategory")
const { successResponse, errorResponse } = require("../../../util/response")

exports.getContactCategoryAPIController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const contactCategory = await ContactCategory.find({ created_by: userId })

        if (!contactCategory) {
            return errorResponse(res, "Contact Category does not exist", {}, 404)
        }

        return successResponse(res, "Contact category fetched successfully", contactCategory)

    } catch (error) {
        next(error)
    }
}

exports.postContactCategoryAPIController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const contactCategory = new ContactCategory({
            name,
            created_by: userId
        })

        await contactCategory.save()

        return successResponse(res, "Contact category saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.putContactCategoryAPIController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const id = req.params.id;

        const contactCategory = await ContactCategory.findOne({ created_by: userId, _id: id })

        if (!contactCategory) {
            return errorResponse(res, "Contact category does not exist", {}, 404)
        }

        await ContactCategory.findOneAndUpdate({ created_by: userId, _id: id }, {
            name
        })

        return successResponse(res, "Contact category updated successfully")

    } catch (error) {
        next(error)
    }
}