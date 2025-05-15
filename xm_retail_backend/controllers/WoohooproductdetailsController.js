import axios from 'axios';
import { generateWoohooSignature } from '../generateSignature.js';

export const getWoohooProductDetails = async (req, res) => {
  const { productSku } = req.params;

  const productUrl = `https://sandbox.woohoo.in/rest/v3/catalog/products/${productSku}`;

  try {
    const method = 'GET';
    const { signature, dateAtClient } = generateWoohooSignature(
      productUrl,
      method,
      process.env.clientSecret
    );

    const response = await axios.get(productUrl, {
      headers: {
        Authorization: `Bearer ${process.env.bearerToken}`,
        signature,
        dateAtClient,
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
    });

    const product = response.data;

    if (product) {
      res.json({
        sku: product.sku,
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        images: product.images,
        currency: product.currency,
        availability: product.availability,
        offer: product.offer,
        url: product.url,
      });
    } else {
      res.status(404).json({ message: 'Product not found.' });
    }
  } catch (error) {
    console.error(`Woohoo Product API error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch product details from Woohoo API', details: error.message });
  }
};
