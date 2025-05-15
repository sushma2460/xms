// routes/woohooRoutes.js
import express from 'express';
import { getWoohooProductDetails } from '../controllers/WoohooproductdetailsController.js';
import { getWoohooProducts } from '../controllers/WoohoocatalogController.js';
import { getWoohooCategories } from '../controllers/WoohoocategoryController.js';
import { getWoohooCategoryProducts,getWoohooRelatedProducts } from '../controllers/WohooproductController.js';

const router = express.Router();

router.get('/catalog', getWoohooProducts);
router.get('/category', getWoohooCategories);
router.get('/category/products/:categoryId', getWoohooCategoryProducts);
router.get('/product/details/:productSku', getWoohooProductDetails);
router.get('/products/:productSku/related', getWoohooRelatedProducts);

export default router;
