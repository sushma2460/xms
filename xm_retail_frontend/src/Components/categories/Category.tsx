import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

import BANKING from "./assets/imgs/Bank.png";
import BEAUTY_GROOMING from "./assets/imgs/Beauty.png";
import BIGGEST_SALES from "./assets/imgs/Top.png";
import DEPARTMENTAL from "./assets/imgs/Fashion.png";
import EDUCATION from "./assets/imgs/Education.png";
import ELECTRONICS from "./assets/imgs/Electronics.png";
import FASHION from "./assets/imgs/Fashion.png";
import FOOD_GROCERY from "./assets/imgs/Hotel.png";
import HEALTH_WELLNESS from "./assets/imgs/Health.png";
import HOME_KITCHEN from "./assets/imgs/Home.png";
import HOSTING from "./assets/imgs/Hosting.png";
import HOTELS_FLIGHTS from "./assets/imgs/Hotel.png";
import MOBILES from "./assets/imgs/Mobile.png";
import PHARMACY from "./assets/imgs/Pharmacy.png";
import { useRef } from "react";

// Replace these imports with actual image files in your project.

interface Category {
  name: string;
  icon: string;
}

const categories: Category[] = [
  { name: "BIGGEST SALES", icon: BIGGEST_SALES },
  { name: "BANKING", icon: BANKING },
  { name: "HOTELS & FLIGHTS", icon: HOTELS_FLIGHTS },
  { name: "ELECTRONICS", icon: ELECTRONICS },
  { name: "MOBILES", icon: MOBILES },
  { name: "FASHION", icon: FASHION },
  { name: "BEAUTY & GROOMING", icon: BEAUTY_GROOMING },
  { name: "HEALTH & WELLNESS", icon: HEALTH_WELLNESS },
  { name: "PHARMACY", icon: PHARMACY },
  { name: "HOME & KITCHEN", icon: HOME_KITCHEN },
  { name: "EDUCATION", icon: EDUCATION },
  { name: "FOOD & GROCERY", icon: FOOD_GROCERY },
  { name: "HOSTING", icon: HOSTING },
  { name: "DEPARTMENTAL", icon: DEPARTMENTAL },
];

interface CategoryProps {
  setSelectedCategory: (category: string) => void; // Function to set the selected category
}

const Category: React.FC<CategoryProps> = ({ setSelectedCategory }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category); // Set the category for the parent component
  };

  return (
    <div className="relative overflow-hidden rounded-sm p-6">
      <div className="w-full py-6 px-4">
        <h2 className="text-xl font-semibold mb-4">TOP CATEGORIES</h2>
        <div className="relative w-full">
          {/* Left Button */}
          <button
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10"
            onClick={scrollLeft}
          >
            <FaChevronLeft size={20} />
          </button>

          {/* Category Slider */}
          <div ref={sliderRef} className="flex overflow-hidden scrollbar-hide gap-4 p-2 scroll-smooth">
            {categories.map((category, index) => (
              <div
                key={index}
                className="flex flex-col items-center bg-white rounded-lg shadow-md px-6 py-4 min-w-[200px]"
                onClick={() => handleCategoryClick(category.name)} // Set category when clicked
              >
                <img
                  src={category.icon}
                  alt={category.name}
                  className="w-20 h-15 mb-2"
                />
                <p className="text-sm font-medium">{category.name}</p>
              </div>
            ))}
          </div>

          {/* Right Button */}
          <button
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10"
            onClick={scrollRight}
          >
            <FaChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Category;
