import mongoose, { Schema } from 'mongoose';
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

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
            enum: ["DRAFT", "PUBLISHED", "UNPUBLISHED"],
            default: "DRAFT"
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

courseSchema.plugin(aggregatePaginate);

export const Course = mongoose.model("Course", courseSchema);