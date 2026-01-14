import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

import { User } from "../models/user.model.js";
import { EmailVerification } from "../models/emailVerification.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendOtp } from "../utils/nodemailer.js";

import crypto from "crypto";


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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(400, "User already exist, login !!")
    }

    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required !!");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Somethign went wrong while uploading avatar !!")
    }

    const user = await User.create({
        fullName,
        email,
        password,
        role,
        avatar: avatar.url,
        avatarPublicId: avatar.publicId,
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

    await sendOtp(email, code);

    if (!verificationDataset) {
        throw new ApiError(400, "Failed to set email verification credentials !!")
    }

    const safeUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(201).json(
        new ApiResponse(201, safeUser, "Verify Email to login in to our system !!")
    )
})

const verifyOtp = asyncHandler(async (req, res) => {
    const { verificationCode, userId } = req.body;

    if (!verificationCode || !userId) {
        throw new ApiError(400, "Verification code is required !!")
    }

    const verificationDataset = await EmailVerification.findOne({ userId });
    const user = await User.findById(userId);

    if (!verificationDataset) {
        throw new ApiError(400, "Invalid or expired OTP !!")
    }

    const isVerified =
        verificationDataset.verificationCode === verificationCode.toString().trim();


    if (!isVerified) {
        throw new ApiError(400, "Invalid Otp !!")
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.isEmailVerified = true;
    user.refreshToken = refreshToken;

    await user.save();

    await EmailVerification.deleteMany({ userId: user._id });

    return res
        .status(200)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(
            new ApiResponse(200, {}, "Email Verified successfully")
        )
})

const resendVerificationOtp = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if(!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "Valid userId is required !!")
    }

    const user = await User.findById(userId);

    if(!user){
        throw new ApiError(400, "User doesn't exist with this userId !!")
    }

    if(user.isEmailVerified){
        throw new ApiError(400, "Your email is already verified, you can explore our site.")
    }

    await EmailVerification.deleteMany({ userId });

    const code = crypto.randomInt(100000, 1000000).toString();

    const verificationDataset = await EmailVerification.create({
        verificationCode: code,
        expiredAt: Date.now() + 1000 * 60 * 5, // 2 minutes
        userId,
    });

    if(!verificationDataset){
        throw new ApiError(400, "Failed to generate new otp !!")
    }

    await sendOtp(user.email, code);

    return res.status(201).json(
        new ApiResponse(201, {}, "Verification OTP resent successfully")
    )    
})

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "All fileds are required !!")
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "User doesn't exist !!")
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

    user.refreshToken = refreshToken;
    await user.save();

    return res
        .status(200)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(
            new ApiResponse(200, {}, "Login successfully")
        )
})

export {
    signup,
    verifyOtp,
    login,
    resendVerificationOtp,
}