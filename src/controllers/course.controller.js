import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

import { Course } from "../models/course.model.js";

import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { notifyAdminDashboard } from "../utils/dashboardNotifier.js";


const addCourse = asyncHandler(async (req, res) => {
    const { title, description, price, isFree   , status } = req.body;

    if (!title || !description || !status) {
        throw new ApiError(400, "All Fildes are required !!")
    }

    const existingCourse = await Course.findOne({ title });

    if (existingCourse) {
        throw new ApiError(409, "Course already exist !!")
    }

    const course = {
        title,
        description,
        price,
        isFree,
        status,
        createdBy: req.user._id
    }

    if(req.user.role === "INSTRUCTOR") {
        course.assignedTo = req.user._id;
    }

    if (!req.file?.path) {
        throw new ApiError(400, "Thumbnail image is required !!");
    }

    const thumbnailLocalPath = req.file?.path;
    const imageFile = await uploadOnCloudinary(thumbnailLocalPath, "image");

    if (!imageFile?.secure_url) {
        throw new ApiError(400, "Somthing went wrong while uploading image !!")
    }

    const newCourse = await Course.create({
        ...course,
        thumbnail: imageFile.secure_url,
        thumbnailPublicId: imageFile.public_id,
    })

    if (!newCourse) {
        await deleteFromCloudinary(imageFile.public_id, "image")

        throw new ApiError(400, "Somethign went wrong while creating a new course !!")
    }

    notifyAdminDashboard();
    await newCourse.populate("createdBy", "avatar fullName role")

    return res.status(201).json(
        new ApiResponse(201, newCourse, "New course added successfully.")
    )
});

const assignCourse = asyncHandler(async (req, res) => {
    const { courseId, userId } = req.body;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new ApiError(400, "Course id is required and should be valid !!")
    }

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "User id is required and should be valid !!")
    }

    const course = await Course.findById(courseId);

    if (!course) {
        throw new ApiError(400, "Course doesn't exist !!")
    }

    if (course?.assignedTo) {
        throw new ApiError(409, "This course is already assigned to someone, can't assign again !!")
    }

    course.assignedTo = userId;
    await course.save();

    await course.populate([
        { path: "createdBy", select: "avatar fullName role" },
        { path: "assignedTo", select: "avatar fullName role" }
    ]);

    return res.status(200).json(
        new ApiResponse(200, course, "Course assigned successfully.")
    )
});

const updateCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.body;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new ApiError(400, "Course id is required and should be valid !!")
    }

    const course = await Course.findById(courseId);

    if (!course) {
        throw new ApiError(404, "Course not found !!");
    }

    if (typeof req.body?.title === "string") {
        course.title = req.body?.title.trim();
    }

    if (typeof req.body?.description === "string") {
        course.description = req.body?.description.trim()
    }

    if (req.file?.path) {
        const imageFile = await uploadOnCloudinary(req.file?.path, "image");

        if (!imageFile?.secure_url) {
            throw new ApiError(400, "Somthing went wrong while uploading image !!")
        }

        await deleteFromCloudinary(course.thumbnailPublicId, "image");

        course.thumbnail = imageFile?.secure_url
        course.thumbnailPublicId = imageFile?.public_id
    }

    await course.save();

    await course.populate([
        { path: "createdBy", select: "avatar fullName role" },
        { path: "assignedTo", select: "avatar fullName role" }
    ]);

    return res.status(200).json(
        new ApiResponse(200, course, "Course credentials updated successfully.")
    )
});

const updateCourseStatus = asyncHandler(async (req, res) => {
    const { courseId, status } = req.body;

    if (!["DRAFT", "PUBLISHED", "UNPUBLISHED"].includes(status)) {
        throw new ApiError(400, "Invalid Status !!")
    }

    if (!courseId || !isValidObjectId(courseId)) {
        throw new ApiError(400, "Valid course Id is required !!")
    }

    const course = await Course.findById(courseId);

    if (!course) {
        throw new ApiError(400, "Course with this id doesn't exist !!")
    }

    course.status = status;
    await course.save();
    notifyAdminDashboard();
    
    await course.populate([
        { path: "createdBy", select: "avatar fullName role" },
        { path: "assignedTo", select: "avatar fullName role" }
    ]);


    return res.status(200).json(
        new ApiResponse(200, course, "Course status updated successfully.")
    )
});

const getAllCourses = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query?.page) || 1, 1);
    const { role } = req.user;
    const { status, search } = req.query;

    let matchStage = {};

    if (role === "STUDENT") {
        matchStage.status = "PUBLISHED";
    }

    if (status && status !== "ALL") {
        matchStage.status = status;
    }

    if (search) {
        matchStage.title = {
            $regex: search,
            $options: "i"
        };
    }

    const pipeline = Course.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy"
            }
        },
        { $unwind: "$createdBy" }
    ]);

    const result = await Course.aggregatePaginate(pipeline, {
        page,
        limit: 20
    });

    return res.status(200).json(
        new ApiResponse(200, result, "Courses fetched successfully")
    );
});

const getCourseById = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new ApiError(400, "Valid courseId is required !!")
    }

    const matchStage = {
        _id: new mongoose.Types.ObjectId(courseId),
    };

    if (req.user.role === "STUDENT") {
        matchStage.status = "PUBLISHED";
    }

    const course = await Course.aggregate([
        {
            $match: matchStage,
        },
        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy"
            }
        },
        {
            $unwind: {
                path: "$createdBy",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                as: "assignedTo"
            }
        },
        {
            $unwind: {
                path: "$assignedTo",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "modules",
                localField: "_id",
                foreignField: "courseId",
                as: "modules",
                pipeline: [
                    {
                        $lookup: {
                            from: "lessons",
                            localField: "_id",
                            foreignField: "moduleId",
                            as: "lessons",
                        }
                    }
                ],
            }
        },
        {
            $project: {
                "createdBy.password": 0,
                "createdBy.refreshToken": 0,
                "assignedTo.password": 0,
                "assignedTo.refreshToken": 0,
            }
        }
    ])

    if (!course.length) {
        throw new ApiError(404, "No course found or access denied")
    }

    return res.status(200).json(
        new ApiResponse(200, course, "Course fetched successfully.")
    )
});

export {
    addCourse,
    assignCourse,
    updateCourse,
    updateCourseStatus,
    getAllCourses,
    getCourseById
}