import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import Nav from "../NavBar/Nav";

interface CartItem {
  sku: string;
  name: string;
  image: string;
  denomination: string;
  currency: { symbol: string };
  quantity: number;
  price: string | number;
}

interface OrderData {
  amount: number;
  cardNumber: string;
  cardPin: string;
  sku: string;
  validity: string;
  issuanceDate: string;
  status: string;
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderDataList, setOrderDataList] = useState<OrderData[]>([]);
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = !!storedUser?.email;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const totalAmount = cart.reduce(
    (acc, item) => acc + Number(item.denomination) * item.quantity,
    0
  );

  const updateQuantity = (sku: string, denomination: string, delta: number) => {
    const updatedCart = cart
      .map((item) => {
        if (item.sku === sku && item.denomination === denomination) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty > 0 ? newQty : 1 };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const removeItem = (sku: string, denomination: string) => {
    const updatedCart = cart.filter(
      (item) => !(item.sku === sku && item.denomination === denomination)
    );
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setIsProcessing(true);

    try {
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        alert("Razorpay SDK failed to load.");
        setIsProcessing(false);
        return;
      }

      const orderResponse = await axios.post("http://localhost:4000/api/payment/order", {
        amount: totalAmount,
        currency: "INR",
      });

      const order = orderResponse.data.data;
      if (!order || !order.id) {
        alert("Failed to create Razorpay order.");
        setIsProcessing(false);
        return;
      }

      const options = {
        key: "rzp_test_lqwCQUylHVfPtp",
        amount: totalAmount * 100,
        currency: "INR",
        name: "Woohoo Cart Checkout",
        description: `Order for ${cart.length} item(s)`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyResponse = await axios.post("http://localhost:4000/api/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.data.success) {
              const successfulOrders: OrderData[] = [];

              for (const item of cart) {
                try {
                  const result = await axios.post("http://localhost:4000/api/order/place-order", {
                    sku: item.sku,
                    price: item.denomination,
                    quantity: item.quantity,
                    razorpay_order_id: response.razorpay_order_id,
                    email: storedUser.email,
                    phone: storedUser.phone,
                    name: storedUser.name,
                    refno: `${response.razorpay_order_id}-${item.sku}-${Date.now()}`,
                  });

                  const cards = result.data?.data?.cards || [];
                  for (const card of cards) {
                    successfulOrders.push({
                      amount: card.amount,
                      cardNumber: card.cardNumber,
                      cardPin: card.cardPin || "N/A",
                      sku: card.sku,
                      validity: card.validity || "N/A",
                      issuanceDate: card.issuanceDate || "N/A",
                      status: result.data?.status || "Success",
                    });
                  }
                } catch (orderError) {
                  console.error("Order failed for item:", item, orderError);
                  alert(`Order failed for item ${item.name}. Continuing...`);
                }
              }

              setOrderDataList(successfulOrders);
              setShowSuccessModal(true);
              localStorage.removeItem("cart");
              setCart([]);
            } else {
              alert("Payment verification failed.");
            }
          } catch (err) {
            console.error("Error verifying or placing order:", err);
            alert("Something went wrong during order placement.");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: storedUser.name,
          email: storedUser.email,
          contact: `+91${storedUser.phone}`,
        },
        theme: {
          color: "#F37254",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Checkout failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="p-6 max-w-4xl mx-auto m-12">
        <div className="flex items-center justify-between mb-6">
          <Link to="/products/121" className="text-blue-600 hover:underline text-sm">
            ← Back to Products
          </Link>
          
          
        </div>
        <h1 className="text-3xl font-bold">Your Cart</h1>

        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <table className="w-full mb-6 border border-gray-200 rounded">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Price</th>
                <th className="p-2 text-right">Subtotal</th>
                <th className="p-2 text-center">Remove</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={`${item.sku}-${item.denomination}`}>
                  <td className="p-2 flex items-center gap-2">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Denomination: {item.currency.symbol}
                        {item.denomination}
                      </p>
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <motion.div
                      className="flex justify-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="inline-flex bg-white shadow-sm border rounded-full overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.sku, item.denomination, -1)}
                          className="px-4 py-1 bg-gray-100 hover:bg-red-200 transition text-red-600 font-semibold text-lg focus:outline-none"
                        >
                          −
                        </button>
                        <span className="px-4 py-1 text-center font-medium bg-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.sku, item.denomination, 1)}
                          className="px-4 py-1 bg-gray-100 hover:bg-green-200 transition text-green-600 font-semibold text-lg focus:outline-none"
                        >
                          +
                        </button>
                      </div>
                    </motion.div>
                  </td>
                  <td className="p-2 text-right">
                    {item.currency.symbol}
                    {item.denomination}
                  </td>
                  <td className="p-2 text-right">
                    {item.currency.symbol}
                    {Number(item.denomination) * item.quantity}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeItem(item.sku, item.denomination)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove Item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t border-gray-300">
                <td colSpan={3} className="p-2 text-right">
                  Total:
                </td>
                <td className="p-2 text-right" colSpan={2}>
                  {cart[0]?.currency.symbol}
                  {totalAmount}
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        <button
          onClick={handleCheckout}
          disabled={isProcessing || cart.length === 0}
          className={`${
            isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          } text-white px-6 py-3 rounded shadow-md transition`}
        >
          {isProcessing ? "Processing..." : "Checkout"}
        </button>

        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-xl relative overflow-auto max-h-[80vh]"
                initial={{ y: "-100vh", rotate: -5 }}
                animate={{ y: 0, rotate: 0 }}
                exit={{ y: "100vh", rotate: 5 }}
              >
                <h2 className="text-xl font-bold mb-4 text-center">🎉 Order Successful!</h2>
                <p className="mb-6 text-center">Thank you for your purchase. Here are your gift card details:</p>

                <table className="w-full text-sm mb-4 border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">SKU</th>
                      <th className="p-2 text-left">Amount</th>
                      <th className="p-2 text-left">Card No</th>
                      <th className="p-2 text-left">PIN</th>
                      <th className="p-2 text-left">Validity</th>
                      <th className="p-2 text-left">Issued On</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDataList.map((orderData, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{orderData.sku}</td>
                        <td className="p-2">₹{orderData.amount}</td>
                        <td className="p-2">{orderData.cardNumber}</td>
                        <td className="p-2">{orderData.cardPin}</td>
                        <td className="p-2">{orderData.validity}</td>
                        <td className="p-2">{orderData.issuanceDate}</td>
                        <td className="p-2 text-green-600 font-semibold">{orderData.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-center">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default CartPage;
