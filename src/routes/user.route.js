import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { 
    changeCurrentPassword, 
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
router.route("/update-user-status").patch(verifyJWT, updateUserStatus)

export default router