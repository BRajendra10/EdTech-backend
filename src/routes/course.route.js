import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authRole.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import {
    addCourse,
    assignCourse,
    updateCourse,
    updateCourseStatus,
    getAllCourses,
    getCourseById
} from "../controllers/course.controller.js";

const router = Router();

router.use(verifyJWT)

// Get all courses (role-based filtering handled inside controller)
router.get(
    "/",
    getAllCourses
);

// Get single course by ID
router.get(
    "/:courseId",
    getCourseById
);

// Create a new course
router.post(
    "/add",
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    upload.single("thumbnail"),
    addCourse
);

// Assign course to instructor
router.post(
    "/assign",
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    assignCourse
);

// Update course details (title, description, thumbnail)
router.patch(
    "/",
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    upload.single("thumbnail"),
    updateCourse
);

// Update course status (DRAFT / PUBLISHED / UNPUBLISHED)
router.patch(
    "/status",
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    updateCourseStatus
);

export default router;
