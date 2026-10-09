const Notice = require('../../model/Notice');
const Role = require('../../model/Role')
const {
    errorResponse,
    successResponse
} = require('../../util/response');

exports.getNoticeAPIController = async (req, res, next) => {
    try {

        const userId = req.userId;

        // Assuming you have Notice and Role models
        const notice = await Notice.find({
                created_by: userId
            })
            .populate({
                path: 'role_id', // the field to populate
                select: '_id name', // fields you want from Role
                model: 'roles', // must match the model name
            });


        if (!notice) {
            return errorResponse(res, "Notice does not exist", {}, 404)
        }

        return successResponse(res, "Notice fetched successfully", notice)

    } catch (error) {
        next(error)
    }
}

exports.createNoticeAPI = async (req, res, next) => {
    try {


        const userId = req.userId;

        const role = await Role.find({
                created_by: {
                    $in: [userId, "68bc14b6b297142d6bfe639c"]
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

        const notice = new Notice({
            title,
            description,
            image_url: imageUrl,
            role_id,
            created_by: userId
        })

        await notice.save()

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

        await Notice.findOneAndUpdate(({
            created_by: userId,
            _id: id
        }), {
            title,
            image_url: imageUrl,
            description,
            role_id
        })

        return successResponse(res, "Notice updated successfully")

    } catch (error) {
        next(error)
    }
}