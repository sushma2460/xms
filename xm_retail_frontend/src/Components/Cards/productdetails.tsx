import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "../NavBar/Nav";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Product {
  sku: string;
  name: string;
  description: string;
  shortDescription: string;
  price: {
    price: string;
    value?: number;
    type: string;
    min: string;
    max: string;
    denominations?: string[];
    currency: {
      code: string;
      symbol: string;
      numericCode: string;
    } | string;
  };
  images: {
    thumbnail: string;
    mobile: string;
    base: string;
    small: string;
  };
  currency: string;
  url: string;
}

interface OrderCard {
  sku: string;
  productName: string;
  amount: number;
  cardNumber: string;
  cardPin: string;
  validity: string;
  issuanceDate: string | null;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  balance: number | null;
}

const ProductDetails: React.FC = () => {
  const { productSku } = useParams<{ productSku: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDenomination, setSelectedDenomination] = useState<string>("");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [orderData, setOrderData] = useState<OrderCard | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("user");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (productSku) {
          const response = await axios.get(
            `http://localhost:4000/api/woohoo/product/details/${productSku}`
          );
          const data = response.data;
          if (data) {
            setProduct(data);
            if (data.price?.denominations?.length) {
              setSelectedDenomination(data.price.denominations[0]);
            }
          } else {
            setError("Product not found");
          }
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productSku]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        if (productSku) {
          const response = await axios.get(
            `http://localhost:4000/api/woohoo/products/${productSku}/related`
          );
          const relatedProductsData = response.data?.relatedProducts || [];
          setRelatedProducts(
            Array.isArray(relatedProductsData) ? relatedProductsData : []
          );
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
        setRelatedProducts([]);
      }
    };

    fetchRelatedProducts();
  }, [productSku]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleDenominationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDenomination(e.target.value);
  };

  const handleAddToCart = () => {
    if (!product || !selectedDenomination) return;

    let cart: any[] = [];

    try {
      const storedCart = localStorage.getItem("cart");
      cart = storedCart ? JSON.parse(storedCart) : [];
    } catch (err) {
      console.error("Invalid cart JSON in localStorage. Resetting cart.", err);
      cart = [];
    }

    const existingItemIndex = cart.findIndex(
      (item) =>
        item.sku === product.sku && item.denomination === selectedDenomination
    );

    let priceValue = product.price.value ?? parseFloat(selectedDenomination);
    if (isNaN(priceValue)) {
      priceValue = parseFloat(selectedDenomination);
    }

    const currencySymbol =
      typeof product.price.currency === "object"
        ? product.price.currency.symbol
        : product.price.currency || "₹";

    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({
        sku: product.sku,
        name: product.name,
        image: product.images.thumbnail || product.images.base,
        denomination: selectedDenomination,
        currency: currencySymbol,
        quantity: 1,
        price: priceValue,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    navigate("/cart");
  };

  const handleBuyNowClick = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (!selectedDenomination) {
      alert("Please select a denomination");
      return;
    }

    setIsPaymentProcessing(true);

    try {
      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setIsPaymentProcessing(false);
        return;
      }

      const orderResponse = await axios.post("http://localhost:4000/api/payment/order", {
        amount: selectedDenomination,
        currency: "INR",
      });

      const orderData = orderResponse.data.data;

      if (!orderData || !orderData.id) {
        alert("Failed to create order. Please try again.");
        setIsPaymentProcessing(false);
        return;
      }

      const options = {
        key: "rzp_test_lqwCQUylHVfPtp",
        amount: parseInt(selectedDenomination, 10) * 100,
        currency: "INR",
        name: product?.name || "Product",
        description: product?.shortDescription || "Purchase",
        image: product?.images?.base || "/placeholder-image.jpg",
        order_id: orderData.id,
        handler: async (response: any) => {
          setIsPaymentProcessing(false);
          try {
            const verifyResponse = await axios.post("http://localhost:4000/api/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.data.success) {
              const orderApiResponse = await axios.post("http://localhost:4000/api/order/place-order", {
                sku: product?.sku,
                price: selectedDenomination,
                razorpay_order_id: response.razorpay_order_id,
                email: storedUser.email,
                phone: storedUser.phone,
                name: storedUser.name,
                quantity: 1,
              });

              const cards: OrderCard[] = orderApiResponse.data.data.cards;
              if (!cards || cards.length === 0) {
                alert("Order placed but no card details returned. Please contact support.");
                return;
              }
              setOrderData(cards[0]);
              setShowSuccessModal(true);
            } else {
              alert("Payment verification failed.");
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Verification failed. Please try again.");
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
            setIsPaymentProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed. Please try again.");
      setIsPaymentProcessing(false);
    }
  };

  return (
    <>
      <Nav />
     <div className="max-w-7xl mx-auto px-4 py-10">
  {loading && (
    <p className="text-center text-gray-500 text-lg">Loading product details...</p>
  )}
  {error && <p className="text-center text-red-500 text-lg">{error}</p>}
  {!loading && !error && product && (
    <>
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
        {product.name}
      </h1>
      <div className="flex flex-col md:flex-row gap-10">
        <div className="md:w-1/3">
          <img
            src={product.images.base}
            alt={product.name}
            className="w-full h-auto object-contain rounded-xl shadow-md"
          />
        </div>
        <div className="md:w-2/3 space-y-6">
          <p className="text-gray-700 text-base leading-relaxed">
            {product.description}
          </p>

          {product.price.denominations && product.price.denominations.length > 0 && (
            <div>
              <label
                htmlFor="denomination"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Denomination:
              </label>
              <select
                id="denomination"
                value={selectedDenomination}
                onChange={handleDenominationChange}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {product.price.denominations.map((denom) => (
                  <option key={denom} value={denom}>
                    ₹{denom}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleAddToCart}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
            >
              Add to Cart
            </button>

            <button
              onClick={handleBuyNowClick}
              disabled={isPaymentProcessing}
              className={`px-6 py-3 rounded-lg font-semibold transition duration-200 text-white ${
                isPaymentProcessing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isPaymentProcessing ? "Processing..." : "Buy Now"}
            </button>
          </div>
        </div>
      </div>
    


            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-semibold mb-4">Related Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedProducts.map((rp) => (
                    <div
                      key={rp.sku}
                      className="border rounded p-2 cursor-pointer hover:shadow-lg"
                      onClick={() => navigate(`/product/${rp.sku}`)}
                    >
                      <img
                        src={rp.images.thumbnail || rp.images.base}
                        alt={rp.name}
                        className="w-full h-32 object-contain mb-2"
                      />
                      <p className="font-semibold text-center">{rp.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

     {/* Success Modal */}
<AnimatePresence>
  {showSuccessModal && (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl p-4 w-full max-w-xs shadow-xl relative"
        initial={{ y: "-100vh", rotate: -5 }}
        animate={{
          y: 0,
          rotate: 0,
          transition: {
            type: "spring",
            stiffness: 120,
            damping: 14
          }
        }}
        exit={{ y: "100vh", rotate: 5 }}
      >
        {/* Compact Coupon Card */}
        <motion.div
          className="border-2 border-dashed border-yellow-400 rounded-lg p-3 relative bg-gradient-to-br from-yellow-50 to-amber-50 overflow-hidden"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {/* Floating confetti */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-yellow-400 text-sm"
                initial={{
                  y: -10,
                  x: Math.random() * 80 - 40,
                  opacity: 0,
                  rotate: Math.random() * 360
                }}
                animate={{
                  y: Math.random() * 60 + 30,
                  opacity: [0, 1, 0],
                  rotate: Math.random() * 360 + 180
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                }}
              >
                {['★', '✿', '✧'][Math.floor(Math.random() * 3)]}
              </motion.div>
            ))}
          </div>

          {/* Coupon header */}
          <motion.div
            className="text-center mb-1"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.h2
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-red-500"
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              🎟 GIFT CARD
            </motion.h2>
            <p className="text-[0.65rem] text-amber-700">Payment Successful!</p>
          </motion.div>

          {/* Main coupon content */}
          <div className="space-y-1">
            <motion.div
              className="border-b border-amber-200 pb-1"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="font-semibold text-xs text-amber-800 tracking-wider">ADMIT ONE</p>
              <div className="flex justify-between text-[0.65rem] text-amber-700">
                <p>{new Date().toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <p>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </motion.div>

            <motion.div
              className="text-center py-1"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.4 }}
            >
              <p className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                ₹{orderData?.amount || '0'}
              </p>
            </motion.div>

            {/* Full Details Section (No Scrollbar) */}
            <motion.div
              className="text-xs border border-amber-200 rounded p-1"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="font-semibold text-amber-700 py-0.5 pr-2">Card No:</td>
                    <td className="text-gray-800">{orderData?.cardNumber || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-amber-700 py-0.5 pr-2">PIN:</td>
                    <td className="text-gray-800">{orderData?.cardPin || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-amber-700 py-0.5 pr-2">Product:</td>
                    <td className="text-gray-800">{product?.name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-amber-700 py-0.5 pr-2">SKU:</td>
                    <td className="text-gray-800">{orderData?.sku || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-amber-700 py-0.5 pr-2">Valid Until:</td>
                    <td className="text-gray-800">{orderData?.validity || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-amber-700 py-0.5 pr-2">Issued On:</td>
                    <td className="text-gray-800">{orderData?.issuanceDate || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-amber-700 py-0.5 pr-2">Status:</td>
                    <td className="text-green-600 font-semibold">{orderData?.status || 'Confirmed'}</td>
                  </tr>
                </tbody>
              </table>
            </motion.div>

            <motion.p
              className="text-center text-[0.65rem] mt-1 font-bold text-white bg-amber-500 py-0.5 px-2 rounded-full inline-block"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 1 }}
            >
              LIMITED OFFER ✨
            </motion.p>
          </div>

          {/* Perforation marks */}
          <motion.div
            className="absolute -left-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-dashed border-amber-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute -right-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-dashed border-amber-400"
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        {/* Close Button */}
        <motion.div
          className="mt-3 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <button
            onClick={() => setShowSuccessModal(false)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-1.5 rounded-full shadow text-xs font-medium transition-all"
          >
            Got It!
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </>
  );
};

export default ProductDetails;
