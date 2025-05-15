import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ProductList from "./src/Components/Cards/productslistcards"; // ✅
import App from "./src/App";
import Login from "./src/Components/Login/Login";
import ProtectedRoute from "./src/Components/ProtectedRoute";
import Home from "./src/Components/Login/Home";
import Profile from "./src/Components/Profile/Profile";
import CardDetails from "./src/Components/Cards/CardDetails";
import AdminLogin from "./src/Components/Admin/AdminLogin";
import AdminProtectedRoute from "./src/Components/AdminProtectedRoute";
import DashBoard from "./src/Components/Admin/DashBoard";
import ProductDetails from "./src/Components/Cards/productdetails";
import CartPage from "./src/Components/Cards/CartPage";

function Routess() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />

        {/* User Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cards/:id" element={<CardDetails />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin/dashboard" element={<DashBoard />} />
        </Route>

        {/* ✅ Add ProductList route here */}
        <Route path="/products/:categoryId" element={<ProductList />} />
        <Route path="/product/:productSku" element={<ProductDetails />} />
        <Route path="/cart" element={<CartPage/>} />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
}

export default Routess;
