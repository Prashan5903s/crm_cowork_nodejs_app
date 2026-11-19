const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { errorResponse } = require("./response");

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGES = 10;
const MAX_DOCUMENTS = 5;

// Physical storage directory
const UPLOAD_ROOT = path.join(
    process.cwd(),
    "public",
    "uploads",
    "amenities"
);

const FIELD_CONFIG = {
    images: {
        folder: "images",
        mimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
        ],
        extensions: [".jpg", ".jpeg", ".png", ".webp"],
        label: "JPG, PNG or WEBP",
    },
    documents: {
        folder: "documents",
        mimeTypes: [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        extensions: [".pdf", ".docx"],
        label: "PDF or DOCX",
    },
};

// Create directories if they do not exist
Object.values(FIELD_CONFIG).forEach(({ folder }) => {
    fs.mkdirSync(path.join(UPLOAD_ROOT, folder), {
        recursive: true,
    });
});

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const config = FIELD_CONFIG[file.fieldname];

        if (!config) {
            return cb(new Error(`Unexpected field: ${file.fieldname} `));
        }

        cb(null, path.join(UPLOAD_ROOT, config.folder));
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        const base =
            path
                .basename(file.originalname, ext)
                .trim()
                .replace(/[^a-zA-Z0-9_-]/g, "_")
                .replace(/_+/g, "_")
                .replace(/^_+|_+$/g, "")
                .slice(0, 50) || "file";

        const unique = `${Date.now()}-${crypto
            .randomBytes(4)
            .toString("hex")}`;

        cb(null, `${base}-${unique}${ext}`);
    },
});

// Validate uploaded files
const fileFilter = (req, file, cb) => {
    const config = FIELD_CONFIG[file.fieldname];

    if (!config) {
        return cb(new Error(`Unexpected field: ${file.fieldname} `));
    }

    const ext = path.extname(file.originalname).toLowerCase();

    const valid =
        config.mimeTypes.includes(file.mimetype) &&
        config.extensions.includes(ext);

    if (!valid) {
        return cb(
            new Error(
                `Only ${config.label} files are allowed for ${file.fieldname}`
            )
        );
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_IMAGES + MAX_DOCUMENTS,
    },
}).fields([
    { name: "images", maxCount: MAX_IMAGES },
    { name: "documents", maxCount: MAX_DOCUMENTS },
]);

// Convert the physical file path to a relative URL
const getRelativeFilePath = (file) => {
    const config = FIELD_CONFIG[file.fieldname];

    return path.posix.join(
        "uploads",
        "amenities",
        config.folder,
        file.filename
    );
};

// Middleware
const uploadAmenity = (req, res, next) => {
    upload(req, res, (error) => {
        if (error) {
            const messages = {
                LIMIT_FILE_SIZE: "File is too large. Maximum size is 10MB",
                LIMIT_FILE_COUNT: "Too many files uploaded",
                LIMIT_UNEXPECTED_FILE:
                    "Too many files for this field or unexpected field name",
            };

            const message =
                error instanceof multer.MulterError
                    ? messages[error.code] || error.message
                    : error.message;

            return errorResponse(res, message, {}, 400);
        }

        // Store relative paths instead of absolute system paths
        req.uploadedFiles = {
            images: (req.files?.images || []).map(getRelativeFilePath),
            documents: (req.files?.documents || []).map(getRelativeFilePath),
        };

        next();
    });
};

module.exports = uploadAmenity;