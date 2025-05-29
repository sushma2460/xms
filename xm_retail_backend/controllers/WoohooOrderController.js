// controllers/placeOrder.js

import { signature } from "../Woohooservice/signature.js";
import axios from "axios";
import dotenv from "dotenv";
import WoohooOrder from "../models/cardorders.js";
import { sequelize } from "../config/db.js";
import crypto from "crypto";
import { getActiveToken } from '../services/woohooTokenService.js';

dotenv.config();

const woohooOrderUrl = `https://sandbox.woohoo.in/rest/v3/orders`;
const ENCRYPTION_KEY = process.env.CARD_ENCRYPTION_KEY; // Must be 32 bytes (hex or utf8)
const IV_LENGTH = 16; // For AES, this is always 16

// Function to generate incrementing reference number
async function generateReferenceNumber() {
  try {
    // Find the last order to get the last reference number
    const lastOrder = await WoohooOrder.findOne({
      order: [['createdAt', 'DESC']],
      attributes: ['refno']
    });

    let nextNumber = 1; // Default starting number

    if (lastOrder && lastOrder.refno) {
      // Extract the number part from the last reference number
      const lastNumber = parseInt(lastOrder.refno.replace('XMR', ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Get current timestamp in milliseconds
    const timestamp = Date.now();
    
    // Format the number with leading zeros and add timestamp
    // Format: XMR000001-1234567890
    return `XMR${nextNumber.toString().padStart(6, '0')}-${timestamp}`;
  } catch (error) {
    console.error('Error generating reference number:', error);
    // Fallback to timestamp-based reference if there's an error
    return `XMR-${Date.now()}`;
  }
}

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
  if (!text.includes(":")) return ""; // Not encrypted
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = parts.join(":");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export const placeOrder = async (req, res) => {
  try {
    // Get active token from database
    const token = await getActiveToken();
    if (!token || !token.accessToken) {
      throw new Error('No active token found');
    }

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

    // Generate reference number
    const refno = await generateReferenceNumber();

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
          poNumber: refno, // Use the same reference number for PO
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
        Authorization: `Bearer ${token.accessToken}`,
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
        cardNumber: encrypt(card.cardNumber),
        cardPin: card.cardPin ? encrypt(card.cardPin) : "",
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
      tokenUsed: {
        tokenType: token.tokenType,
        expiresAt: token.expiresAt
      }
    });
  } catch (error) {
    console.error("Error placing Woohoo order:", error.message, error.response?.data);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message || "Unknown error occurred",
      tokenError: error.message.includes('token') ? 'Token related error' : null
    });
  }
};
