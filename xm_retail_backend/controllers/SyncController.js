import axios from "axios";
import { generateWoohooSignature } from "../generateSignature.js";
import WoohooCategory from "../models/Woohoocategorymodel.js";
import dotenv from "dotenv";
import { sequelize } from "../config/db.js";
import ProductList from "../models/ProductListModel.js";
import ProductDetails from '../models/WoohooproductDetailsModel.js';
import RelatedProduct from "../models/RelatedProductsModel.js";
import CatalogProduct from "../models/CatalogModel.js";


dotenv.config();

const woohooCategoryUrl = 'https://sandbox.woohoo.in/rest/v3/catalog/categories';

// Block 1: Sync categories from Woohoo API to DB (call this periodically or via admin endpoint)
export const syncWoohooCategories = async (req, res) => {
    try {
        const method = 'GET';
        const { signature, dateAtClient } = generateWoohooSignature(
            woohooCategoryUrl,
            method,
            process.env.clientSecret,
        );

        const response = await axios.get(woohooCategoryUrl, {
            headers: {
                Authorization: `Bearer ${process.env.bearerToken}`,
                signature,
                dateAtClient,
                'Content-Type': 'application/json',
                Accept: '*/*',
            },
        });
        console.log("Full API response:", response.data);

        let apiCategories = [];
        if (Array.isArray(response.data.categories)) {
          apiCategories = response.data.categories.filter(Boolean);
        } else if (response.data.categories) {
          apiCategories = [response.data.categories];
        } else if (Array.isArray(response.data)) {
          apiCategories = response.data.filter(Boolean);
        } else if (response.data && response.data.id) {
          apiCategories = [response.data];
        } else {
          apiCategories = [];
        }

        const dbCategories = await WoohooCategory.findAll();
        const dbCategoryMap = new Map(dbCategories.map(cat => [cat.id, cat]));

        let updated = false;
        const transaction = await sequelize.transaction();
        try {
          for (const apiCat of apiCategories) {
            if (!apiCat || !apiCat.id) continue; // skip invalid
            const dbCat = dbCategoryMap.get(apiCat.id);
            const apiCatData = {
              ...apiCat,
              id: apiCat.id,
            };
            if (!dbCat || JSON.stringify(dbCat.toJSON()) !== JSON.stringify(apiCatData)) {
              await WoohooCategory.upsert(apiCatData, { transaction });
              updated = true;
            }
          }
          await transaction.commit();
          res.json({ message: updated ? "Categories updated" : "No changes detected" });
        } catch (dbError) {
          await transaction.rollback();
          console.error('Database transaction failed:', dbError);
          res.status(500).json({ error: 'Database transaction failed', details: dbError.message });
        }
    } catch (error) {
        console.error(`Woohoo Categories API error: ${error.message}`);
        res.status(500).json({
            error: 'Failed to sync categories from Woohoo API',
            details: error.message
        });
    }
};

// to get productList by categoryId


const woohooCategoryProducts = (categoryId) =>
  `https://sandbox.woohoo.in/rest/v3/catalog/categories/${categoryId}/products`;

// Controller: Sync products for all categories
export const syncProductsForAllCategories = async (req, res) => {
  try {
    const categories = await WoohooCategory.findAll();
    let updated = false;

    for (const category of categories) {
      const method = "GET";
      const { signature, dateAtClient } = generateWoohooSignature(
        woohooCategoryProducts(category.id),
        method,
        process.env.clientSecret
      );

      const response = await axios.get(woohooCategoryProducts(category.id), {
        headers: {
          Authorization: `Bearer ${process.env.bearerToken}`,
          signature,
          dateAtClient,
          "Content-Type": "application/json",
          Accept: "*/*",
        },
      });

      // console.log(
      //   `Woohoo Product API Response for category ${category.id}:`,
      //   JSON.stringify(response.data, null, 2)
      // );

      let products = [];
      if (Array.isArray(response.data.products)) {
        products = response.data.products;
      } else if (response.data.products) {
        products = [response.data.products];
      } else if (Array.isArray(response.data)) {
        products = response.data;
      } else if (response.data && response.data.id) {
        products = [response.data];
      } else {
        products = [];
      }

      console.log(`Products to sync for category ${category.id}:`, products.length);

      const dbProducts = await ProductList.findAll({ where: { categoryId: category.id } });
      const dbProductMap = new Map(dbProducts.map((p) => [p.sku, p]));

      const transaction = await sequelize.transaction();
      try {
        for (const product of products) {
          if (!product || !product.sku) {
            console.warn("Skipping product with missing SKU:", product);
            continue;
          }
          const dbProduct = dbProductMap.get(product.sku);
          const productData = {
            sku: product.sku,
            name: product.name,
            description: product.offerShortDesc || null,
            price: product.minPrice ? parseFloat(product.minPrice) : null,
            image: product.images?.thumbnail || null,
            categoryId: category.id,
          };
         // console.log("Upserting product:", productData);
          try {
            if (!dbProduct || JSON.stringify(dbProduct.toJSON()) !== JSON.stringify(productData)) {
              const [instance, created] = await ProductList.upsert(productData, { transaction });
              updated = true;
              console.log(`Upserted product SKU: ${product.sku}, created: ${created}`);
            }
          } catch (upsertErr) {
            console.error(`Failed to upsert product SKU: ${product.sku}`, upsertErr);
          }
        }
        await transaction.commit();
        console.log("Transaction committed for category:", category.id);
      } catch (err) {
        await transaction.rollback();
        console.error("Transaction rolled back for category:", category.id, err);
        throw err;
      }
      console.log("Syncing products for category:", category.id, category.name);
    }
    res.json({ message: updated ? "Products updated" : "No changes detected" });
  } catch (error) {
    console.error("Failed to sync products:", error);
    res.status(500).json({ error: "Failed to sync products", details: error.message });
  }
};




//get productdetails 
 



// 1. SYNC ALL PRODUCT DETAILS (ADMIN/BULK)
export const syncProductDetails = async (req, res) => {
  console.log("Received body:", req.body);
  const { skus } = req.body;
  if (!Array.isArray(skus) || skus.length === 0) {
    // 400 error
  }

  let results = [];
  for (const productSku of skus) {
    try {
      // Fetch from Woohoo API
      const productUrl = `https://sandbox.woohoo.in/rest/v3/catalog/products/${productSku}`;
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
      const apiProduct = response.data;

      // Fetch from DB
      let dbProduct = await ProductDetails.findOne({ where: { sku: productSku } });

      // Compare and upsert if needed
      let needsUpdate = false;
      if (!dbProduct) {
        needsUpdate = true;
      } else {
        const dbData = dbProduct.toJSON();
        delete dbData.createdAt;
        delete dbData.updatedAt;
        needsUpdate = JSON.stringify(dbData) !== JSON.stringify(apiProduct);
      }

      if (needsUpdate) {
        await ProductDetails.upsert({
          ...apiProduct,
          id: apiProduct.sku,
          createdAtWoohoo: apiProduct.createdAt,
          updatedAtWoohoo: apiProduct.updatedAt,
        });
        results.push({ sku: productSku, status: "synced/updated" });
      } else {
        results.push({ sku: productSku, status: "no change" });
      }
    } catch (error) {
      results.push({ sku: productSku, status: "error", message: error.message });
    }
  }
  res.json({ results });
};

export const getAllProductSkus = async (req, res) => {
  try {
    const products = await ProductList.findAll({ attributes: ['sku'] });
    const skus = products.map(p => p.sku);
    res.json({ skus });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch SKUs", details: error.message });
  }
};



// related products

const woohooRelatedProductsURL = (productSku) =>
  `https://sandbox.woohoo.in/rest/v3/catalog/products/${productSku}/related`;

// 1. SYNC RELATED PRODUCTS (ADMIN/BULK)

export const syncAllRelatedProducts = async (req, res) => {
  try {
    console.log("Starting syncAllRelatedProducts...");
    const products = await ProductList.findAll({ attributes: ['sku'] });
    let results = [];
    for (const product of products) {
      const productSku = product.sku;
      try {
        // Reuse your existing logic for each SKU
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

        let relatedProducts = [];
        if (Array.isArray(response.data.relatedProducts)) {
          relatedProducts = response.data.relatedProducts;
        } else if (response.data.relatedProducts) {
          relatedProducts = [response.data.relatedProducts];
        }

        if (!relatedProducts.length) {
          await RelatedProduct.destroy({ where: { productSku } });
          results.push({ sku: productSku, status: "no related products" });
          continue;
        }

        const transaction = await sequelize.transaction();
        try {
          for (const rel of relatedProducts) {
            if (!rel || !rel.sku) continue;
            try {
              console.log("Upserting related product:", {
                sku: rel.sku,
                name: rel.name,
                description: rel.offerShortDesc || null,
                price: rel.minPrice ? parseFloat(rel.minPrice) : null,
                image: rel.images?.thumbnail || null,
                productSku,
              });
              await RelatedProduct.upsert({
                sku: rel.sku,
                name: rel.name,
                description: rel.offerShortDesc || null,
                price: rel.minPrice ? parseFloat(rel.minPrice) : null,
                image: rel.images?.thumbnail || null,
                productSku,
              }, { transaction });
            } catch (err) {
              console.error("Upsert error for", rel.sku, ":", err);
            }
          }
          await transaction.commit();
          results.push({ sku: productSku, status: "related products synced" });
        } catch (err) {
          await transaction.rollback();
          results.push({ sku: productSku, status: "db error", error: err.message });
        }
      } catch (error) {
        results.push({ sku: productSku, status: "api error", error: error.message });
      }
    }
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: "Failed to sync all related products", details: error.message });
  }
};
