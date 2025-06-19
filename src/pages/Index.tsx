import React, { useState, useEffect } from "react";
import ServiceCategories from "../components/ServiceCategories";
import BookingFlow from "../components/BookingFlow";
import EnhancedBookingHistory from "../components/EnhancedBookingHistory";
import Reviews from "../components/Reviews";
import JoinAsPro from "./JoinAsPro.tsx";
import AccountMenu from "../components/AccountMenu"; // Can be removed if unused
import SimplePhoneAuthModal from "../components/SimplePhoneAuthModal";
import { ArrowLeft, MapPin, UserCircle } from "lucide-react";
import {
  getCurrentUser,
  isLoggedIn as checkIsLoggedIn,
  clearAuthData,
} from "../integrations/mongodb/client";

const Index = () => {
  const [currentView, setCurrentView] = useState("categories");
  const [selectedService, setSelectedService] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [isMultipleServices, setIsMultipleServices] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [currentLocation, setCurrentLocation] = useState("");
  const [locationCoordinates, setLocationCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // MongoDB Auth session
  useEffect(() => {
    // Check if user is logged in on component mount
    const checkAuthState = () => {
      console.log("Checking auth state...");
      const hasToken = checkIsLoggedIn();
      console.log("Has token:", hasToken);

      if (hasToken) {
        const user = getCurrentUser();
        console.log("Retrieved user:", user);

        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
          console.log("Set user as logged in:", user);
        } else {
          setCurrentUser(null);
          setIsLoggedIn(false);
          console.log("No user data, setting as logged out");
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        console.log("No token, setting as logged out");
      }
    };

    checkAuthState();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      checkAuthState();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Location + cart listener
  useEffect(() => {
    getUserLocation();

    const handleCartBooking = () => {
      const cart = JSON.parse(localStorage.getItem("service_cart") || "[]");
      if (cart.length > 0) {
        handleMultipleServicesSelect(cart);
      }
    };

    window.addEventListener("bookCartServices", handleCartBooking);
    return () =>
      window.removeEventListener("bookCartServices", handleCartBooking);
  }, []);

  // Google Maps reverse geocoding
  const getUserLocation = () => {
    // Set a default location immediately
    setCurrentLocation("Detecting location...");

    if (!navigator.geolocation) {
      setCurrentLocation("New York, NY"); // Fallback to a major city
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoordinates({ lat: latitude, lng: longitude });

        try {
          // Try backend API first (more reliable)
          try {
            const backendResponse = await fetch("/api/location/geocode", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lat: latitude, lng: longitude }),
            });

            if (backendResponse.ok) {
              const data = await backendResponse.json();
              const cleanAddress = data.address
                .replace(/,\s*\d{5,}.*$/g, "") // Remove ZIP and country
                .replace(/,\s*United States$/g, "")
                .replace(/,\s*USA$/g, "");
              setCurrentLocation(cleanAddress || "New York, NY");
              return;
            }
          } catch (backendError) {
            console.log(
              "Backend geocoding failed, trying Google API:",
              backendError,
            );
          }

          // Fallback to direct Google API
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`,
            );
            const data = await response.json();

            if (data.results && data.results.length > 0) {
              // Find the best address (prefer locality or sublocality)
              let bestAddress = data.results[0].formatted_address;

              for (const result of data.results) {
                if (
                  result.types.includes("locality") ||
                  result.types.includes("sublocality") ||
                  result.types.includes("neighborhood")
                ) {
                  bestAddress = result.formatted_address;
                  break;
                }
              }

              const cleanAddress = bestAddress
                .replace(/,\s*\d{5,}.*$/g, "") // Remove ZIP and country
                .replace(/,\s*United States$/g, "")
                .replace(/,\s*USA$/g, "");
              setCurrentLocation(cleanAddress || "New York, NY");
            } else {
              setCurrentLocation("New York, NY");
            }
          } else {
            setCurrentLocation("New York, NY");
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          setCurrentLocation("New York, NY");
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setCurrentLocation("New York, NY"); // Default to major city instead of error message
      },
      {
        timeout: 10000, // 10 second timeout
        enableHighAccuracy: true,
        maximumAge: 300000, // Cache for 5 minutes
      },
    );
  };

  const navigateBack = () => {
    if (["booking", "reviews", "history", "joinAsPro"].includes(currentView)) {
      setCurrentView("categories");
    }
  };

  const handleServiceSelect = (service) => {
    if (Array.isArray(service)) {
      setSelectedServices(service);
      setIsMultipleServices(true);
      setCurrentView("booking");
    } else {
      setSelectedService(service.name);
      setSelectedProvider(service);
      setIsMultipleServices(false);
      setCurrentView("booking");
    }
  };

  const handleMultipleServicesSelect = (services) => {
    setSelectedServices(services);
    setIsMultipleServices(true);
    setCurrentView("booking");
  };

  const handleBookingComplete = () => {
    setCurrentView("categories");
    setSelectedService("");
    setSelectedServices([]);
    setSelectedProvider(null);
    setIsMultipleServices(false);
  };

  const handleLoginSuccess = (user: any) => {
    console.log("🎉 Login success! Received user:", user);
    console.log("🔑 Setting user in state...");

    setCurrentUser(user);
    setIsLoggedIn(true);
    setShowAuthModal(false);

    console.log("✅ State updated - isLoggedIn: true, user:", user);

    // Force re-render by triggering auth state check
    setTimeout(() => {
      console.log("🔄 Double-checking auth state after login...");
      const hasToken = checkIsLoggedIn();
      const storedUser = getCurrentUser();
      console.log("Token check:", hasToken, "Stored user:", storedUser);

      if (hasToken && storedUser) {
        setCurrentUser(storedUser);
        setIsLoggedIn(true);
        console.log("🎯 Final state confirmed - user logged in");
      }
    }, 100);
  };

  const handleLogout = () => {
    clearAuthData();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentView("categories");
    setShowDropdown(false);
  };

  // Auto-close dropdown on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest(".profile-menu")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 shadow-xl sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            <div className="flex items-center gap-4">
              {currentView !== "categories" && (
                <button
                  onClick={navigateBack}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    HomeServices Pro
                  </h1>
                  <p className="text-blue-200 text-xs hidden sm:block">
                    Professional Services Platform
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
                <MapPin className="h-4 w-4 text-blue-300" />
                <span className="hidden sm:inline text-white font-medium text-sm">
                  {currentLocation || "Detecting location..."}
                </span>
              </div>

              {/* Auth Buttons */}
              <AccountMenu
                isLoggedIn={isLoggedIn}
                userEmail={currentUser?.email || ""}
                currentUser={currentUser}
                onLogin={() => setShowAuthModal(true)}
                onLogout={handleLogout}
                onViewBookings={() => setCurrentView("history")}
                className="text-black bg-white hover:bg-gray-50"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {currentView === "categories" && (
          <ServiceCategories
            onServiceSelect={handleServiceSelect}
            onMultipleServicesSelect={handleMultipleServicesSelect}
          />
        )}
        {currentView === "booking" && (
          <BookingFlow
            provider={selectedProvider}
            services={selectedServices}
            isMultipleServices={isMultipleServices}
            currentUser={currentUser}
            userLocation={currentLocation}
            locationCoordinates={locationCoordinates}
            onBookingComplete={handleBookingComplete}
          />
        )}
        {currentView === "history" && (
          <EnhancedBookingHistory currentUser={currentUser} />
        )}
        {currentView === "reviews" && <Reviews provider={selectedProvider} />}
        {currentView === "joinAsPro" && (
          <JoinAsPro
            onBack={function (): void {
              throw new Error("Function not implemented.");
            }}
          />
        )}
      </main>

      {/* Auth Modal */}
      <SimplePhoneAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Index;
