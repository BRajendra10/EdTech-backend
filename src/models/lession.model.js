import mongoose, { Schema } from 'mongoose';

const lessonSchema = new Schema(
    {
        moduleId: {
            type: Schema.Types.ObjectId,
            ref: "Module",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        videoUrl: {
            type: String,
            required: true,
        },
        videoPublicId: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,
            required: true
        },
        resources: {
            type: String,
        },
        order: {
            type: Number,
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    },
    {
        timestamps: true,
    }
)

lessonSchema.index(
  { moduleId: 1, order: 1 },
  { unique: true }
);

export const Lesson = mongoose.model("Lesson", lessonSchema);