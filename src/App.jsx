import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapPage from "./Pages/Maps";
import Home from "./Pages/Home";
import Navbar from "./Components/Navbar";
import { ProductsAndServices, Solutions, Contact, FAQ } from "./Components/Content";
import Footer from "./Components/Footer";
import MapsLayout from "./Components/MapsLayout";
import Dashboard from "./Pages/Dashboard";
import ZoonosisPredictor from "./Pages/Prediction";

function App() {
  const HomePage = () => {
    return (
      <>
        <Navbar />
        <div className="bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white pt-24">
         <Home/>
         <ProductsAndServices />
         <Solutions/>
         <FAQ />
        <Contact />
        <Footer />
        </div>
      </>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/predict" element={
          <>
            <Navbar />
            <ZoonosisPredictor />
            <Footer />
          </>
        } />
        
        <Route path="/maps" element={
          <MapsLayout />
        } />

        <Route path="/products" element={
          <>
            <Navbar />
            <div className="bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white">
              <ProductsAndServices />
            </div>
            <Footer />
          </>
        } />
        <Route path="/solutions" element={
          <>
            <Navbar />
            <div className="bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white">
              <Solutions />
            </div>
            <Footer />
          </>
        } />
        <Route path="/contact" element={
          <>
            <Navbar />
            <div className="bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white">
              <Contact />
            </div>
            <Footer />
          </>
        } />
        <Route path="/faq" element={
          <>
            <Navbar />
            <div className="bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white">
              <FAQ />
            </div>
            <Footer />
          </>
        } />

        <Route 
          path="/dashboard" 
          element={
            <div className="bg-gradient-to-br from-gray-900 via-black to-blue-950">
              <Navbar />
              <Dashboard />
              <Footer />
            </div>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;