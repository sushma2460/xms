import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useEffect, useState } from "react";
import axios from "axios";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

function Carousels() {
  const [images, setImages] = useState<string[]>([]);
  const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;

  // Fetch images from the API
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/images`);
        console.log("API Response:", response.data); // Debugging

        // Ensure response.data is an array
        if (Array.isArray(response.data)) {
          setImages(response.data);
        } else if (response.data && Array.isArray(response.data.images)) {
          setImages(response.data.images);
        } else {
          console.error("Unexpected response format:", response.data);
          setImages([]); // Fallback to an empty array
        }
      } catch (error) {
        console.error("Error fetching images:", error);
        setImages([]); // Ensure `images` is always an array
      }
    };

    fetchImages();
  }, [apiUrl]);

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 1536 },
      items: 4,
    },
    desktop: {
      breakpoint: { max: 1536, min: 1024 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 1024, min: 640 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 640, min: 0 },
      items: 1,
    },
  };

  return (
    <div className="relative overflow-hidden mt-4 rounded-lg p-2 sm:p-4 mx-2 sm:mx-4 lg:mx-6">
      <Carousel
        responsive={responsive}
        infinite
        autoPlay
        autoPlaySpeed={3000}
        keyBoardControl
        customLeftArrow={
          <button className="p-1 sm:p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 absolute left-1 top-1/2 -translate-y-1/2 z-10">
            <FaChevronLeft size={16} className="sm:w-5 sm:h-5" />
          </button>
        }
        customRightArrow={
          <button className="p-1 sm:p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 absolute right-1 top-1/2 -translate-y-1/2 z-10">
            <FaChevronRight size={16} className="sm:w-5 sm:h-5" />
          </button>
        }
        containerClass="carousel-container"
        itemClass="px-1"
        removeArrowOnDeviceType={[]}
        draggable
        swipeable
        transitionDuration={600}
      >
        {images.length > 0 ? (
          images.map((img, idx) => (
            <div key={idx} className="w-full flex justify-center items-center">
              <img
                src={`${apiUrl}${img}`}
                alt={`Slide ${idx + 1}`}
                className="
                  w-full
                  h-[160px]
                  sm:h-[200px]
                  md:h-[220px]
                  lg:h-[250px]
                  xl:h-[280px]
                  object-cover
                  rounded-lg
                  shadow-md
                  transition-all
                  duration-300
                "
                style={{ maxWidth: "100%", objectFit: "cover" }}
              />
            </div>
          ))
        ) : (
          <div className="w-full text-center">No images available</div>
        )}
      </Carousel>
    </div>
  );
}

export default Carousels;
