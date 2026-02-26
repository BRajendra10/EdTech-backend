import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Course } from "../models/course.model.js";
import { notifyAdminDashboard, notifyUserDashboard } from "../utils/dashboardNotifier.js";

const GetEnrollments = asyncHandler(async (req, res) => {
    const { role, _id } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let matchStage = {};

    if (role === "STUDENT") {
        matchStage.userId = new mongoose.Types.ObjectId(_id);
    }

    const pipeline = [
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "courses",
                localField: "courseId",
                foreignField: "_id",
                as: "courseId",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            description: 1,
                            price: 1,
                            isFree: 1,
                            status: 1
                        }
                    }
                ]
            }
        },
        { $unwind: { path: "$courseId", preserveNullAndEmptyArrays: true } }
    ];

    if (role !== "STUDENT") {
        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userId",
                    pipeline: [
                        {
                            $project: {
                                fullName: 1,
                                email: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } }
        );
    }

    const enrollments = await Enrollment.aggregatePaginate(
        Enrollment.aggregate(pipeline),
        { page, limit }
    );

    const uniqueCoursesMap = new Map();

    enrollments?.docs?.forEach((enrollment) => {
        if (enrollment.courseId) {
            const courseId = enrollment.courseId._id.toString();

            uniqueCoursesMap.set(courseId, {
                _id: enrollment.courseId._id,
                title: enrollment.courseId.title
            });
        }
    });

    const uniqueCourses = Array.from(uniqueCoursesMap.values());

    return res.status(200).json(
        new ApiResponse(
            200,
            {enrollments, uniqueCourses},
            "Enrollments fetched successfully"
        )
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

    notifyAdminDashboard();
    notifyUserDashboard(userId);

    await newEnrollment.populate([
        { path: "userId", select: "avatar fullName role" },
        { path: "courseId" }
    ]);

    return res.status(201).json(
        new ApiResponse(201, newEnrollment, "Successfully enrolled into new course.")
    )
})

// TODO: Users list's enrolled in course -
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

// Update enrollment status function
const UpdateEnrollmentStatusByUser = asyncHandler(async (req, res) => {
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
    notifyUserDashboard(userId);
    notifyAdminDashboard();

    return res.status(200).json(
        new ApiResponse(200, enrollment, "Course completed successfully")
    );
});

// Update enrollment status function
const UpdateEnrollmentStatusByAdmin = asyncHandler(async (req, res) => {
    const { courseId, userId, status } = req.body;

    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    if (status === "COMPLETED") {
        throw new ApiError(400, "Invalid status");
    }

    if (!isValidObjectId(courseId) || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid IDs");
    }

    const enrollment = await Enrollment.findOne({ userId, courseId });

    if (!enrollment) {
        throw new ApiError(404, "Enrollment not found");
    }

    enrollment.status = status;
    await enrollment.save();
    notifyUserDashboard(userId);
    notifyAdminDashboard();

    await enrollment.populate([
        { path: "userId" },
        { path: "courseId" }
    ]);

    return res.status(200).json(
        new ApiResponse(200, enrollment, "Enrollment status updated successfully")
    )
});


export {
    GetEnrollments,
    EnrollNewUser,
    GetEnrolledStudents,
    UpdateEnrollmentStatusByUser,
    UpdateEnrollmentStatusByAdmin
}