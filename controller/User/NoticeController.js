const User = require('../../model/User')
const RoleUser = require('../../model/RoleUser')
const Notice = require('../../model/Notice');
const {
    errorResponse,
    successResponse
} = require('../../util/response');

exports.getNoticeController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const user = await User.findById(userId)
        const roleUser = await RoleUser.find({
            user_id: userId
        }).select('role_id')

        if (!user || !roleUser) {
            return errorResponse(res, "Data does not exist", {}, 404)
        }

        const masterId = user.created_by;
        const roleIds = roleUser.map(r => r.role_id.toString())

        const notice = await Notice.find({
            created_by: masterId,
            role_id: {
                $elemMatch: {
                    $in: roleIds
                }
            }
        }).select("-created_at -created_by");
        
        return successResponse(res, "Notice fetched successfully", notice)

    } catch (error) {
        next(error)
    }
}