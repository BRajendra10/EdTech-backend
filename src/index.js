import 'dotenv/config'
import mongoose from "mongoose";
import connectDB from "./db/database.js";
import { app } from './server.js';

connectDB()
    .then(() => {
        app.on("error", (error) => {
            throw error
        })

        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on PORT: ${process.env.PORT}`)
        })
    })
    .catch((error) => {
        console.log("Mongodb connection failed", error);
        process.exit(1);
    })