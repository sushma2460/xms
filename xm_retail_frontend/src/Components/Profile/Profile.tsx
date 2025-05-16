import { useEffect, useState } from "react";
import { FaUserCircle, FaTimes } from "react-icons/fa";
import { IoCall } from "react-icons/io5";
import { MdEmail } from "react-icons/md";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import Logo from "../NavBar/assets/Group_1.png";

// Define the Card interface
interface Card {
  orderId: string;
  productName: string;
  amount: number;
  cardNumber: string;
  cardPin: string;
  issuanceDate: string;
  validity: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [user, setUser] = useState({ name: "", email: "", phone: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/api/user/profile?email=${storedUser.email}`
        );
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
      } catch (error) {
        console.error("Error fetching profile:", error);
        alert("Failed to load profile. Redirecting to login...");
        navigate("/");
      }
    };

    if (storedUser.email) fetchUserProfile();
    else {
      alert("No user data found. Redirecting to login...");
      navigate("/");
    }
  }, [navigate, storedUser.email]);

  // Fetch gift cards
  useEffect(() => {
    const fetchGiftCards = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("You are not logged in. Redirecting to login...");
        navigate("/");
        return;
      }

      try {
        const response = await axios.get(`${apiUrl}/api/orders/user-orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCards(response.data);
        localStorage.setItem("cards", JSON.stringify(response.data)); // Persist cards in localStorage
      } catch (error) {
        console.error("Error fetching gift cards:", error);
      }
    };

    // Load cards from localStorage if available
    const storedCards = localStorage.getItem("cards");
    if (storedCards) {
      setCards(JSON.parse(storedCards));
    } else {
      fetchGiftCards();
    }
  }, [navigate, apiUrl]);

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    try {
      await axios.put(`${apiUrl}/api/user/update-profile`, user);
      localStorage.setItem("user", JSON.stringify(user));
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("cards"); // Clear cards from localStorage on logout
    setCards([]); // Clear cards from state
    window.dispatchEvent(new Event("storage"));
    window.location.href = "/";
  };

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
  };

  const closeModal = () => {
    setSelectedCard(null);
  };

  // Calculate totals
  const totalSavings = cards.reduce((total, card) => {
    const originalPrice = card.amount / 0.95; // assuming 5% discount
    return total + (originalPrice - card.amount);
  }, 0);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Breadcrumb */}
      <div className="text-gray-500 text-sm mb-4">
        <span
          className="text-orange-500 cursor-pointer"
          onClick={() => navigate("/home")}
        >
          Home
        </span>{" "}
        / <span className="font-semibold">Profile Page</span>
      </div>

      {/* Profile Section */}
      <div className="bg-white shadow-lg rounded-2xl p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <FaUserCircle className="text-6xl text-gray-400" />
          <div>
            <h2 className="text-xl font-bold">
              Welcome <span className="text-orange-500">{user.name}</span> 👋
            </h2>
            {!isEditing && (
              <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                <IoCall /> {user.phone || "Not Provided"}
                <MdEmail /> {user.email}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded-lg"
            >
              Save Profile
            </button>
          ) : (
            <button
              onClick={handleEdit}
              className="bg-black text-white px-4 py-2 rounded-lg"
            >
              Edit Profile
            </button>
          )}
          <button className="border border-gray-300 px-4 py-2 rounded-lg">
            Contact Us
          </button>
        </div>

        {isEditing && (
          <div className="mt-6">
            <label className="block text-gray-600">Name</label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="w-full border p-2 rounded-lg mt-2"
            />

            <label className="block text-gray-600 mt-4">Email</label>
            <input
              type="text"
              value={user.email}
              className="w-full border p-2 rounded-lg mt-2"
              disabled
            />

            <label className="block text-gray-600 mt-4">Phone</label>
            <input
              type="text"
              value={user.phone}
              onChange={(e) => {
                const input = e.target.value;
                if (/^\d{0,10}$/.test(input)) {
                  setUser({ ...user, phone: input });
                }
              }}
              className="w-full border p-2 rounded-lg mt-2"
            />
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="mt-6 bg-purple-600 text-white p-6 rounded-2xl shadow-lg max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <p className="text-sm">Total Savings</p>
          <h3 className="text-2xl font-bold">₹{totalSavings.toFixed(2)}</h3>
        </div>
        <div>
          <p className="text-sm">Total Bought</p>
          <h3 className="text-2xl font-bold">{cards.length}</h3>
        </div>
        <button className="bg-black text-white px-4 py-2 rounded-lg">
          View Refunds
        </button>
      </div>

      {/* My Gift Cards Section */}
      <div className="mt-6 max-w-4xl mx-auto bg-[#E5E5E5] p-6 rounded-2xl shadow-inner">
        <h3 className="text-xl font-semibold mb-4">My Gift Cards</h3>

        {cards.length === 0 ? (
          <p className="text-center bg-gray-200 p-6 rounded-2xl">
            No gift cards found.
          </p>
        ) : (
          <Carousel
            additionalTransfrom={0}
            arrows
            autoPlaySpeed={3000}
            centerMode={false}
            className=""
            containerClass="container-with-dots"
            dotListClass=""
            draggable
            focusOnSelect={false}
            infinite={false}
            itemClass="px-2"
            keyBoardControl
            minimumTouchDrag={80}
            renderButtonGroupOutside={false}
            renderDotsOutside={false}
            responsive={{
              superLargeDesktop: {
                breakpoint: { max: 4000, min: 1536 },
                items: 4,
              },
              desktop: {
                breakpoint: { max: 1536, min: 1024 },
                items: 3,
              },
              tablet: {
                breakpoint: { max: 1024, min: 768 },
                items: 2,
              },
              mobile: {
                breakpoint: { max: 768, min: 0 },
                items: 1,
              },
            }}
            showDots={false}
            sliderClass=""
            slidesToSlide={1}
            swipeable
          >
            {cards.map((card) => (
              <div
                key={card.orderId}
                className="bg-white rounded-2xl shadow-md p-4 w-full h-full flex flex-col justify-between hover:shadow-lg transition duration-300 cursor-pointer group relative"
                onClick={() => handleCardClick(card)} // Open modal with card details
              >
                <div className="relative">
                  {/* Card Content */}
                  <h4 className="text-lg font-semibold text-gray-800 mb-2 truncate relative z-10">
                    {card.productName}
                  </h4>
                  <p className="text-sm text-gray-600 relative z-10">
                    <span className="font-medium">Issued:</span>{" "}
                    {new Date(card.issuanceDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Logo and Name in Bottom-Right Corner */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10">
                  <img
                    src={Logo} // Replace with the actual path to your logo file
                    alt="Gift Card Logo"
                    className="h-4 w-auto filter grayscale" // Apply grayscale filter to match text color
                  />
                  <span className="text-[10px] font-medium text-gray-400">
                    XM RETAIL
                  </span>
                </div>
              </div>
            ))}
          </Carousel>
        )}
      </div>

      {/* Modal for Card Details */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-11/12 sm:w-2/3 lg:w-1/3 relative"
            style={{
              backgroundImage: `repeating-linear-gradient(
                135deg,
                rgba(128, 128, 128, 0.1),
                rgba(128, 128, 128, 0.1) 10px,
                transparent 10px,
                transparent 20px
              )`,
              backgroundSize: "20px 20px",
            }}
          >
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={closeModal}
            >
              <FaTimes size={20} />
            </button>

            {/* Card Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {selectedCard.productName}
              </h3>
              <p className="text-sm text-gray-500">
                Issued on:{" "}
                {new Date(selectedCard.issuanceDate).toLocaleDateString()}
              </p>
            </div>

            {/* Card Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Amount:</span>
                <span className="text-lg font-semibold text-green-600">
                  ₹{selectedCard.amount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Card Number:</span>
                <span className="font-mono text-blue-700">
                  {selectedCard.cardNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">PIN:</span>
                <span className="font-mono text-red-600">
                  {selectedCard.cardPin}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Valid Till:</span>
                <span className="text-gray-800">
                  {new Date(selectedCard.validity).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <button
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Section */}
      <div className="mt-6 max-w-4xl mx-auto text-gray-600 text-sm flex justify-between items-center">
        <div>
          <p>Terms of Service</p>
          <p>Privacy Policy</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
    </div>
  );
}