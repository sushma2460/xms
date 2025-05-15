import { adminLogin } from "../controllers/adminController.js";
import express from "express";

const router = express.Router();

router.post("/login", adminLogin);

export default router;
