import { signature } from "../../Woohooservice/signature.js";
import axios from "axios";
import WoohooOrder from "../../models/cardorders.js";
import { getActiveToken } from '../../services/woohooTokenService.js';
import { encrypt, generateReferenceNumber } from './utils.js';

const woohooOrderUrl = `https://sandbox.woohoo.in/rest/v3/orders`;

/**
 * Places a new order with Woohoo API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const placeOrder = async (req, res) => {
  try {
    // Get active token from database
    const token = await getActiveToken();
    if (!token || !token.accessToken) {
      return res.status(401).json({
        success: false,
        error: "Authentication Error",
        details: "Failed to get valid Woohoo API token"
      });
    }

    const { 
      sku, 
      price, 
      razorpay_order_id, 
      razorpay_payment_id,
      razorpay_signature,
      name, 
      email, 
      phone, 
      quantity 
    } = req.body;

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

    // Create initial order record with payment details
    const order = await WoohooOrder.create({
      name,
      email,
      phone,
      refno,
      sku,
      productName: "Gift Card",
      amount: parsedPrice * parsedQuantity,
      recipientName: name,
      recipientEmail: email,
      recipientPhone: phone,
      status: 'pending',
      paymentStatus: 'completed',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentAmount: parsedPrice * parsedQuantity,
      paymentCurrency: 'INR',
      paymentDate: new Date(),
      retryCount: 0,
      errorMessage: null
    });

    // Prepare payload for Woohoo API
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
          poNumber: refno,
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

    try {
      // Update order status to processing
      await order.update({ status: 'processing' });

      const method = "POST";
      const { signature: generatedSignature, dateAtClient } = signature(
        method,
        woohooOrderUrl,
        payload
      );

      // Make request to Woohoo API
      const response = await axios.post(woohooOrderUrl, payload, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Signature: generatedSignature,
          DateAtClient: dateAtClient,
          'Content-Type': 'application/json',
          Accept: '*/*'
        },
        timeout: 30000 // 30 second timeout
      });

      const placed = response.data;
      const cardList = placed.cards || [];

      // Update order with Woohoo response and card details
      await order.update({
        orderId: placed.orderId,
        cardNumber: cardList[0]?.cardNumber ? encrypt(cardList[0].cardNumber) : "",
        cardPin: cardList[0]?.cardPin ? encrypt(cardList[0].cardPin) : "",
        validity: cardList[0]?.validity,
        issuanceDate: cardList[0]?.issuanceDate ? new Date(cardList[0].issuanceDate) : null,
        balance: placed.payments?.[0]?.balance || null,
        status: 'completed',
        woohooResponse: placed
      });

      // Return success with card details
      return res.status(200).json({
        success: true,
        data: {
          refno: order.refno,
          cards: [{
            sku: order.sku,
            productName: order.productName,
            amount: order.amount,
            cardNumber: cardList[0]?.cardNumber || "",
            cardPin: cardList[0]?.cardPin || "",
            validity: cardList[0]?.validity,
            issuanceDate: cardList[0]?.issuanceDate,
            recipientName: order.recipientName,
            recipientEmail: order.recipientEmail,
            recipientPhone: order.recipientPhone,
            balance: order.balance,
            status: 'completed'
          }]
        }
      });

    } catch (woohooError) {
      // Handle Woohoo API errors
      if (woohooError.code === 'ENOTFOUND' || woohooError.code === 'ECONNREFUSED' || woohooError.code === 'ETIMEDOUT') {
        await order.update({
          status: 'pending',
          errorMessage: 'Woohoo API temporarily unavailable. Will retry automatically.',
          retryCount: 0
        });

        return res.status(200).json({
          success: true,
          data: {
            refno: order.refno,
            cards: [{
              sku: order.sku,
              productName: order.productName,
              amount: order.amount,
              status: 'pending',
              message: 'Order placed but card activation pending. Will be processed automatically.'
            }]
          }
        });
      }

      // For other errors, mark as failed
      await order.update({
        status: 'failed',
        errorMessage: woohooError.message
      });

      return res.status(500).json({
        success: false,
        error: "Woohoo API Error",
        details: woohooError.message || "Failed to place order with Woohoo"
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message || "An unexpected error occurred while processing your order"
    });
  }
}; 