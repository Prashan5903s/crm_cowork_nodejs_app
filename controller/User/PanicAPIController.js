const {
    successResponse
} = require("../../util/response")

exports.getPanicNotify = async (req, res, next) => {
    try {

        return successResponse(res, "Panic set successfully!")

    } catch (error) {
        next(error)
    }
}