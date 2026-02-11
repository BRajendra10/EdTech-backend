import mongoose, { Schema } from 'mongoose';
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ["ADMIN", "INSTRUCTOR", "STUDENT"],
            required: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "PENDING", "SUSPENDED"],
            required: true,
        },
        avatar: {
            type: String,
            required: true,
        },
        avatarPublicId: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
            select: false,
        },
        refreshTokenExpiryAt: {
            type: Date,
            index: true,
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { _id: this._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

userSchema.plugin(aggregatePaginate);

export const User = mongoose.model("User", userSchema);