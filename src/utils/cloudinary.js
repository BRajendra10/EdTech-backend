import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export const uploadOnCloudinary = async (localFilePath, resourceType) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType,
            folder: "EdTech"
        })

        fs.unlinkSync(localFilePath);

        return response
    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
}

export const deleteFromCloudinary = async (publicId, resourceType) => {
    try {
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        return response;
    } catch (error) {
        return null;
    }
}