import CardApp from "./Components/Cards/CardApp";
import Categorycards from "./Components/Cards/categorycards";
// import ProductDetails from "./Components/Cards/productdetails";
// import ProductList from "./Components/Cards/productslistcards";
import Product from "./Components/Cards/WoohooAllCards";
import Carousel from "./Components/Carousel/Carousels";
import Category from "./Components/categories/Category";
import Nav from "./Components/NavBar/Nav";
import { useState } from "react";

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  return (
    <>
      <Nav />
      <Carousel />
      <Category setSelectedCategory={setSelectedCategory} />
      <CardApp selectedCategory={selectedCategory} />
      {/* <ProductDetails /> */}
      <Categorycards />
      <Product />
    </>
  );
};

export default App;
