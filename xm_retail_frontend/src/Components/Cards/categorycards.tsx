import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Subcategory {
  id: number;
  name: string;
  [key: string]: any;
}

interface CategoryType {
  id: number;
  name: string;
  url?: string;
  description?: string | null;
  subcategories?: Subcategory[];
}

const Categorycards: React.FC = () => {
  const [categoryList, setCategoryList] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/woohoo/category")
      .then((response) => {
        const data = response.data;
        if (Array.isArray(data)) {
          setCategoryList(data);
        } else if (typeof data === "object" && data !== null) {
          setCategoryList([data]);
        } else {
          setError("Unexpected response format");
        }
        setLoading(false);
      })
      .catch((error) => {
        setError("Failed to load categories");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center text-gray-600">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Categories</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {categoryList.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl shadow hover:shadow-md transition-all p-4 flex flex-col justify-between"
          >
            <div>
              <p><span className="font-bold">ID:</span> {category.id}</p>
              <p><span className="font-bold">Name:</span> {category.name}</p>
              <p><span className="font-bold">URL:</span> {category.url || "N/A"}</p>
              <p>
                <span className="font-bold">Subcategories:</span>{" "}
                {category.subcategories?.length
                  ? category.subcategories.map((sub) => sub.name).join(", ")
                  : "None"}
              </p>
            </div>
            
            <button
              onClick={() => navigate(`/products/${category.id}`)} // ✅ Navigate to product list
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categorycards;
