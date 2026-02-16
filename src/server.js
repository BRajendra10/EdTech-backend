import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


// routes
import userRouter from "./routes/user.route.js";
import courseRouter from "./routes/course.route.js";
import moduleRouter from "./routes/module.route.js";
import lessionRouter from "./routes/lession.route.js";
import enrollmentRouter from "./routes/enrollment.routes.js";

// route decleration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/courses", courseRouter)
app.use("/api/v1/modules", moduleRouter)
app.use("/api/v1/lessons", lessionRouter)
app.use("/api/v1/enrollments", enrollmentRouter)

app.use(errorHandler)

export { app }