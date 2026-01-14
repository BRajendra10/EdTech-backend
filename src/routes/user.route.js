import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { login, resendVerificationOtp, signup, verifyOtp } from "../controllers/user.controller.js";

const router = Router();

router.route("/signup").post(upload.single("avatar"), signup)
router.route("/verify-otp").post(verifyOtp)
router.route("/resend-verification-otp").post(resendVerificationOtp)
router.route("/login").post(login)

export default router