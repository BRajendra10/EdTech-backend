import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import jwt from 'jsonwebtoken';

export const verifyJWT = asyncHandler(async (req, res, next) => {
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization) {
        token = req.headers.authorization.replace("Bearer ", "");
    }

    if (!token) {
        throw new ApiError(401, "Login before using the resources !!")
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Session expired. Please login again.");
    }
    const user = await User.findById(decoded._id);

    if (user.isBlocked) {
        throw new ApiError(403, "Your account has been blocked");
    }

    if (!user) {
        throw new ApiError(401, "unauthorized request !!")
    }

    req.user = user;
    next();
});