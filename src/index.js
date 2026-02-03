import 'dotenv/config'
import mongoose from "mongoose";
import connectDB from "./db/database.js";
import { app } from './server.js';
import { seedSuperAdmin } from './seeding/seedAdmin.js';

connectDB()
    .then(async () => {
        app.on("error", (error) => {
            throw error
        })

        await seedSuperAdmin();

        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on PORT: ${process.env.PORT}`)
        })
    })
    .catch((error) => {
        console.log("Mongodb connection failed", error);
        process.exit(1);
    })