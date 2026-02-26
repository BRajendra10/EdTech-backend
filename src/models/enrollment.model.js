import mongoose, { Schema } from 'mongoose';
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const enrollmentSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
        },
        status: {
            type: String,
            enum: ["ACTIVE", "COMPLETED", "CANCELLED"],
            required: true,
            default: "ACTIVE"
        },
        completedLessons: [
            {
                type: Schema.Types.ObjectId,
                ref: "Lesson",
            }
        ],
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        completedAt: {
            type: Date,
        }
    },
    {
        timestamps: true
    }
)

enrollmentSchema.index(
    { userId: 1, courseId: 1 },
    { unique: true }
);

enrollmentSchema.plugin(aggregatePaginate);

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);