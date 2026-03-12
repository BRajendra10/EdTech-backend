import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authRole.middleware.js"
import { dashboardEmitter } from "../utils/dashboardNotifier.js";
import { calculateAdminDashboardStats, calculateUserDashboardStats } from "../controllers/user.controller.js";

const router = Router()
let clients = [];
let userClients = {};

router.get(
    "/admin/stream",
    verifyJWT,
    authorizeRoles("ADMIN"),
    async (req, res) => {

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        clients.push(res);

        // Send initial data immediately
        const stats = await calculateAdminDashboardStats();
        res.write(`data: ${JSON.stringify(stats)}\n\n`);

        req.on("close", () => {
            clients = clients.filter(c => c !== res);
        });
    }
);

router.get(
    "/user/stream",
    verifyJWT,
    async (req, res) => {

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const userId = req.user._id;

        if (!userClients[userId]) {
            userClients[userId] = [];
        }

        userClients[userId].push(res);

        const stats = await calculateUserDashboardStats(userId);
        res.write(`data: ${JSON.stringify(stats)}\n\n`);

        req.on("close", () => {
            if (userClients[userId]) {
                userClients[userId] = userClients[userId].filter(c => c !== res);
                if (userClients[userId].length === 0) {
                    delete userClients[userId];
                }
            }
        });
    }
);

dashboardEmitter.on("ADMIN_DASHBOARD_UPDATED", async () => {
    const stats = await calculateAdminDashboardStats();

    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(stats)}\n\n`);
    });
});

dashboardEmitter.on("USER_DASHBOARD_UPDATED", async (userId) => {
    const stats = await calculateUserDashboardStats(userId);

    if (userClients[userId]) {
        userClients[userId].forEach(client => {
            client.write(`data: ${JSON.stringify(stats)}\n\n`);
        });
    }
});

export default router;