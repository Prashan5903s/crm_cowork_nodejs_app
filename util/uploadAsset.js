
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDirectory = path.join(
    process.cwd(),
    'public',
    'uploads',
    'assets'
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;

        cb(null, filename);
    },
});

const uploadAsset = multer({
    storage,

    limits: {
        files: 10,
        fileSize: 10 * 1024 * 1024, // 10 MB per file
    },

    fileFilter: (req, file, cb) => {
        // Accept any file type. Add an allowlist here if needed.
        cb(null, true);
    },
}).array('attachments', 10);

module.exports = { uploadAsset };
