import React, { useEffect, useState } from "react";
import axios from "axios";

export const CustomerOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/order/orderdetails");
        const data = response.data;
        if (data.success) {
          setOrders(data.data);
          setError(null);
        } else {
          setError(data.message || "No order data found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.toLowerCase();
    return (
      order.refno?.toLowerCase().includes(search) ||
      order.sku?.toLowerCase().includes(search) ||
      order.productName?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">Customer Orders</h1>

      <div className="mb-4 max-w-md mx-auto">
        <input
          type="text"
          placeholder="Search by Ref No, SKU, or Product Name"
          className="w-full px-4 py-2 border rounded shadow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <p className="text-center text-blue-500">Loading...</p>}

      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && filteredOrders.length === 0 && (
        <p className="text-center text-gray-600">No matching orders found.</p>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Refno</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">ProductName</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">CreatedAt</th>
                <th className="py-3 px-4">UpdatedAt</th>
                <th className="py-3 px-4">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-4">{order.id || order._id}</td>
                  <td className="py-2 px-4">{order.refno || "N/A"}</td>
                  <td className="py-2 px-4">{order.sku}</td>
                  <td className="py-2 px-4">{order.productName}</td>
                  <td className="py-2 px-4">₹{order.amount}</td>
                  <td className="py-2 px-4">{order.createdAt}</td>
                  <td className="py-2 px-4">{order.updatedAt}</td>
                  <td className="py-2 px-4">{order.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
