import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
<<<<<<< HEAD
import { FaUserCircle, FaShoppingCart } from "react-icons/fa";
=======
import { FaUserCircle } from "react-icons/fa";
>>>>>>> 0d70c2e5abfa15c88e8ce628cc9b14bb0ed6a166
import axios from "axios";
import Logo from "./assets/Group_1.png";

interface SearchResult {
  id: number;
  name: string;
  type: "card" | "product" | "category";
  image?: string;
  cashback?: string;
  sku?: string;
}

function Nav() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("user"));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("user"));
  }, [location]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      setShowDropdown(false);
      setActiveIndex(null);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/search`, {
          params: { query: searchTerm },
        });
        setSearchResults(response.data);
        setShowDropdown(true);
        setActiveIndex(null);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };

    const debounceTimer = setTimeout(fetchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, apiUrl]);

  const handleResultClick = (result: SearchResult) => {
    setSearchTerm(result.name);
    setShowDropdown(false);
    setActiveIndex(null);

    let path = `/${result.type}/${result.id}`;

    if (result.type === "product" && result.sku) {
      path = `/product/${result.sku}`;
    }

    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prevIndex) => {
        const newIndex = prevIndex === null ? 0 : prevIndex + 1;
        return newIndex >= searchResults.length ? 0 : newIndex;
      });
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prevIndex) => {
        const newIndex = prevIndex === null ? searchResults.length - 1 : prevIndex - 1;
        return newIndex < 0 ? searchResults.length - 1 : newIndex;
      });
    }

    if (e.key === "Enter" && activeIndex !== null) {
      e.preventDefault();
      handleResultClick(searchResults[activeIndex]);
    }
  };

  return (
    <nav className="bg-[#F8F9FA] border-b border-[#E0E0E0] dark:bg-[#1A202C] w-full fixed top-0 z-50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-3 py-2 sm:py-3">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={Logo}
            className="h-6 w-16 sm:h-8 sm:w-20 md:h-10 md:w-24 transition-all duration-300"
            alt="XM RETAIL"
          />
          <span className="text-base sm:text-lg md:text-xl font-semibold dark:text-white hidden sm:block">
            XM RETAIL
          </span>
        </Link>

        <div className="relative flex-1 mx-2 sm:mx-4 md:mx-6 lg:mx-8">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            onKeyDown={handleKeyDown}
<<<<<<< HEAD
            className="block w-full p-2.5 pl-10 text-sm sm:text-base text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Search products, cards, or categories..."
          />
          <div className="absolute inset-y-0 left-2 flex items-center text-gray-500">🔍</div>
        </div>

        {!isLoggedIn&&location.pathname === "/" && (
=======
            className="block w-full p-2.5 pl-10 text-sm sm:text-base text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
            placeholder="Search products, cards, or categories..."
          />
          <div className="absolute inset-y-0 left-2 flex items-center text-gray-500">
            🔍
          </div>

          {/* Search Results Dropdown */}
          {showDropdown && (
            <div className="absolute top-11 sm:top-12 left-0 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <div
                    key={result.id}
                    className={`flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer ${
                      activeIndex === index ? "bg-orange-100" : ""
                    }`}
                    onMouseDown={() => handleResultClick(result)}
                  >
                    <div className="flex items-center gap-2">
                      {result.image && (
                        <img
                          src={`${apiUrl}/uploads/${result.image}`}
                          alt={result.name}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                        />
                      )}
                      <span className="font-medium text-sm sm:text-base">
                        {result.name}
                      </span>
                    </div>
                    {result.cashback && (
                      <span className="text-xs sm:text-sm font-semibold text-gray-600">
                        {result.cashback}%
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-2 text-sm">
                  No results found
                </p>
              )}
            </div>
          )}
        </div>

        {/* Login/Signup Button */}
        {location.pathname === "/" && (
>>>>>>> 0d70c2e5abfa15c88e8ce628cc9b14bb0ed6a166
          <Link to="/login">
            <button className="text-white bg-[#ff6726] hover:bg-[#FFB74D] rounded-md text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-3 font-semibold">
              Login/Sign up
            </button>
          </Link>
        )}

<<<<<<< HEAD
        {isLoggedIn && (
          <Link to="/cart" className="text-gray-700 hover:text-orange-500">
            <FaShoppingCart className="text-2xl mx-2" />
          </Link>
        )}

        {isLoggedIn && (
=======
        {/* Profile Icon */}
        {location.pathname === "/home" && isLoggedIn && (
>>>>>>> 0d70c2e5abfa15c88e8ce628cc9b14bb0ed6a166
          <Link to="/profile">
            <FaUserCircle className="text-2xl text-gray-700 cursor-pointer" />
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Nav;