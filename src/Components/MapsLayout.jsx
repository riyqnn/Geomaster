import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Maps from "../Pages/Maps";

const MapsLayout = () => {
  const [showSampah, setShowSampah] = useState(false); 

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onToggleSampah={setShowSampah} /> 
      <div style={{ flex: 1 }}>
        <Maps showSampah={showSampah} /> 
        <Outlet />
      </div>
    </div>
  );
};

export default MapsLayout;
