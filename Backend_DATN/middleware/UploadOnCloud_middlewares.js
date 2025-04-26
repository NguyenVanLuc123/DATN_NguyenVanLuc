const uploadCloudinary = require("../helper/uploadcloudDinary");

module.exports.upload = async (req, res, next) => {
  try {
    console.log("di qua day")
    if (req.files) {
    
      for (const field in req.files) {
        const filesArray = req.files[field]; // vì mỗi field có thể có nhiều file
        const urls = [];

        for (const file of filesArray) {
          const result = await uploadCloudinary(file.buffer);
          console.log(result);
          urls.push(result);
        }

        // Nếu mỗi field chỉ có 1 file, bạn có thể chỉ lấy cái đầu
        req.body[field] = urls.length === 1 ? urls[0] : urls; // Gán URL vào req.body
      }
    }
    next();
  } catch (error) {
    console.error("Upload Cloudinary error:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};