const multer = require('multer')
const path = require('path')
const fs = require('fs')

/**
 * Reusable Multer Upload Middleware for multiple files
 * * @param {string[]} allowedTypes
 * @param {string} folderName
 * @param {number} maxSizeMB
 * @returns {Object} Multer instance setup for array uploads
 */
function documentUpload (
  allowedTypes,
  folderName = 'documents',
  maxSizeMB = 500
) {
  const baseDir = path.join(__dirname, '..', 'public', folderName)

  // Ensure target directory exists
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true })
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, baseDir)
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      const timestamp = Math.floor(Date.now() / 1000)
      const sanitized = file.fieldname.replace(/[^A-Za-z0-9]/g, '')
      cb(null, `${sanitized}-${timestamp}${ext}`)
    }
  })

  const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'), false)
    }
  }

  const upload = multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter
  })

  return upload
}

module.exports = documentUpload
