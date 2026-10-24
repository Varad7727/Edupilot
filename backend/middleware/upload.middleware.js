
const multer = require("multer");

const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

const storage = multer.memoryStorage();

const pdfUpload = multer({
    storage,
    limits: {
        fileSize: MAX_PDF_SIZE,
        files: 1,
    },
    fileFilter: (req, file, callback) => {
        if (file.mimetype !== "application/pdf") {
            return callback(new Error("Only PDF files are allowed."));
        }

        callback(null, true);
    },
});

const imageUpload = multer({
    storage,
    limits: {
        fileSize: MAX_IMAGE_SIZE,
        files: 1,
    },
    fileFilter: (req, file, callback) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return callback(
                new Error("Only JPEG, PNG, and WebP images are allowed.")
            );
        }

        callback(null, true);
    },
});

const videoUpload = multer({
    storage,
    limits: {
        fileSize: MAX_VIDEO_SIZE,
        files: 1,
    },
    fileFilter: (req, file, callback) => {
        const allowedTypes = [
            "video/mp4",
            "video/webm",
            "video/quicktime",
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return callback(
                new Error("Only MP4, WebM, and MOV videos are allowed.")
            );
        }

        callback(null, true);
    },
});

module.exports = {
    pdfUpload,
    imageUpload,
    videoUpload,
};
