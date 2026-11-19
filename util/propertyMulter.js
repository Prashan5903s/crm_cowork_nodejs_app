const propertyUpload = require("./propertyUpload");

const directFolder = {
    photos: "uploads/property/photos",
    videos: "uploads/property/videos",
    ownership: "uploads/property/ownership",
    other: "uploads/property/other",
};

const folderArr = [
    { name: "photos", maxCount: 10 },
    { name: "videos", maxCount: 5 },
    { name: "ownership", maxCount: 1 },
    { name: "other", maxCount: 10 },
];

const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const { uploadField, uploadPaths } = propertyUpload(
    allowedTypes,
    directFolder,
    folderArr,
    30
);

module.exports = { uploadField, uploadPaths };
