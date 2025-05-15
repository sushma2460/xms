import axios from "axios";
import { generateWoohooSignature } from "../generateSignature.js";
import WoohooCategory from "../models/Woohoocategorymodel.js";
import dotenv from "dotenv";
import { sequelize } from "../config/db.js";

dotenv.config();

const woohooCategoryUrl = 'https://sandbox.woohoo.in/rest/v3/catalog/categories';

export const getWoohooCategories = async (req, res) => {
    try {
        // First, fetch categories from Woohoo API
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

        // Normalize the response to always be an array
        let categories = Array.isArray(response.data) ? 
            response.data : 
            [response.data];

        // Send response to frontend immediately
        res.json(categories);

        // Then, store categories in database asynchronously
        storeCategoriesInDatabase(categories);
    } catch (error) {
        console.error(`Woohoo Categories API error: ${error.message}`);
        res.status(500).json({ 
            error: 'Failed to fetch categories from Woohoo API', 
            details: error.message 
        });
    }
};

// Helper function to store categories in database
async function storeCategoriesInDatabase(categories) {
    if (!Array.isArray(categories)) {
        console.error('Categories data is not an array');
        return;
    }

    try {
        // Start a transaction for bulk operations
        const transaction = await sequelize.transaction();

        try {
            // Upsert each category (insert or update if exists)
            for (const category of categories) {
                if (!category || typeof category !== 'object') {
                    console.warn('Invalid category data:', category);
                    continue;
                }
                
                // Transform the images object if needed
                const categoryData = {
                    ...category,
                    images: category.images ? JSON.stringify(category.images) : null
                };

                await WoohooCategory.upsert(categoryData, { transaction });
            }

            // Commit the transaction if all operations succeed
            await transaction.commit();
            console.log('Categories successfully stored in database');
        } catch (dbError) {
            // Rollback the transaction if any error occurs
            await transaction.rollback();
            console.error('Database transaction failed:', dbError);
        }
    } catch (error) {
        console.error('Error storing categories in database:', error);
    }
}