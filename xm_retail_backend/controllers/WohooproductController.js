// controllers/woohooController.js
import axios from "axios";
import { generateWoohooSignature } from "../generateSignature.js";

// Helper to construct category products URL
const woohooCategoryProducts = (categoryId) =>
  `https://sandbox.woohoo.in/rest/v3/catalog/categories/${categoryId}/products`;

// Helper to construct related products URL
const woohooRelatedProductsURL = (productSku) =>
  `https://sandbox.woohoo.in/rest/v3/catalog/products/${productSku}/related`;

// Controller: Get products by category ID
export const getWoohooCategoryProducts = async (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log(`Fetching products for category ID: ${categoryId}`);
    const method = "GET";

    const { signature, dateAtClient } = generateWoohooSignature(
      woohooCategoryProducts(categoryId),
      method,
      process.env.clientSecret
    );

    const response = await axios.get(woohooCategoryProducts(categoryId), {
      headers: {
        Authorization: `Bearer ${process.env.bearerToken}`,
        signature,
        dateAtClient,
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });

    console.log(`Woohoo Category Products response: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Woohoo Category API error: ${error.message}`);
    res.status(500).json({ error: "Woohoo Category API failed", details: error.message });
  }
};

// Controller: Get related products by product SKU
export const getWoohooRelatedProducts = async (req, res) => {
  try {
    const { productSku } = req.params;
    console.log(`Fetching related products for SKU: ${productSku}`);
    const method = "GET";

    const { signature, dateAtClient } = generateWoohooSignature(
      woohooRelatedProductsURL(productSku),
      method,
      process.env.clientSecret
    );

    const response = await axios.get(woohooRelatedProductsURL(productSku), {
      headers: {
        Authorization: `Bearer ${process.env.bearerToken}`,
        signature,
        dateAtClient,
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });

    console.log(`Woohoo Related Products response: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Woohoo Related Products API error: ${error.message}`);
    res.status(500).json({ error: "Woohoo Related Products API failed", details: error.message });
  }
};
