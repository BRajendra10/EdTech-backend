import mongoose, { Schema } from 'mongoose';

const emailVerificationSchema = new Schema(
    {
        verificationCode: {
            type: String,
            required: true,
            index: true,
        },
        expiredAt: {
            type: Date,
            required: true,
            expires: 0, 
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
        }
    },
    {
        timestamps: true
    }
)

export const EmailVerification = mongoose.model("EmailVerification", emailVerificationSchema);