import express from "express";
import {
  adminLogin,
  adminLogout,
  deleteUserByAdmin,
  getAdminMe,
  getAdminStats,
  getAllUsersForAdmin,
} from "../controllers/admin.controller.js";
import { protectAdminRoute } from "../middleware/admin.middleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/logout", adminLogout);
router.get("/me", protectAdminRoute, getAdminMe);

router.get("/stats", protectAdminRoute, getAdminStats);
router.get("/users", protectAdminRoute, getAllUsersForAdmin);
router.delete("/users/:id", protectAdminRoute, deleteUserByAdmin);

export default router;
