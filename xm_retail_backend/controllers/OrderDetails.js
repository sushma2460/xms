import {sequelize} from "../config/db.js"; 

export const getOrderDetailsdb = async(req, res) => {
    try {
        // Check if the database connection is available
        if (!sequelize) {
            return res.status(500).json({
                success: false,
                message: "Database connection is not available"
            });
        }

        const [orders] = await sequelize.query(
            "SELECT * FROM woohooorders"
        );

        // Check if the query result is valid
        if (!orders) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch orders from the database"
            });
        }

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No orders found"
            });
        }

        return res.status(200).json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.error("Error fetching order details:", error.message);

        // Handle specific Sequelize errors
        if (error.name === "SequelizeDatabaseError") {
            return res.status(500).json({
                success: false,
                message: "Database query error",
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};