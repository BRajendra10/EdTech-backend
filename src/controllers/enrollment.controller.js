import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Course } from "../models/course.model.js";

// TODO: Enroll user into a course
// 
// Get all the required fildes(userId, courseId) and validate
//
// NOTE: In Initial state:
//  * we will store userID and courseId
//  * Status will be set by default / we will set to ACTIVE
//  * Progress will also set to default(0) / we will set to 0
//  * completedAt and completedLessons will be empty
//
// Check if courseId is valid and enrolling course should be pubslihed not anything else.
// Check if any enrollment exist with same userId and courseId
// Then create one

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
//
// First get courseId an validate
// Create a aggrigation pipeline
// Get all enrollment
// lookup for user with userId
// Validate Then return full list with enrollment details, user populate details

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

// TODO: Update enrollment status
//
// NOTE: Enrollment status update is not easy
//
//  * STUDENT user can only send ACTIVE status while enrollment and COMPLETED when course completed
//  * ADMIN OR INSTRUCTOR can send CANCELLED status for specific user
//
// FIXME:  ** On Status ACTIVE and COMPLETED userId represent our student but when status is CANCELLED userId should indected student but we are doing req.user._id which leed us to admin and it's critical bug. Solution is to create seperate controller function one for student who will send ACTIVE and COMPLETED and second for ADMIN and INSTRUCTOR who will send CANCELLED, this way it will be easy to add role based access/ ristriction **

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
    EnrollNewUser, 
    GetEnrolledStudents,
    CancelEnrollment,
    UpdateEnrollmentStatus
}