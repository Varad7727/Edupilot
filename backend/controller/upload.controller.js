const path = require("node:path")
const uploadToImageKit = require("../utils/imagekitUpload.utils")

// POST /teachers/uploads/pdf
const uploadPDF = async (req, res) => {
    try {
        //retrieve file
        const file = req.file
        if (!file) {
            return res.status(400).json({
                status: "failed",
                message: "Please select a PDF file to upload.",
            });
        }

        // Check the actual PDF signature, not just its MIME type.
        const pdfSignature = file.buffer.subarray(0, 5).toString()
        if (pdfSignature !== "%PDF-") {
            return res.status(400).json({
                status: "failed",
                message: "The uploaded file is not a valid PDF.",
            });
        }
        // Generate a safe filename instead of trusting the uploaded name.
        // Extract the original filename without its extension,
        // replace any character other than letters, numbers, underscores,
        // and hyphens with an underscore, and limit the name to 80 characters.
        const originalName = path
            .basename(file.originalname, path.extname(file.originalname))
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 80);

        // Create the final filename by using the cleaned original name.
        // If the cleaned name is empty, use "document" as the default.
        // Append the ".pdf" extension to the final filename.
        const fileName = `${originalName || "document"}.pdf`;

        const uploadFile = await uploadToImageKit({
            file,
            folder: "/edupilot/question-pdfs",
            fileName
        })
        return res.status(201).json({
            status: "success",
            message: "PDF uploaded successfully.",
            data: {
                file: uploadFile,
            },
        });
    } catch (error) {
        console.error("PDF upload error:", error);

        return res.status(502).json({
            status: "failed",
            message: "PDF upload failed. Please try again.",
        });
    }

}
// POST /teachers/uploads/image
const uploadQuestionImage = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                status: "failed",
                message: "Please select an image to upload.",
            });
        }

        // Validate the file signature as well as its MIME type.
        const bytes = file.buffer;

        const isJpeg =
            bytes.length >= 3 &&
            bytes[0] === 0xff &&
            bytes[1] === 0xd8 &&
            bytes[2] === 0xff;

        const isPng =
            bytes.length >= 8 &&
            bytes
                .subarray(0, 8)
                .equals(
                    Buffer.from([
                        0x89, 0x50, 0x4e, 0x47,
                        0x0d, 0x0a, 0x1a, 0x0a,
                    ])
                );

        const isWebp =
            bytes.length >= 12 &&
            bytes.subarray(0, 4).toString() === "RIFF" &&
            bytes.subarray(8, 12).toString() === "WEBP";

        const signatureMatchesMime =
            (file.mimetype === "image/jpeg" && isJpeg) ||
            (file.mimetype === "image/png" && isPng) ||
            (file.mimetype === "image/webp" && isWebp);

        if (!signatureMatchesMime) {
            return res.status(400).json({
                status: "failed",
                message:
                    "The uploaded file is not a valid JPEG, PNG, or WebP image.",
            });
        }

        const extensionByType = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        };

        const extension = extensionByType[file.mimetype];

        if (!extension) {
            return res.status(400).json({
                status: "failed",
                message: "Unsupported image format.",
            });
        }

        const uploadFile = await uploadToImageKit({
            file,
            folder: "/edupilot/question-images",
            fileName: `question-image${extension}`,
        });

        return res.status(201).json({
            status: "success",
            message: "Question image uploaded successfully.",
            data: { file: uploadFile },
        });
    } catch (error) {
        console.error("Question image upload error:", error);

        return res.status(502).json({
            status: "failed",
            message: "Image upload failed. Please try again.",
        });
    }
};

module.exports = {
    uploadPDF,
    uploadQuestionImage
};
