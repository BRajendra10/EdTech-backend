import { EventEmitter } from "events";

export const dashboardEmitter = new EventEmitter();

export const notifyAdminDashboard = () => {
    dashboardEmitter.emit("ADMIN_DASHBOARD_UPDATED");
};

export const notifyUserDashboard = (userId) => {
    dashboardEmitter.emit("USER_DASHBOARD_UPDATED", userId);
};