import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Product = sequelize.define("Product", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    // autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    // allowNull: false,
  },
  sku: {
    type: DataTypes.STRING,
    // unique: true,
    // allowNull: false,
  },
  productType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  image: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  stores: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  websites: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  // Uncomment the fields you need based on your requirements
  // price: {
  //   type: DataTypes.FLOAT,
  //   allowNull: true,
  // },
  // currency: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  // },
  // imageUrl: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  // },
  // description: {
  //   type: DataTypes.TEXT,
  //   allowNull: true,
  // },
}, {
  timestamps: true,  // Automatically adds createdAt and updatedAt
});

export default Product;
