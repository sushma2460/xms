// src/components/DashBoard.tsx
import { FiHome, FiLogOut, FiMenu, FiTag, FiX ,FiUser ,FiFileText} from "react-icons/fi";
import { JSX, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Admin from "./Admin";
import CardAdmin from "./CardAdmin";
import CustomerDetails from "./CustomerDetails"; 
import {CustomerOrders} from "./CustomerOrders"; 
import axios from "axios";

export default function DashBoard(): JSX.Element {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<"home" | "coupons" | "customerDetails"| "orders" | "catalog">("home");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "adminToken" && !e.newValue) {
        navigate("/admin/login");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [navigate]);

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/categories");
      setCategories(res.data);
    } catch (err) {
      setCategories([]);
    }
  };

  // Fetch products for a specific category
  const fetchProducts = async (categoryId: number) => {
    try {
      const res = await axios.get(`http://localhost:4000/api/admin/products/${categoryId}`);
      setProducts(res.data);
    } catch (err) {
      setProducts([]);
    }
  };

  // Sync categories handler
  const handleSyncCategories = async () => {
    setSyncLoading(true);
    setSyncMessage("");
    try {
      await axios.get("http://localhost:4000/api/admin/sync-categories");
      setSyncMessage("Categories sync complete!");
      fetchCategories(); // Refresh categories after sync
    } catch (err) {
      setSyncMessage("Categories sync failed!");
    }
    setSyncLoading(false);
  };

  const handleLogout = async (): Promise<void> => {
    try {
      const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;
      await fetch(`${apiUrl}/api/admin/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
          "Content-Type": "application/json",
        },
      });

      localStorage.removeItem("adminToken");
      window.dispatchEvent(new Event("storage"));
      navigate("/admin/login");
    } catch (err) {
      console.error("Logout failed:", err);
      localStorage.removeItem("adminToken");
      window.dispatchEvent(new Event("storage"));
      navigate("/admin/login");
    }
  };

  // Add this function for syncing catalog
  const handleSyncCatalog = async () => {
    setSyncLoading(true);
    setSyncMessage("");
    try {
      await axios.get("http://localhost:4000/api/admin/sync-catalog");
      setSyncMessage("Catalog sync complete!");
    } catch (err) {
      setSyncMessage("Catalog sync failed!");
    }
    setSyncLoading(false);
  };

  // Sync product list handler
  const handleSyncProductList = async () => {
    setSyncLoading(true);
    setSyncMessage("");
    try {
      await axios.get("http://localhost:4000/api/admin/sync-productlist");
      setSyncMessage("Product list sync complete!");
      // Optionally, fetch categories or products again here
    } catch (err) {
      setSyncMessage("Product list sync failed!");
    }
    setSyncLoading(false);
  };

  // Fetch all SKUs from all categories
  const fetchAllSkus = async () => {
    let allSkus: string[] = [];
    for (const cat of categories) {
      try {
        const res = await axios.get(`http://localhost:4000/api/admin/products/${cat.id}`);
        const skus = res.data.map((p: any) => p.sku);
        allSkus = allSkus.concat(skus);
      } catch (err) {
        // handle error if needed
      }
    }
    return allSkus;
  };

  useEffect(() => {
    fetchCategories();
  }, [navigate]);

  return (
    <div className="flex h-screen">
      {/* Sidebar for desktop (always on the left) */}
      <div className="hidden md:flex flex-col bg-gray-800 text-white w-64 p-5 space-y-4 h-screen fixed top-0 left-0 z-30">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <ul className="space-y-4">
          <li>
            <button
              onClick={() => setActiveSection("home")}
              className="flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-700 rounded"
            >
              <FiHome /> <span>Carousel</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSection("coupons")}
              className="flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-700 rounded"
            >
              <FiTag /> <span>Cards</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSection("orders")}
              className="flex items-center space-x-2 w-full text-left p-2 hover:bg-red-600 rounded"
            >
              <FiFileText /> <span>OrderDetails</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSection("customerDetails")}
              className="flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-700 rounded"
            >
              <FiUser /> <span>Customer Details</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSection("catalog")}
              className="flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-700 rounded"
            >
              <FiTag /> <span>Catalog Data</span>
            </button>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full text-left p-2 hover:bg-red-600 rounded"
            >
              <FiLogOut /> <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Sidebar overlay for mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="bg-black bg-opacity-40 w-full" onClick={() => setIsSidebarOpen(false)} />
          <div className="flex flex-col bg-gray-800 text-white w-64 p-5 space-y-4 h-full z-50">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-2xl self-end mb-4"
            >
              <FiX />
            </button>
            <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => { setActiveSection("home"); setIsSidebarOpen(false); }}
                  className="flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-700 rounded"
                >
                  <FiHome /> <span>Carousel</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveSection("coupons"); setIsSidebarOpen(false); }}
                  className="flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-700 rounded"
                >
                  <FiTag /> <span>Cards</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveSection("orders"); setIsSidebarOpen(false); }}
                  className="flex items-center space-x-2 w-full text-left p-2 hover:bg-red-600 rounded"
                >
                  <FiFileText /> <span>OrderDetails</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveSection("customerDetails"); setIsSidebarOpen(false); }}
                  className="flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-700 rounded"
                >
                  <FiUser /> <span>Customer Details</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveSection("catalog"); setIsSidebarOpen(false); }}
                  className="flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-700 rounded"
                >
                  <FiTag /> <span>Catalog Data</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { handleLogout(); setIsSidebarOpen(false); }}
                  className="flex items-center space-x-2 w-full text-left p-2 hover:bg-red-600 rounded"
                >
                  <FiLogOut /> <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Toggler for mobile */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-5 left-5 z-50 bg-gray-800 text-white p-2 rounded"
      >
        <FiMenu />
      </button>

      {/* Main content */}
      <div className="flex-1 bg-gray-100 p-5 md:ml-64 overflow-y-auto h-screen">
        {activeSection === "home" ? (<Admin />)
          : activeSection === "coupons" ? (<CardAdmin />)
          : activeSection === "customerDetails" ? (<CustomerDetails />)
          : activeSection === "orders" ? (<CustomerOrders />)
          : activeSection === "catalog" ? (
            <div>
              <h2 className="text-xl font-bold mb-4">Catalog Data</h2>
              {/* Removed individual sync buttons */}
              <button
                onClick={async () => {
                  setSyncLoading(true);
                  setSyncMessage("");
                  try {
                    await axios.get("http://localhost:4000/api/admin/sync-catalog");
                    await axios.get("http://localhost:4000/api/admin/sync-categories");
                    await axios.get("http://localhost:4000/api/admin/sync-productlist");
                    const skusRes = await axios.get("http://localhost:4000/api/admin/product-skus");
                    const allSkus = skusRes.data.skus;
                    if (allSkus && allSkus.length > 0) {
                      await axios.post("http://localhost:4000/api/admin/sync-productdetails", { skus: allSkus });
                    }
                    // Use the bulk endpoint for related products
                    await axios.post("http://localhost:4000/api/admin/sync-all-related-products");
                    setSyncMessage("All data sync complete!");
                  } catch (err) {
                    setSyncMessage("Data sync failed!");
                  }
                  setSyncLoading(false);
                }}
                className="bg-blue-900 text-white px-4 py-2 rounded shadow hover:bg-blue-800 transition mr-2"
                disabled={syncLoading}
              >
                {syncLoading ? "Syncing..." : "Sync Data"}
              </button>
              {syncMessage && (
                <div className="mt-2 text-sm text-green-700">{syncMessage}</div>
              )}
              <div className="mt-4">
                <label>Select Category: </label>
                <select
                  value={selectedCategoryId ?? ""}
                  onChange={e => {
                    const id = Number(e.target.value);
                    setSelectedCategoryId(id);
                    fetchProducts(id);
                  }}
                >
                  <option value="">-- Select --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4">
                {products.length > 0 ? (
                  <ul>
                    {products.map(product => (
                      <li key={product.sku}>
                        <strong>{product.name}</strong> - ₹{product.price}
                      </li>
                    ))}
                  </ul>
                ) : (
                  selectedCategoryId && <div>No products found for this category.</div>
                )}
              </div>
            </div>
          )
          : (<Admin />)
        }
      </div>
    </div>
  );
}

