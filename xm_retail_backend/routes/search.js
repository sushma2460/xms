import express from "express";
import { Op } from "sequelize";
import Card from "../models/Card.js";
import Product from "../models/WoohooCatalogAllProducts.js";
import WoohooCategory from "../models/Woohoocategorymodel.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const query = req.query.query?.trim();

  if (!query) {
    return res.json([]);
  }

  try {
<<<<<<< HEAD
    // Search in `Card` model
=======
    // Search in Card model
>>>>>>> 0d70c2e5abfa15c88e8ce628cc9b14bb0ed6a166
    const cardResults = await Card.findAll({
      where: {
        name: {
          [Op.like]: `%${query}%`,
        },
      },
      attributes: ["id", "name", "image", "cashback"],
    });

<<<<<<< HEAD
    // Search in `Product` model
=======
    // Search in Product model
>>>>>>> 0d70c2e5abfa15c88e8ce628cc9b14bb0ed6a166
    const productResults = await Product.findAll({
      where: {
        name: {
          [Op.like]: `%${query}%`,
        },
      },
      attributes: ["id", "name", "image", "sku"],
    });

<<<<<<< HEAD
    // Search in `WoohooCategory` model
=======
    // Search in WoohooCategory model
>>>>>>> 0d70c2e5abfa15c88e8ce628cc9b14bb0ed6a166
    const categoryResults = await WoohooCategory.findAll({
      where: {
        name: {
          [Op.like]: `%${query}%`,
        },
      },
      attributes: ["id", "name"],
    });

    // Construct the response
    const results = [
      ...cardResults.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        cashback: item.cashback,
        type: "card",
      })),
      ...productResults.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        sku: item.sku,
        type: "product",
      })),
      ...categoryResults.map((item) => ({
        id: item.id,
        name: item.name,
        type: "category",
      })),
    ];

    res.json(results);
  } catch (err) {
    console.error("Error in search route:", err);
    res.status(500).json({ error: "Server error" });
  }
});

<<<<<<< HEAD
export default router;
=======
export default router;
>>>>>>> 0d70c2e5abfa15c88e8ce628cc9b14bb0ed6a166
