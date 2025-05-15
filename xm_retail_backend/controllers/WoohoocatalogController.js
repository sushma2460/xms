import axios from 'axios';
import { generateWoohooSignature } from '../generateSignature.js';
import Product from '../models/WoohooCatalogAllProducts.js'; // Import the model

const woohoocatalog = 'https://sandbox.woohoo.in/rest/v3/catalog/products';

export const getWoohooProducts = async (req, res) => {
  try {
    const method = 'GET';
    const { signature, dateAtClient } = generateWoohooSignature(
      woohoocatalog,
      method,
      process.env.clientSecret
    );

    // Send request to Woohoo API
    const response = await axios.get(woohoocatalog, {
      headers: {
        Authorization: `Bearer ${process.env.bearerToken}`,
        signature,
        dateAtClient,
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
    });

    const products = response.data.products; // Assuming the API response has a 'products' field
    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    // Loop through the products and save them to the database
    for (const product of products) {
      // Ensure both name and sku exist before proceeding
      if (!product.name || !product.sku) {
        // console.error(`Skipping product with missing 'name' or 'sku': ${JSON.stringify(product)}`);
        continue; // Skip this product if it doesn't have name or sku
      }

      const productData = {
        id: product.id, // Product ID
        name: product.name, // Product name
        sku: product.sku,    // Product SKU
        productType: product.productType || null, // Product Type (optional)
        image: product.images || null, // Product images (optional)
        stores: product.stores || null, // Stores data (optional)
        websites: product.websites || null, // Websites data (optional)
        description: product.description || null, // Optional field
        shortDescription: product.shortDescription || null, // Optional field
        canonicalUrl: product.canonicalUrl || null, // Optional field
        colorCode: product.colorCode || null, // Optional field
        bgColorCode: product.bgColorCode || null, // Optional field
        offerDescription: product.offerDescription || null, // Optional field
        metaIndex: product.metaIndex || null, // Optional field
        metaKeyword: product.metaKeyword || null, // Optional field
        pageTitle: product.pageTitle || null, // Optional field
        metaDescription: product.metaDescription || null, // Optional field
        subcategoriesCount: product.subcategoriesCount || 0, // Default to 0 if not present
        subcategories: product.subcategories || [], // Ensure it's an array or empty
      };

      // Insert or update the product data in the database
      await Product.upsert(productData); // Use upsert to insert or update
    }

    res.json({ message: 'Products successfully added to the database', products });

  } catch (error) {
    console.error(`Woohoo API error: ${error.message}`);
    if (error.response) {
      res.status(error.response.status).json({ error: 'Woohoo API failed', details: error.response.data });
    } else if (error.request) {
      res.status(500).json({ error: 'No response received from Woohoo API', details: error.message });
    } else {
      res.status(500).json({ error: 'Error in setting up the request', details: error.message });
    }
  }
};
