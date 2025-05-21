import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import WoohooCategory from "./Woohoocategorymodel.js";

const ProductList = sequelize.define("ProductList", {
  sku: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: DataTypes.STRING,
  description: DataTypes.TEXT,
  price: DataTypes.FLOAT,
  image: DataTypes.STRING,
  // ...other fields...
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: WoohooCategory,
      key: "id",
    },
    onDelete: "CASCADE",
  },
}, {
  timestamps: true,
  tableName: "ProductList", // Add this line if your table is not pluralized
});

WoohooCategory.hasMany(ProductList, { foreignKey: "categoryId" });
ProductList.belongsTo(WoohooCategory, { foreignKey: "categoryId" });

export default ProductList;