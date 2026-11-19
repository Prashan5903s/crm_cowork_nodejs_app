const User = require('../../model/User')
const Document = require('../../model/Document')
const { successResponse, errorResponse } = require('../../util/response')

exports.getDocumentAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId
    const user = await User.findById(userId)

    if (!user) {
      return errorResponse(res, 'User not found', {}, 404)
    }

    const masterId = user?.created_by

    const documents = await Document.find({
      created_by: masterId
    }).sort({ created_at: -1 }) // Sort documents by creation date in descending order

    if (!documents) {
      return errorResponse(res, 'No documents found', {}, 404)
    }

    return successResponse(res, 'Documents fetched successfully', documents)
  } catch (err) {
    next(err)
  }
}
