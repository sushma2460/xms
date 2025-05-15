import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Nav from "../NavBar/Nav";

interface Product {
  sku: string;
  name: string;
  currency: {
    code: string;
    symbol: string;
  };
  url: string;
  minPrice: string;
  maxPrice: string;
  offer: string; // New field for offer
  images: {
    thumbnail: string;
    mobile: string;
    base: string;
    small: string;
  };
}

const ProductList: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (categoryId) {
      axios
        .get(`http://localhost:4000/api/woohoo/category/products/${categoryId}`)
        .then((response) => {
          const data = response.data;
          console.log("Woohoo Product API Response:", data); // Log the response for debugging

          // Assuming 'data.products' contains the product array (adjust accordingly based on your API response)
          if (data.products && Array.isArray(data.products)) {
            setProductList(data.products);
          } else {
            console.error("Expected an array in 'data.products' but got:", data.products);
            setProductList([]);
            setError("Unexpected product format from API");
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching products:", error);
          setError("Failed to load products");
          setLoading(false);
        });
    }
  }, [categoryId]);

  if (loading) return <p className="text-center text-gray-600">Loading products...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <>
      <Nav/>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Products for Category {categoryId}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {productList.length > 0 ? (
            productList.map((product) => (
              <div
                key={product.sku}
                className="bg-white rounded-xl shadow hover:shadow-md transition-all p-4 flex flex-col justify-between"
              >
                <img
                  src={product.images.thumbnail}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded mb-4"
                />
                <p className="font-bold">{product.name}</p> {/* Bold product name */}
                <div className="text-sm text-gray-600">
                  <p>
                      <strong>Price: </strong> 
                    {product.currency.symbol}
                    {product.minPrice} - {product.currency.symbol}
                    {product.maxPrice}
                  </p>
                  {product.offer && (
                    <p className="text-red-500">
                      <strong>Offer:</strong> {product.offer}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => window.location.href = `/product/${product.sku}`} // Navigate to the product detail page
                  className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  View Details
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No products available for this category.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductList;
