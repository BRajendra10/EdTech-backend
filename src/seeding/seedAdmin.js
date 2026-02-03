import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";

export const seedSuperAdmin = async () => {
    try {
        const adminEmail = process.env.SEEDING_EMAIL;
        const adminPassword = process.env.SEEDING_PASSWORD;

        if (!adminEmail || !adminPassword) {
            throw new ApiError(500, "Missing Seeding admin env credentials !!");
        }

        const adminExists = await User.findOne({ email: adminEmail });
        if (adminExists) {
            console.log("Super Admin already exist.");
            return;
        };

        await User.create({
            email: adminEmail,
            password: adminPassword,
            role: "ADMIN",
            status: "ACTIVE",
            isEmailVerified: true,
            isBlocked: false,
            fullName: process.env.SEEDING_NAME,
            avatar: process.env.SEEDING_AVATAR_URL,
            avatarPublicId: process.env.SEEDING_AVATAR_PUBLIC_ID,
        });

        console.log("✅ Super Admin created");
    } catch (err) {
        console.log("Seed error: ", err.message);
    }
};