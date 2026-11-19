const User = require('../../model/User');
const { errorResponse, successResponse } = require('../../util/response');

exports.getCameraController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const user = await User.findById(userId)

        if (!user) {
            return errorResponse(res, "User do not exist")
        }

        const camera = user?.cameras;

        return successResponse(res, "Camera fetched successfully", camera)

    } catch (error) {
        next(error)
    }
}