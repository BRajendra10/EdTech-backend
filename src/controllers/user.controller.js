import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

import { User } from "../models/user.model.js";
import { EmailVerification } from "../models/emailVerification.model.js";
import { PasswordReset } from "../models/passwordReset.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendOtp } from "../utils/nodemailer.js";

import crypto from "crypto";
import jwt from "jsonwebtoken";

const accessTokenOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 1000 * 60 * 15
};

const refreshTokenOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 1000 * 60 * 60 * 24 * 15
}

const signup = asyncHandler(async (req, res) => {
    const { fullName, email, password, role } = req.body;

    if ([fullName, email, password, role].some(f => !f?.trim())) {
        throw new ApiError(400, "All Fileds are required !!")
    }

    if (role === "ADMIN") {
        throw new ApiError(403, "You can not singup as admin !!")
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(400, "User already exist, login !!")
    }

    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required !!");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath, "image");

    if (!avatar.secure_url) {
        throw new ApiError(400, "Somethign went wrong while uploading avatar !!")
    }

    const user = await User.create({
        fullName,
        email,
        password,
        role,
        status: "PENDING",
        avatar: avatar.secure_url,
        avatarPublicId: avatar.public_id,
    })

    if (!user) {
        throw new ApiError(400, "Failed to create a user !!")
    }

    const code = crypto.randomInt(100000, 1000000).toString();

    const verificationDataset = await EmailVerification.create({
        verificationCode: code,
        expiredAt: Date.now() + 1000 * 60 * 5,
        userId: user?._id,
    })

    await sendOtp(email, code, "Email Verification");

    if (!verificationDataset) {
        throw new ApiError(400, "Failed to set email verification credentials !!")
    }

    return res.status(201).json(
        new ApiResponse(201, {}, "Verify Email to login in to our system !!")
    )
});

const verifyOtp = asyncHandler(async (req, res) => {
    const { verificationCode, email } = req.body;

    if (!verificationCode || !email) {
        throw new ApiError(400, "All fileds are required !!")
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(400, "User doesn't exist !!");
    }

    const verificationDataset = await EmailVerification.findOne({ userId: user?._id });

    if (!verificationDataset) {
        throw new ApiError(400, "Invalid or expired OTP !!")
    }

    const isVerified =
        verificationDataset.verificationCode === verificationCode.toString().trim();

    if (!isVerified) {
        throw new ApiError(400, "Invalid Otp !!")
    }

    user.isEmailVerified = true;
    await user.save();

    await EmailVerification.deleteMany({ userId: user._id });

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Email Verified successfully")
        )
});

const resendVerificationOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "email is required !!")
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "Users doesn't exist !!")
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Your email is already verified, now login to explore our site.")
    }

    await EmailVerification.deleteMany({ userId: user?._id });

    const code = crypto.randomInt(100000, 1000000).toString();

    const verificationDataset = await EmailVerification.create({
        verificationCode: code,
        expiredAt: Date.now() + 1000 * 60 * 5, // 2 minutes
        userId: user?._id,
    });

    if (!verificationDataset) {
        throw new ApiError(400, "Failed to generate new otp !!")
    }

    await sendOtp(user.email, code);

    return res.status(201).json(
        new ApiResponse(201, {}, "Verification OTP resent successfully")
    )
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "All fileds are required !!")
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        throw new ApiError(400, "User doesn't exist !!")
    }

    if (user.status === "SUSPENDED") {
        throw new ApiError(403, "Account suspended, user can't access resourses !!");
    }

    if (user.status === "PENDING") {
        throw new ApiError(401, "Your account is not active !!")
    }

    if (!user.isEmailVerified) {
        throw new ApiError(400, "Please verify your email first");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid password !!")
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    if (!user.refreshTokenExpiryAt || user.refreshTokenExpiryAt < Date.now()) {
        user.refreshTokenExpiryAt = new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 30
        );
    }

    user.refreshToken = refreshToken;
    await user.save();

    const safeUser = await User.findById(user._id)
        .select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(
            new ApiResponse(200, safeUser, "Login successfully")
        )
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken ||
        req.headers.authorization?.replace("Bearer ", "");

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token missing, login");
    }

    let decoded;
    try {
        decoded = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decoded._id).select("+refreshToken");

    if (!user) {
        throw new ApiError(401, "User not found");
    }

    if (!user.refreshTokenExpiryAt || user.refreshTokenExpiryAt < Date.now()) {
        user.refreshToken = undefined;
        user.refreshTokenExpiryAt = undefined;

        throw new ApiError(401, "Session expired. Please login again.");
    }

    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh token mismatch");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.refreshTokenExpiryAt = new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 30
    );
    await user.save();

    return res
        .status(200)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(
            new ApiResponse(200, {}, "Login successfully")
        )
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Current and new passwords are required");
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isValid = await user.isPasswordCorrect(currentPassword);
    if (!isValid) {
        throw new ApiError(400, "Current password is incorrect");
    }

    user.password = newPassword;
    user.refreshToken = undefined;
    user.refreshTokenExpiryAt = undefined;
    await user.save();

    return res
        .status(200)
        .clearCookie("accessToken", { httpOnly: true, secure: true, sameSite: "None" })
        .clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "None" })
        .json(new ApiResponse(200, {}, "Password updated successfully."))
});

const logout = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Clear refresh token and absolute expiry in DB
    await User.findByIdAndUpdate(userId, {
        refreshToken: undefined,
        refreshTokenExpiryAt: undefined
    });

    // Clear cookies
    res.clearCookie("accessToken", { httpOnly: true, secure: true, sameSite: "None" });
    res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "None" });

    return res.status(200).json(
        new ApiResponse(200, {}, "Logged out successfully")
    );
});

// ==================================================

const updateUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "PENDING", "SUSPENDED"].includes(status)) {
        throw new ApiError(400, "Invalid status value");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Prevent admin self-suspension
    if (req.user._id.toString() === userId) {
        throw new ApiError(400, "You cannot change your own status");
    }

    user.status = status;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, user, "User status updated successfully")
    );
});

const getAllUsers = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query?.page) || 1, 1);
    const limit = Math.min(parseInt(req.query?.limit) || 10, 50);

    const { role, status, search } = req.query;

    let matchStage = {};

    if (role && role !== "ALL") {
        matchStage.role = role;
    }

    if (status && status !== "ALL") {
        matchStage.status = status;
    }

    if (search) {
        matchStage.$or = [
            {
                fullName: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                email: {
                    $regex: search,
                    $options: "i"
                }
            }
        ];
    }

    const aggregate = User.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                password: 0,
                refreshToken: 0,
                avatarPublicId: 0,
            }
        }
    ]);

    const users = await User.aggregatePaginate(aggregate, {
        page,
        limit
    });

    return res.status(200).json(
        new ApiResponse(200, users, "All users fetched successfully")
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });

    // Always return success (do not reveal existence)
    if (!user) {
        return res.status(200).json(
            new ApiResponse(200, {}, "If account exists, OTP sent to email")
        );
    }

    // Delete previous reset requests
    await PasswordReset.deleteMany({ userId: user._id });

    const otp = crypto.randomInt(100000, 1000000).toString();

    const hashedOtp = crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");

    await PasswordReset.create({
        userId: user._id,
        hashedOtp,
        expiresAt: Date.now() + 1000 * 60 * 10, // 10 minutes
    });

    await sendOtp(user.email, otp, "Password Reset");

    return res.status(200).json(
        new ApiResponse(200, {}, "If account exists, OTP sent to email")
    );
});

const verifyResetOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(400, "Invalid OTP");
    }

    const resetData = await PasswordReset.findOne({ userId: user._id });

    if (!resetData) {
        throw new ApiError(400, "OTP expired or invalid");
    }

    if (resetData.expiresAt < Date.now()) {
        await PasswordReset.deleteMany({ userId: user._id });
        throw new ApiError(400, "OTP expired");
    }

    if (resetData.attempts >= 5) {
        throw new ApiError(400, "Too many attempts");
    }

    const hashedOtp = crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");

    if (hashedOtp !== resetData.hashedOtp) {
        resetData.attempts += 1;
        await resetData.save();
        throw new ApiError(400, "Invalid OTP");
    }

    resetData.isVerified = true;
    await resetData.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "OTP verified")
    );
});

const resetPassword = asyncHandler(async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const resetData = await PasswordReset.findOne({ userId: user._id });

    if (!resetData || !resetData.isVerified) {
        throw new ApiError(400, "Unauthorized request");
    }

    user.password = newPassword;
    user.refreshToken = undefined;
    user.refreshTokenExpiryAt = undefined;
    await user.save();

    await PasswordReset.deleteMany({ userId: user._id });

    return res.status(200).json(
        new ApiResponse(200, {}, "Password reset successfully")
    );
});


export {
    signup,
    verifyOtp,
    login,
    resendVerificationOtp,
    refreshAccessToken,
    changeCurrentPassword,
    logout,
    updateUserStatus,
    getAllUsers,
    forgotPassword,
    verifyResetOtp,
    resetPassword
}