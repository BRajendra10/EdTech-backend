import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authRole.middleware.js"

import {
    changeCurrentPassword,
    getAllUsers,
    login,
    logout,
    refreshAccessToken,
    resendVerificationOtp,
    signup,
    updateUserStatus,
    verifyOtp
} from "../controllers/user.controller.js";

const router = Router();

router.route("/signup").post(upload.single("avatar"), signup)
router.route("/verify-otp").post(verifyOtp)
router.route("/resend-verification-otp").post(resendVerificationOtp)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/login").post(login)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/logout").post(verifyJWT, logout)

// ==================================================

router.route("/status/:userId").patch(verifyJWT, authorizeRoles("ADMIN"), updateUserStatus);
router.route("/all").get(verifyJWT, authorizeRoles("ADMIN"), getAllUsers)

export default router