import mongoose, { Schema } from "mongoose";

const passwordResetSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        hashedOtp: {
            type: String,
            required: true,
        },

        expiresAt: {
            type: Date,
            required: true,
            expires: 0, // TTL index (auto delete after expiresAt)
        },

        attempts: {
            type: Number,
            default: 0,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);