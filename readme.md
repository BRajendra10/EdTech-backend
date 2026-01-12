# LMS Admin Panel Backend

This is the **backend API** for a Learning Management System (LMS) admin panel.  
It is built with **Node.js, Express, and MongoDB (Mongoose)** and includes a **role-based authentication system**, **JWT security**, and **clean error & response handling**.

---

## Features

* **User Roles & Access**:

  * `ADMIN` – full access to all courses and user management
  * `INSTRUCTOR` – can create and manage own courses, limited access to assigned courses
  * `STUDENT` – enrolled in courses and track learning progress

* **Course Management**:

  * Create, update, and view courses
  * Assign courses to instructors
  * Free and paid courses
  * Course statuses: draft, published, archived

* **Modules & Lessons**:

  * Organize courses into modules
  * Add lessons with videos, duration, and resources
  * Structured ordering for learning paths

* **Enrollment & Progress Tracking**:

  * Students can enroll in courses
  * Track completion and progress per course
  * One enrollment per student per course

* **Account & Access Controls**:

  * Verified users only can access content
  * Blocked users cannot log in
  * Role-based access ensures proper permissions


## Tech Stack

- **Node.js** – server runtime
- **Express.js** – API framework
- **MongoDB (Mongoose)** – database and ODM
- **JWT** – authentication tokens
- **bcrypt** – password hashing
- **dotenv** – environment variable management
- **cookie-parser** – handle cookies
- **CORS** – cross-origin requests handling

---

## Folder Structure

```

backend/
|
├─ controllers       # req / res handling + bussiness logic
│
├─ models/           # Mongoose models
│   ├─ user.model.js
│   ├─ course.model.js
│   ├─ module.model.js
│   ├─ lesson.model.js
│   └─ enrollment.model.js
│
├─ middlewares/      # Express middlewares
│   ├─ error.middleware.js
│   └─ auth.middleware.js
│
├─ utils/            # Utility classes and functions
│   ├─ ApiError.js
│   ├─ ApiResponse.js
│   └─ asyncHandler.js
│
├─ routes/           # API route declarations
├─ db/               # Database connection
├─ server.js         # Express app initialization
└─ index.js          # Server bootstrap / DB connection

````


---

## Notes

* Current project uses **simple error messages** for frontend display.
    * Future projects may implement **errorCode for machine-readable error handling**.

* Designed with **scalability in mind**:
  * Easy to add roles, features, or new API routes
  * Centralized error & response handling ensures consistency

