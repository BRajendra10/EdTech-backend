import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authRole.middleware.js";

import {
    addModule,
    getModuleById,
    updateModule,
    deleteModule
} from "../controllers/module.controller.js";


const router = Router();

router.use(verifyJWT)

/**
 * Create module (Admin + Instructor)
 * POST /api/v1/modules/:courseId
 */
router.post(
    "/:courseId",
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    addModule
);

/**
 * Get module by id 
 * GET /api/v1/modules/:moduleId
 */
router.get(
    "/:moduleId", 
    getModuleById
);

/**
 * Update module (Admin + Instructor)
 * PATCH /api/v1/modules/:moduleId
 */
router.patch(
    "/:moduleId",
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    updateModule
);

/**
 * Delete module (Admin + Instructor)
 * DELETE /api/v1/modules/:moduleId
 */
router.delete(
    "/:moduleId",
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    deleteModule
);

export default router;
