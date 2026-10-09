const mongoose = require('mongoose')

const societyDocumentSchema = new mongoose.Schema(
  {
    document_name: {
      type: String,
      required: true
    },

    document_type: {
      type: String,
      required: true
    },

    documents: [
      {
        file_name: {
          type: String,
          required: true
        },
        file_path: {
          type: String,
          required: true
        },
        file_size: {
          type: Number
        },
        mime_type: {
          type: String
        },
        uploaded_at: {
          type: Date,
          default: Date.now
        }
      }
    ],

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },

    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
)

module.exports = mongoose.model('society_document', societyDocumentSchema)
