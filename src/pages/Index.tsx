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
      const hasToken = checkIsLoggedIn();

      if (hasToken) {
        const user = getCurrentUser();

        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
        } else {
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
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
    setCurrentLocation("New York, NY");

    // Skip geolocation for now to avoid fetch errors
    // In production, you would implement proper geolocation

    // Simple mock location detection for demo
    setTimeout(() => {
      setCurrentLocation("New York, NY");
      setLocationCoordinates({ lat: 40.7128, lng: -74.006 });
    }, 1000);

    return;

    // The below code is disabled to prevent fetch errors
    /*
    if (!navigator.geolocation) {
      setCurrentLocation("New York, NY");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoordinates({ lat: latitude, lng: longitude });

        try {
          // Try backend API only (no external APIs)
          const backendResponse = await fetch('/api/location/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lng: longitude })
          });

          if (backendResponse.ok) {
            const data = await backendResponse.json();
            setCurrentLocation(data.address || "New York, NY");
          } else {
            setCurrentLocation("New York, NY");
          }
        } catch (err) {
          console.log("Location detection skipped:", err);
          setCurrentLocation("New York, NY");
        }
      },
      (err) => {
        console.log("Geolocation permission denied or failed:", err);
        setCurrentLocation("New York, NY");
      },
      {
        timeout: 5000,
        maximumAge: 300000
      }
    );
    */
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
    setCurrentUser(user);
    setIsLoggedIn(true);
    setShowAuthModal(false);

    // Force re-render by triggering auth state check
    setTimeout(() => {
      const hasToken = checkIsLoggedIn();
      const storedUser = getCurrentUser();

      if (hasToken && storedUser) {
        setCurrentUser(storedUser);
        setIsLoggedIn(true);
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
            onLoginSuccess={handleLoginSuccess}
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
