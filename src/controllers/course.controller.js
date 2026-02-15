import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

import { Course } from "../models/course.model.js";

import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";


//TODO: Add new course

// First Check who is trying to create course(admin or instructor), student can't create course.
// validate all the fildes required for a course.
// upload video and thumbnail to cloudinary.
// set video and thumbnail with it's public id.
// CreatedBy will be our curent user(we already check that what role our curent user has).
// ** At this point we have course: title, description, video, thumbnail, video and thumbnail public ID(Cloudinary), by default we are making course free with no price, status by default will be draft. createdBy: who created course. **
// Return the response

const addCourse = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "All Fildes are required !!")
    }

    const existingCourse = await Course.findOne({ title });

    if (existingCourse) {
        throw new ApiError(409, "Course already exist !!")
    }

    const thumbnailLocalPath = req.file?.path;
    const imageFile = await uploadOnCloudinary(thumbnailLocalPath, "image");

    if (!imageFile?.secure_url) {
        throw new ApiError(400, "Somthing went wrong while uploading image !!")
    }

    const newCourse = await Course.create({
        title,
        description,
        thumbnail: imageFile.secure_url,
        thumbnailPublicId: imageFile.public_id,
        isFree: true,
        price: 0,
        status: "DRAFT",
        createdBy: req.user._id
    })

    if (!newCourse) {
        await deleteFromCloudinary(imageFile.public_id, "image")

        throw new ApiError(400, "Somethign went wrong while creating a new course !!")
    }

    await newCourse.populate("createdBy", "avatar fullName role")

    return res.status(201).json(
        new ApiResponse(201, newCourse, "New course added successfully.")
    )
})

// ===================================================================

//TODO: Assign course to instructor

// --> Course assigning:- every course first time created will be draft then if it's instructor created he will assign himself and it's admin either can aissign himself or assign to instroctor, but instroctor can't assign course to admin.

// Course first created then assigned to either himself(only admin or instructor) or someone(only admin or instructor).

// First get course id and validate
// Assign course
// return response

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
        throw new ApiError(400, "Course with this id doesn't exist !!")
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
})

// =================================================================

//TODO: Update course

// Fileds to update:- title, description, thumbnail
// validate fildes
// upload thumbanila and get
// update course data
// return response

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
})

// =================================================================

//TODO: Update course status

// only one filde to update status
// get status filde and update

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

    await course.populate([
        { path: "createdBy", select: "avatar fullName role" },
        { path: "assignedTo", select: "avatar fullName role" }
    ]);


    return res.status(200).json(
        new ApiResponse(200, course, "Course status updated successfully.")
    )
})

// ====================================================================

// TODO: Get All Course
// NOTE: When gettign all the course there can be multiple so we need pagination

// First get get page number and validate
// Create aggrigation pipeline without awating
// use mongoose agrrigate pagginate npm package for executing pipline with pagination
// then validate and return data

// FIXME: Not every one can access every course (FIXED)
// student can't access DRAFT and UNPUBLISHED course, student can only access to published and courses that he has enrolled in
// admin and instructor can access all courses

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


// ======================================================================

// TODO: Get single course
// FIXME: While getting all course we are checking if requesting user is STUDENT then only send PUBLISHED course but here while getting course by we are not checking anything that's a bug.
// ** WE HAVE DECIDE THAT WE WILL PRORTAZIE SECURITY OVER SPEED **

const getCourseById = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new ApiError(400, "Valid courseId is required !!")
    }

    const course = await Course.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(courseId),
                ...(req.user.role === "STUDENT" && { status: "PUBLISHED" })
            }
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
            $unwind: "$createdBy"
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
            $unwind: "$assignedTo"
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

// Get the course id and and validate
// find the course by id and validate
// puplate createdBy and assignedTo filde
// return the response

export {
    addCourse,
    assignCourse,
    updateCourse,
    updateCourseStatus,
    getAllCourses,
    getCourseById
}