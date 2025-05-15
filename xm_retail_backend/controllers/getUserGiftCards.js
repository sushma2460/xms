// controllers/orderController.js
import WoohooOrder from '../models/cardorders.js';

export const getUserGiftCards = async (req, res) => {
  const email = req.user?.email;

  if (!email) {
    return res.status(400).json({ message: "User email not found in token" });
  }

  try {
    const orders = await WoohooOrder.findAll({
      where: { recipientEmail: email },
      order: [['issuanceDate', 'DESC']],
    });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching gift cards:", error);
    res.status(500).json({ message: "Failed to fetch gift cards" });
  }
};
