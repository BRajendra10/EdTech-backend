import { Router } from "express";
import {
    EnrollNewUser,
    GetEnrolledStudents,
    CancelEnrollment,
    UpdateEnrollmentStatus
} from "../controllers/enrollment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authRole.middleware.js";

const router = Router();

/**
 * ============================
 * STUDENT ROUTES
 * ============================
 */

// Enroll into a course
router.post(
    "/enroll/:courseId",
    verifyJWT,
    EnrollNewUser
);

// Mark course as completed (system-driven / student-only)
router.patch(
    "/complete/:courseId",
    verifyJWT,
    UpdateEnrollmentStatus
);


/**
 * ============================
 * ADMIN / INSTRUCTOR ROUTES
 * ============================
 */

// Get all students enrolled in a course
router.get(
    "/course/:courseId/students",
    verifyJWT,
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    GetEnrolledStudents
);

// Soft cancel enrollment (ADMIN / INSTRUCTOR)
router.patch(
    "/cancel",
    verifyJWT,
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    CancelEnrollment
);

export default router;