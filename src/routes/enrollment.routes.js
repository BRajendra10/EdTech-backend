import { Router } from "express";
import {
    EnrollNewUser,
    GetEnrolledStudents,
    UpdateEnrollmentStatusByAdmin,
    GetEnrollments,
    UpdateEnrollmentStatusByUser
} from "../controllers/enrollment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authRole.middleware.js";

const router = Router();

/**
 * ============================
 * STUDENT ROUTES
 * ============================
 */

// Get enrollments (Role-based: Student gets own, Admin gets all)
router.get(
    "/", 
    verifyJWT, 
    GetEnrollments
);


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
    UpdateEnrollmentStatusByUser
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

// Soft enrollment status update: ACTIVE, CANCELLED (ADMIN / INSTRUCTOR)
router.patch(
    "/status",
    verifyJWT,
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    UpdateEnrollmentStatusByAdmin
);

export default router;