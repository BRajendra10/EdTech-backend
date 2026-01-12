import mongoose, { Schema } from 'mongoose';

const enrollmentSchema = new Schema(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
        },
        completed: {
            type: Boolean,
            default: false,
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    {
        timestamps: true
    }
)

enrollmentSchema.index(
    { studentId: 1, courseId: 1 },
    { unique: true }
);

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);