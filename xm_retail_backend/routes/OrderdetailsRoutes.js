import { getOrderDetailsdb } from "../controllers/OrderDetails.js";
import express from "express";

const router = express.Router();

router.get("/orderdetails",getOrderDetailsdb); 


export default router;