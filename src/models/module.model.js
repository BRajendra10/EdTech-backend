import mongoose, { Schema } from 'mongoose';

const moduleSchema = new Schema(
    {
        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
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
        order: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
)

moduleSchema.index(
  { courseId: 1, order: 1 },
  { unique: true }
);


export const Module = mongoose.model("Module", moduleSchema);