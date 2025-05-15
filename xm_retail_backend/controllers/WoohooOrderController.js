// controllers/placeOrder.js

import { signature } from "../Woohooservice/signature.js";
import axios from "axios";
import dotenv from "dotenv";
import WoohooOrder from "../models/cardorders.js";
import { sequelize } from "../config/db.js";

dotenv.config();

const woohooOrderUrl = `https://sandbox.woohoo.in/rest/v3/orders`;

export const placeOrder = async (req, res) => {
  try {
    const { sku, price, razorpay_order_id, name, email, phone, quantity } = req.body;

    // Validate user info
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: "Missing parameters",
        details: !name
          ? "name is required"
          : !email
          ? "email is required"
          : "phone is required",
      });
    }

    // Validate SKU, price, order ID, quantity
    if (!sku || !price || !razorpay_order_id || !quantity) {
      return res.status(400).json({
        success: false,
        error: "Missing parameters",
        details: !sku
          ? "sku is required"
          : !price
          ? "price is required"
          : !razorpay_order_id
          ? "razorpay_order_id is required"
          : "quantity is required",
      });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid price",
        details: "Price should be a number greater than 0",
      });
    }

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid quantity",
        details: "Quantity should be a positive integer",
      });
    }

    const refno = `${razorpay_order_id}-${sku}-${Date.now()}`;

    const payload = {
      address: {
        salutation: "Mr.",
        firstname: name,
        lastname: "jackson",
        email: email,
        telephone: `+91${phone}`,
        line1: "123 Main Street",
        city: "Bangalore",
        region: "Karnataka",
        country: "IN",
        postcode: "560001",
        billToThis: true,
      },
      payments: [
        {
          code: "svc",
          amount: parsedPrice * parsedQuantity,
          poNumber: `PO-${Date.now()}`,
        },
      ],
      products: [
        {
          sku,
          price: parsedPrice,
          qty: parsedQuantity,
          currency: 356,
          giftMessage: "Enjoy your gift!",
        },
      ],
      refno,
      remarks: "Synchronous digital gift card order",
      deliveryMode: "API",
      syncOnly: true,
    };

    const method = "POST";
    const { signature: generatedSignature, dateAtClient } = signature(
      method,
      woohooOrderUrl,
      payload
    );

    const response = await axios.post(woohooOrderUrl, payload, {
      headers: {
        Authorization: `Bearer ${process.env.bearerToken}`,
        Signature: generatedSignature,
        DateAtClient: dateAtClient,
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });

    const placed = response.data;
    const cardList = placed.cards || [];

    for (const card of cardList) {
      const payment = placed.payments?.[0] || {};
      const rec = card.recipientDetails || {};

      await WoohooOrder.create({
        name,
        email,
        phone,
        orderId: placed.orderId,
        refno: placed.refno,
        sku: card.sku,
        productName: card.productName,
        amount: parseFloat(card.amount),
        cardNumber: card.cardNumber,
        cardPin: card.cardPin || "",
        validity: card.validity,
        issuanceDate: card.issuanceDate ? new Date(card.issuanceDate) : null,
        recipientName: rec.name || "",
        recipientEmail: rec.email || "",
        recipientPhone: rec.mobileNumber || "",
        balance: payment.balance || null,
      });
    }

    return res.status(200).json({
      success: true,
      data: placed,
    });
  } catch (error) {
    console.error("Error placing Woohoo order:", error.message, error.response?.data);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message || "Unknown error occurred",
    });
  }
};
