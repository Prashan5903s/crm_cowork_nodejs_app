const Document = require('../../model/Document')

const { successResponse, errorResponse } = require('../../util/response')

exports.getDocument = async (req, res, next) => {
  try {
    const userId = req?.userId

    const documents = await Document.find({
      created_by: userId
    })

    if (!documents) {
      return errorResponse(res, 'No documents found', {}, 404)
    }

    return successResponse(res, 'Documents fetched successfully', documents)
  } catch (err) {
    next(err)
  }
}

exports.postDocument = async (req, res, next) => {
  try {
    const userId = req?.userId

    const { document_name, document_type } = req.body

    const uploadedFiles = req.files

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return errorResponse(
        res,
        'At least one document file is compulsory.',
        {},
        400
      )
    }

    // Map file metadata to precisely match Mongoose schema field names
    const fileRecords = uploadedFiles.map(file => ({
      file_name: file.filename, // Matches schema: file_name
      file_path: file.path, // Matches schema: file_path
      file_size: file.size, // Matches schema: file_size
      mime_type: file.mimetype // Matches schema: mime_type
    }))

    const newDocument = await Document.create({
      document_name,
      document_type,
      documents: fileRecords,
      created_by: userId
    })

    return successResponse(res, 'Document uploaded successfully', newDocument)
  } catch (error) {
    console.error(error)

    return errorResponse(
      res,
      'Internal server error',
      { error: error.message },
      500
    )
  }
}

exports.putDocument = async (req, res, next) => {
  try {
    const { id } = req.params
    const { document_name, document_type } = req.body

    // Extract uploaded files if any new ones were provided
    const newFiles = req.files
      ? req.files.map(file => ({
          name: file.originalname,
          path: file.path,
          size: file.size
        }))
      : []

    // Find the existing document
    const existingDoc = await Document.findById(id)

    if (!existingDoc) {
      return errorResponse(res, 'Document not found', {}, 404)
    }

    // Update fields
    existingDoc.document_name = document_name || existingDoc.document_name
    existingDoc.document_type = document_type || existingDoc.document_type

    // Append new files if uploaded, or keep existing ones
    if (newFiles.length > 0) {
      existingDoc.documents = [...existingDoc.documents, ...newFiles]
    }

    await existingDoc.save()

    return successResponse(res, 'Document updated successfully', existingDoc)
  } catch (err) {
    next(err)
  }
}
