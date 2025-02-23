import { useState, createContext, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";

// Create a context
export const StateContext = createContext();

// Create a provider component
export const StateProvider = ({ children }) => {
  const [showpublicprofile, setShowPublicProfile] = useState(false);
  const [showbar, setShowbar] = useState(false);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [showuserpublicprofiledata, setShowUserPublicProfileData] = useState(
    {}
  );

  // You can add more state variables here if needed
  const stateobj = useMemo(
    () => ({
      showpublicprofile,
      setShowPublicProfile,
      showbar,
      setShowbar,
      showuserpublicprofiledata,
      setShowUserPublicProfileData,
      showOtpPopup,
      setShowOtpPopup,
    }),
    [showpublicprofile, showbar, showuserpublicprofiledata, showOtpPopup]
  );

  return (
    <StateContext.Provider value={stateobj}>{children}</StateContext.Provider>
  );
};

// Render your app wrapped with the StateProvider
createRoot(document.getElementById("root")).render(
  <StateProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StateProvider>
);
