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
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    addLession
);

// Update lesson
router.patch(
    "/:lessonId",
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    updateLession
);

// Delete lesson
router.delete(
    "/:lessonId",
    authorizeRoles("ADMIN", "INSTRUCTOR"),
    deleteLession
);

export default router;
