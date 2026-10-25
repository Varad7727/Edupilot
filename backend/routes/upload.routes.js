
const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
    authTeacherMiddleware,
} = require("../middleware/auth.middleware");

const {
    pdfUpload,
    imageUpload,
} = require("../middleware/upload.middleware");

const {
    uploadPDF,
    uploadQuestionImage,
} = require("../controller/upload.controller");

// POST /teachers/uploads/pdf
router.post(
    "/pdf",
    authTeacherMiddleware,
    pdfUpload.single("file"),
    uploadPDF
);

// POST /teachers/uploads/image
router.post(
    "/image",
    authTeacherMiddleware,
    imageUpload.single("file"),
    uploadQuestionImage
);

// Handle Multer and upload-validation errors.
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        const statusCode =
            error.code === "LIMIT_FILE_SIZE" ||
            error.code === "LIMIT_FILE_COUNT"
                ? 413
                : 400;

        return res.status(statusCode).json({
            status: "failed",
            message:
                statusCode === 413
                    ? "The upload exceeds the allowed file limit."
                    : "The uploaded file could not be accepted.",
        });
    }

    if (error) {
        return res.status(400).json({
            status: "failed",
            message: error.message || "Invalid upload.",
        });
    }

    next();
});

module.exports = router;
