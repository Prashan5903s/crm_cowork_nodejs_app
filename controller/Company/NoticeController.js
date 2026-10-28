const Role = require('../../model/Role')
const {
    errorResponse,
    successResponse
} = require('../../util/response');

exports.getNoticeAPIController = async (req, res, next) => {
    try {

        const userId = req.userId;

        // Assuming you have Notice and Role models
        

    } catch (error) {
        next(error)
    }
}

exports.createNoticeAPI = async (req, res, next) => {
    try {


        const userId = req.userId;

        const role = await Role.find({
                created_by: {
                    $in: [userId, "6ac87727ca7c0ad2edab51f9"]
                }
            })
            .select('type name description status permissions created_by')
            .populate('company_id', 'first_name last_name email');

        if (!role) {
            return errorResponse(res, "Role does not exist", {}, 404)
        }

        return successResponse(res, "Role fetched successfull", role)

    } catch (error) {
        next(error)
    }
}

exports.postNoticeController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const imageUrl = req.file ? req.file.filename : '';

        const {
            title,
            description,
            role_id
        } = req.body

    

        return successResponse(res, "Notice saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateNoticeAPIController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const id = req.params.id;

        const imageUrl = req.file ? req.file.filename : '';

        const {
            title,
            description,
            role_id
        } = req.body


        return successResponse(res, "Notice updated successfully")

    } catch (error) {
        next(error)
    }
}