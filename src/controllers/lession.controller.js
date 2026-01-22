import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Module } from "../models/module.model.js";
import { Lesson } from "../models/lession.model.js";

import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// TODO: Add lession
// get all the fildes(moduelId title description order resources video thumbnail) and validate
// find if any module exist with this module id
// find any lession exist with module and order matching
// now upload thumbnail(optional) and video
// create lession
// return response

const addLession = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const { title, order } = req.body;

    if (!moduleId || !isValidObjectId(moduleId)) {
        throw new ApiError(400, "Valid moduleId is required !!");
    }

    if (!title || order === undefined) {
        throw new ApiError(400, "Title and order are required !!");
    }

    if (order < 0) {
        throw new ApiError(400, "Order must be a non-negative number !!");
    }

    const module = await Module.findById(moduleId);

    if (!module) {
        throw new ApiError(404, "Module not found !!");
    }

    const existingLesson = await Lesson.findOne({
        moduleId,
        order
    });

    if (existingLesson) {
        throw new ApiError(409, "Lesson already exists at this order !!");
    }

    let videoUpload;
    let thumbnailUpload;

    try {
        videoUpload = await uploadOnCloudinary(req.files.videoFile[0].path, "video");

        if (!videoUpload) {
            throw new ApiError(500, "Video upload failed !!");
        }

        if (req.files?.thumbnail) {
            thumbnailUpload = await uploadOnCloudinary(req.files.thumbnail[0].path, "image");
        }
    } catch (error) {
        if (videoUpload?.public_id) {
            await deleteFromCloudinary(videoUpload.public_id, "video");
        }
        if (thumbnailUpload?.public_id) {
            await deleteFromCloudinary(thumbnailUpload.public_id, "image");
        }
        throw error;
    }

    const lesson = await Lesson.create({
        moduleId,
        title,
        order,
        duration: videoUpload.duration,
        videoUrl: videoUpload.secure_url,
        videoPublicId: videoUpload.public_id,
        thumbnail: thumbnailUpload?.secure_url,
        thumbnailPublicId: thumbnailUpload?.public_id,
    });

    return res.status(201).json(
        new ApiResponse(201, lesson, "Lesson created successfully.")
    );
})

// TODO: Update lession
const updateLession = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const { title, resources } = req.body;

    if (!lessonId || !isValidObjectId(lessonId)) {
        throw new ApiError(400, "Valid lessonId is required !!");
    }

    if (
        title === undefined &&
        !req.files?.videoFile?.[0] &&
        !req.files?.thumbnail?.[0]
    ) {
        throw new ApiError(400, "At least one field is required to update !!");
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
        throw new ApiError(404, "Lesson not found !!");
    }

    let newVideoUpload;
    let newThumbnailUpload;

    // req.files?.videoFile?.[0]?.path

    try {
        if (req.files?.videoFile?.[0]) {
            newVideoUpload = await uploadOnCloudinary(req.files.videoFile[0].path, "video");

            if (!newVideoUpload) {
                throw new ApiError(500, "Video upload failed");
            }

            // delete old video
            if (lesson.videoPublicId) {
                await deleteFromCloudinary(lesson.videoPublicId);
            }

            lesson.videoUrl = newVideoUpload.secure_url;
            lesson.videoPublicId = newVideoUpload.public_id;
            lesson.duration = newVideoUpload.duration;
        }

        if (req.files?.thumbnail?.[0]) {
            newThumbnailUpload = await uploadOnCloudinary(req.files.thumbnail[0].path, "image");

            if (!newThumbnailUpload) {
                throw new ApiError(500, "Image upload failed");
            }

            // delete old video
            if (lesson.thumbnailPublicId) {
                await deleteFromCloudinary(lesson.thumbnailPublicId);
            }

            lesson.thumbnail = newThumbnailUpload.secure_url;
            lesson.thumbnailPublicId = newThumbnailUpload.public_id;
        }
    } catch (error) {
        if (newVideoUpload?.public_id) {
            await deleteFromCloudinary(newVideoUpload.public_id);
        }
        if (newThumbnailUpload?.public_id) {
            await deleteFromCloudinary(newThumbnailUpload.public_id);
        }
        throw error;
    }

    if (title !== undefined) lesson.title = title;

    await lesson.save();

    return res.status(200).json(
        new ApiResponse(200, lesson, "Lesson updated successfully")
    );
})

// TODO: Delete lession
// get lessonId and validate
// find lesson by id
// delete video and thumbnail from cloudinary
// delete lesson document
// return response

const deleteLession = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;

    if (!lessonId || !isValidObjectId(lessonId)) {
        throw new ApiError(400, "Valid lessonId is required !!");
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
        throw new ApiError(404, "Lesson not found !!");
    }

    try {
        if (lesson.videoPublicId) {
            await deleteFromCloudinary(lesson.videoPublicId);
        }

        if (lesson.thumbnailPublicId) {
            await deleteFromCloudinary(lesson.thumbnailPublicId);
        }
    } catch (error) {
        throw new ApiError(
            500,
            "Failed to delete lesson media or lesson data"
        );
    }

    await lesson.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, null, "Lesson deleted successfully")
    );
});

export { 
    addLession,
    updateLession,
    deleteLession
}