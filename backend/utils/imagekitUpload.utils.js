
const imagekit = require("../config/imagekit");

const uploadToImageKit = async ({
    file,
    folder,
    fileName,
}) => {
    if (!file || !file.buffer) {
        throw new Error("A valid uploaded file is required.");
    }

    if (!folder || !fileName) {
        throw new Error("Upload folder and file name are required.");
    }

    const result = await imagekit.upload({
        file: file.buffer,
        fileName,
        folder,
        useUniqueFileName: true,
    });

    return {
        fileId: result.fileId,
        name: result.name,
        url: result.url,
        filePath: result.filePath,
        size: result.size,
        fileType: file.mimetype,
    };
};

module.exports = uploadToImageKit;

// Why we’re doing this
// - Accepts files already received by Multer.
// - Uploads them to the specified ImageKit folder.
// - Returns metadata we can save in MongoDB later.
// - Avoids duplicating upload code across controllers.