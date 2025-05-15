import express from 'express';
import {placeOrder} from '../controllers/WoohooOrderController.js'; 
import { getOrderDetails } from '../controllers/WoohooOrderDetailsController.js'; 

import { getUserGiftCards } from '../controllers/getUserGiftCards.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to place Woohoo order
router.post('/place-order',placeOrder);

// Route to get order details by orderId
router.get('/details/:orderId',getOrderDetails);


router.get('/user-orders', authenticateUser, getUserGiftCards);

export default router;
