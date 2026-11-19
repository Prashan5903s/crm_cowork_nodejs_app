const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

function propertyUpload(
    allowedTypes,
    directFolder,
    folderArr,
    maxSizeMB = 30
) {
    // Assumes the app is started from the project root.
    const baseDir = path.join(process.cwd(), "public");

    // Create upload folders before accepting uploads.
    Object.values(directFolder).forEach((relativeFolder) => {
        const fullPath = path.join(baseDir, relativeFolder);
        fs.mkdirSync(fullPath, { recursive: true });
    });

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const relativeFolder = directFolder[file.fieldname];

            if (!relativeFolder) {
                return cb(new Error(`Invalid upload field: ${file.fieldname} `));
            }

            const fullPath = path.join(baseDir, relativeFolder);

            // Ensure the destination exists immediately before writing.
            fs.mkdir(fullPath, { recursive: true }, (err) => {
                if (err) return cb(err);
                cb(null, fullPath);
            });
        },

        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();

            const fieldName = file.fieldname
                .trim()
                .replace(/[^a-zA-Z0-9]/g, "");

            const uniqueName = `${fieldName}-${Date.now()}-${crypto.randomUUID()}${ext}`;

            cb(null, uniqueName);
        },
    });

    const fileFilter = (req, file, cb) => {
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error(
                    `Invalid file type for ${file.fieldname}: ${file.mimetype} `
                )
            );
        }

        cb(null, true);
    };

    const upload = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: maxSizeMB * 1024 * 1024,
            fields: 50,
            files: 26,
        },
    });

    return {
        uploadField: upload.fields(folderArr),
        uploadPaths: directFolder,
    };
}

module.exports = propertyUpload;