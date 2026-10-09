const User = require('../../model/User');
const {
    successResponse,
    errorResponse
} = require('../../util/response');

exports.postProfileAPIController = async (req, res, next) => {
    try {

        const userId = req.userId;

        // Use the uploaded file if it exists
        const imageUrl = req.file ? req.file.filename : '';

        await User.findByIdAndUpdate(userId, {
            photo: imageUrl
        })

        const user = await User.findById(userId)

        return successResponse(res, "Profile image updated successfully", user?.photo)

    } catch (error) {
        next(error)
    }
}

exports.postProfileChangeDataController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const status = req?.params?.status;

        const {
            name,
            phone
        } = req.body

        const user = await User.findById(userId)

        if (!user) {
            return errorResponse(res, "User does not exist", {}, 404)
        }

        if (status == "neighbour") {
            await User.findByIdAndUpdate(userId, {
                neighbour_data: {
                    name,
                    phone
                }
            })
        } else if(status == "friend")  {
            await User.findByIdAndUpdate(userId, {
                friend_relative_data: {
                    name,
                    phone
                }
            })
        }

        return successResponse(res, "User data saved successfully")

    } catch (error) {
        next(error)
    }
}