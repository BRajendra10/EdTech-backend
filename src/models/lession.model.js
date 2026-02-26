import mongoose, { Schema } from 'mongoose';

const LessonSchema = new Schema(
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
        order: {
            type: Number,
            required: true,
        }
    },
    {
        timestamps: true,
    }
)

LessonSchema.index(
  { moduleId: 1, order: 1 },
  { unique: true }
);

export const Lesson = mongoose.model("Lesson", LessonSchema);