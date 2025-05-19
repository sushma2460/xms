// src/components/DashBoard.tsx
import { FiHome, FiLogOut, FiMenu, FiTag, FiX ,FiUser ,FiFileText} from "react-icons/fi";
import { JSX, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Admin from "./Admin";
import CardAdmin from "./CardAdmin";
import CustomerDetails from "./CustomerDetails"; 
import {CustomerOrders} from "./CustomerOrders"; 

export default function DashBoard(): JSX.Element {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<"home" | "coupons" | "customerDetails"| "orders">("home");
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
          : (<Admin />)
        }
      </div>
    </div>
  );
}

