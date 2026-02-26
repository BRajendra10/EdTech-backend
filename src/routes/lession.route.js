import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authRole.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import {
    addLession,
    updateLession,
    deleteLession
} from "../controllers/lession.controller.js";

const router = Router();

router.use(verifyJWT)


// Add lesson
router.post(
    "/:moduleId",
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    upload.single("videoFile"),
    addLession
);

// Update lesson
router.patch(
    "/:lessonId",
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    upload.single("videoFile"),
    updateLession
);

// Delete lesson
router.delete(
    "/:lessonId",
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    deleteLession
);

export default router;
