# LMS Admin Panel Backend 🚀

This repository contains the **backend API** for a **Learning Management System (LMS) Admin Panel**, designed to handle **users, courses, enrollments, modules, and lessons** with **role-based access control**.

Built using **Node.js, Express, and MongoDB (Mongoose)**, the project follows **clean architecture principles**, centralized error handling, and secure authentication using **JWT**.

**Privew:** [Privew](https://drive.google.com/file/d/1zXOpIP9RiClN1xvF_3alwe3NP_GN4pad/view?usp=drivesdk)  

---

## ✨ Key Highlights

* **Role-based Authentication & Authorization**
* **Secure JWT-based login system**
* **Modular, scalable project structure**
* **Consistent API response & error format**
* **Designed for real-world LMS workflows**

---

## 🔐 Authentication & Roles

The system supports **three user roles**, each with clearly defined permissions:

### Roles

| Role           | Permissions                                                      |
| -------------- | ---------------------------------------------------------------- |
| **ADMIN**      | Full access to users, courses, modules, lessons, and enrollments |
| **INSTRUCTOR** | Create & manage own courses, modules, and lessons                |
| **STUDENT**    | Enroll in courses and track learning progress                    |

### Access Controls

* Only **verified users** can access protected routes
* **Blocked users** are prevented from logging in
* Role checks are enforced via middleware

---

## 📚 Course Management

* Create, update, and view courses
* Assign instructors to courses
* Supports **free & paid courses**
* Course lifecycle management:

  * `DRAFT`
  * `PUBLISHED`
  * `ARCHIVED`

---

## 🧩 Modules & Lessons

Courses are structured for better learning flow:

### Modules

* Belong to a specific course
* Ordered sequence for learning paths

### Lessons

* Belong to modules
* Include:

  * Video URL
  * Duration
  * Resources (links / files)
* Strict ordering inside modules

---

## 🧑‍🎓 Enrollment & Progress Tracking

* Students can enroll in published courses
* **One enrollment per student per course**
* Tracks:

  * Enrollment status
  * Learning progress
  * Completion state

---

## 🛡️ Security Features

* Password hashing using **bcrypt**
* Authentication via **JWT (Access + Refresh tokens)**
* Secure cookies (`httpOnly`, `sameSite`, `secure`)
* Centralized authentication middleware

---

## 🧠 API Design Principles

* Clean controller-service separation
* Reusable `asyncHandler` for async safety
* Unified response format using `ApiResponse`
* Centralized error handling using `ApiError`

---

## 🛠️ Tech Stack

* **Node.js** – Runtime
* **Express.js** – API framework
* **MongoDB + Mongoose** – Database & ODM
* **JWT** – Authentication
* **bcrypt** – Password hashing
* **dotenv** – Environment variables
* **cookie-parser** – Cookie handling
* **CORS** – Cross-origin support

---

## 📁 Folder Structure

```bash
backend/
│
├── controllers/        # Request handling & business logic
│
├── models/             # Mongoose schemas
│   ├── user.model.js
│   ├── course.model.js
│   ├── module.model.js
│   ├── lesson.model.js
│   └── enrollment.model.js
│
├── middlewares/        # Custom Express middlewares
│   ├── auth.middleware.js
│   └── error.middleware.js
│
├── utils/              # Utility helpers
│   ├── ApiError.js
│   ├── ApiResponse.js
│   └── asyncHandler.js
│
├── routes/             # API route definitions
├── db/                 # MongoDB connection
├── server.js           # Express app configuration
└── index.js            # Server bootstrap
```

---

## 📝 Error Handling Strategy

* Uses **simple, human-readable error messages** for frontend display
* All errors pass through a **global error middleware**
* Designed for easy future upgrade to:

  * Error codes
  * Localization
  * Structured error logging

---

## 🚀 Scalability & Future Enhancements

This project is intentionally designed to scale:

* Easy to add:

  * New roles
  * New LMS features (quizzes, certificates, payments)
  * New APIs

* Clean separation of concerns

* Consistent patterns across controllers, models, and routes

---

## 📌 Status

✅ User Management
✅ Course Management
✅ Modules & Lessons
✅ Enrollment System
✅ Role-Based Access Control

---

## ❤️ Links / Contact

Made by **Rajendra Behera**

**Email:** [rajendrabehera8116@gmail.com](mailto:rajendrabehera8116@gmail.com)  
**LinkedIn:** [/behera-rajendra](https://www.linkedin.com/in/behera-rajendra/)  
**GitHub:** [/BRajendra10](https://github.com/BRajendra10)
**Frontend:** [EdTech-Frontend](https://github.com/BRajendra10/EdTech-fronted)  
**Backend:** [EdTech-Backend](https://github.com/BRajendra10/EdTech-bacend)  

---
