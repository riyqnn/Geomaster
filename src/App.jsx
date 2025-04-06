import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapPage from "./Pages/Maps";  // Updated import
import Home from "./Pages/Home";
import Navbar from "./Components/Navbar";
import { ProductsAndServices, Solutions, Contact, FAQ } from "./Components/Content";
import Footer from "./Components/Footer";
import MapsLayout from "./Components/MapsLayout";
import Dashboard from "./Pages/Dashboard";

function App() {
  const HomePage = () => {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white min-h-screen">
        <div className="bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white">
          <Navbar />
          <Home />
          <ProductsAndServices />
          <Solutions />
          <Contact />
          <FAQ />
          <Footer />
        </div>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* Map Routes */}
        <Route path="/maps" element={<>

          <MapsLayout />
        </>
        } />

        {/* Other Routes */}
        <Route path="/products" element={
          <>
            <Navbar />
            <ProductsAndServices />
            <Footer />
          </>
        } />
        <Route path="/solutions" element={
          <>
            <Navbar />
            <Solutions />
            <Footer />
          </>
        } />
        <Route path="/contact" element={
          <>
            <Navbar />
            <Contact />
            <Footer />
          </>
        } />
        <Route path="/faq" element={
          <>
            <Navbar />
            <FAQ />
            <Footer />
          </>
        } />

      <Route 
        path="/dashboard" 
        element={
          <div className="bg-gradient-to-br from-gray-900 via-black to-blue-950">
            <Navbar />
            <Dashboard />
          </div>
        } 
      />
      </Routes>
    </Router>
  );
}

export default App;