import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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

          // FIX: Use data directly if it's an array
          if (Array.isArray(data)) {
            setProductList(data);
            setError("");
          } else if (data.products && Array.isArray(data.products)) {
            setProductList(data.products);
            setError("");
          } else {
            console.error("Expected an array but got:", data);
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
          
          <div className="text-gray-500 text-sm mb-4">
        <span
          className="text-orange-500 cursor-pointer"
          onClick={() => navigate("/home")}
        >
          Home
        </span>{" "}
        / <span className="font-semibold">Products</span>
      </div>



        <h1 className="text-2xl font-bold mb-6 text-center">Products for Category {categoryId}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {productList.length > 0 ? (
            productList.map((product) => {
              const mappedProduct = {
                ...product,
                images: product.images || { thumbnail: product.image || "", mobile: "", base: "", small: "" },
                currency: product.currency || { code: "INR", symbol: "₹" },
                minPrice: product.minPrice?.toString() ?? product.price?.toString() ?? "",
                maxPrice: product.maxPrice?.toString() ?? product.price?.toString() ?? "",
                offer: product.offer || "",
              };
              return (
                <div
                  key={mappedProduct.sku}
                  className="bg-white rounded-xl shadow hover:shadow-md transition-all p-4 flex flex-col justify-between"
                >
                  <img
                    src={mappedProduct.images.thumbnail}
                    alt={mappedProduct.name}
                    className="w-full h-48 object-cover rounded mb-4"
                  />
                  <p className="font-bold">{mappedProduct.name}</p>
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Price: </strong> 
                      {mappedProduct.currency.symbol}
                      {mappedProduct.minPrice} - {mappedProduct.currency.symbol}
                      {mappedProduct.maxPrice}
                    </p>
                    {mappedProduct.offer && (
                      <p className="text-red-500">
                        <strong>Offer:</strong> {mappedProduct.offer}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => window.location.href = `/product/${mappedProduct.sku}`} // Navigate to the product detail page
                    className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                  >
                    View Details
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500">No products available for this category.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductList;
