const Event = require("../../model/Event")
const User = require('../../model/User')
const RoleUser = require('../../model/RoleUser');
const {
    successResponse
} = require("../../util/response");

exports.getEventListAPIController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const user = await User.findById(userId)
        const roleUser = await RoleUser.find({
            user_id: userId
        }).select('role_id')

        if (!user || !roleUser) {
            return errorResponse(res, "Data does not exist", {}, 404)
        }

        const masterId = user.created_by;
        const roleIds = roleUser.map(r => r.role_id.toString())

        const event = await Event.find({
            created_by: masterId,
            $or: [{
                    user_id: userId
                },
                {
                    role_id: {
                        $in: roleIds
                    }
                }
            ]
        }).select("-created_at -created_by");

        return successResponse(res, "Event fetched successfully", event)

    } catch (error) {
        next(error)
    }
}