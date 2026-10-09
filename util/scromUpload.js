const multer = require('multer');
const path = require('path');
const fs = require('fs');

function generateCustomId(segmentCount = 4, segmentLength = 4) {
    const randomSegment = () =>
        Array.from({ length: segmentLength }, () =>
            String.fromCharCode(97 + Math.floor(Math.random() * 26)) // a-z
        ).join('');

    return Array.from({ length: segmentCount }, randomSegment).join('-');
}

function scromUpload(allowedMimeTypes, folderName, maxFileSizeMB) {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dest = path.join(__dirname, '..', 'public', folderName);
            fs.mkdirSync(dest, { recursive: true });
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();

            if (ext === '.zip') {
                const customId = generateCustomId();
                cb(null, `${customId}.zip`);
            } else {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `${uniqueSuffix}-${file.originalname}`);
            }
        }
    });

    const fileFilter = (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = file.mimetype;

        const allowedExtensions = allowedMimeTypes.map(type =>
            type.startsWith('.') ? type : null
        ).filter(Boolean);

        const allowedMimes = allowedMimeTypes.filter(type =>
            !type.startsWith('.')
        );

        if (allowedMimes.includes(mime) || allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${mime} (${ext})`), false);
        }
    };

    const upload = multer({
        storage,
        fileFilter,
        limits: { fileSize: maxFileSizeMB * 1024 * 1024 }
    });

    return {
        middleware: (fieldName) => [upload.single(fieldName)]
    };
}

module.exports = scromUpload;
