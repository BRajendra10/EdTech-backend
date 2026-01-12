import mongoose, { Schema } from 'mongoose';

const courseSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        thumbnail: {
            type: String,
            required: true,
        },
        thumbnailPublicId: {
            type: String,
            required: true,
        },
        isFree: {
            type: Boolean,
            default: false,
        },
        price: {
            type: Number,
            min: 0,
        },
        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
    },
    {
        timestamps: true
    }
)

export const Course = mongoose.model("Course", courseSchema);