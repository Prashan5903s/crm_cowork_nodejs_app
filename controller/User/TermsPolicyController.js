const AppConfig = require('../../model/AppConfig')
const {
    errorResponse,
    successResponse
} = require('../../util/response')

exports.getTermsPolicyController = async (req, res, next) => {
    try {

        const appConfig = await AppConfig.findOne({
            type: "2"
        })

        if (!appConfig) {
            return errorResponse(res, "App Config does not exist", {}, 404)
        }

        return successResponse(res, "App config data fetched successfully", appConfig)

    } catch (error) {
        next(error)
    }
}