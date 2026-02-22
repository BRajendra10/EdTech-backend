import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Course } from "../models/course.model.js";

const GetEnrollments = asyncHandler(async (req, res) => {
    const { role, _id } = req.user;

    let enrollments;

    if (role === "STUDENT") {
        // Student: Fetch only their own enrollments
        enrollments = await Enrollment.find({ userId: _id })
            .populate({
                path: "courseId",
                select: "title thumbnail description price isFree status"
            })
            .sort({ createdAt: -1 });
    } else {
        // Admin/Instructor: Fetch all enrollments in the system
        enrollments = await Enrollment.find({})
            .populate({
                path: "userId",
                select: "fullName email avatar"
            })
            .populate({
                path: "courseId",
                select: "title thumbnail"
            })
            .sort({ createdAt: -1 });
    }

    return res.status(200).json(
        new ApiResponse(200, enrollments, "Enrollments fetched successfully")
    );
});

// TODO: Enroll user into a course
const EnrollNewUser = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user?._id;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new ApiError(400, "Valid course ID is required !!")
    }

    const course = await Course.findById(courseId);

    if (!course || course.status !== "PUBLISHED") {
        throw new ApiError(403, "You cannot enroll in this course");
    }

    const existingEnrollment = await Enrollment.findOne({ userId, courseId });

    if (existingEnrollment) {
        throw new ApiError(400, "You have already enrolled into this course !!")
    }

    const newEnrollment = await Enrollment.create({
        userId,
        courseId,
        status: "ACTIVE",
        progress: 0
    })

    if (!newEnrollment) {
        throw new ApiError(400, "Somethign went wrong while enrollment !!")
    }


    await newEnrollment.populate([
        { path: "userId", select: "avatar fullName role" },
        { path: "courseId" }
    ]);

    return res.status(201).json(
        new ApiResponse(201, newEnrollment, "Successfully enrolled into new course.")
    )
})


// TODO: Users list's enrolled in course
const GetEnrolledStudents = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new ApiError(400, "Valid course ID is required !!")
    }

    const EnrolledStudents = await Enrollment.aggregate([
        {
            $match: {
                courseId: new mongoose.Types.ObjectId(courseId),
                status: { $ne: "CANCELLED" }
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: '$user'
        },
        {
            $project: {
                _id: 1,
                status: 1,
                progress: 1,
                completedAt: 1,
                createdAt: 1,

                "user._id": 1,
                "user.fullName": 1,
                "user.avatar": 1,
                "user.email": 1,
                "user.role": 1,
            },
        },
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            EnrolledStudents,
            "Enrolled students fetched successfully"
        )
    );
})

// Cancel Enrollment function
const CancelEnrollment = asyncHandler(async (req, res) => {
    const { userId, courseId } = req.body;

    if (!isValidObjectId(userId) || !isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid IDs");
    }

    const enrollment = await Enrollment.findOne({ userId, courseId });

    if (!enrollment) {
        throw new ApiError(404, "Enrollment not found");
    }

    enrollment.status = "CANCELLED";
    await enrollment.save();

    return res.status(200).json(
        new ApiResponse(200, enrollment, "Enrollment cancelled successfully")
    );
});

// Update enrollment status function
const UpdateEnrollmentStatus = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user._id;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new ApiError(400, "Valid course ID is required");
    }

    const enrollment = await Enrollment.findOne({ userId, courseId });

    if (!enrollment) {
        throw new ApiError(404, "Enrollment not found");
    }

    // system-only logic
    enrollment.status = "COMPLETED";
    enrollment.completedAt = new Date();

    await enrollment.save();

    return res.status(200).json(
        new ApiResponse(200, enrollment, "Course completed successfully")
    );
});


export {
    GetEnrollments,
    EnrollNewUser,
    GetEnrolledStudents,
    CancelEnrollment,
    UpdateEnrollmentStatus
}