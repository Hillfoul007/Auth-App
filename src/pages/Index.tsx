import React, { useState, useEffect } from "react";
import ServiceCategories from "../components/ServiceCategories";
import BookingFlow from "../components/BookingFlow";
import BookingHistory from "../components/BookingHistory";
import Reviews from "../components/Reviews";
import JoinAsPro from "./JoinAsPro.tsx";
import AccountMenu from "../components/AccountMenu"; // Can be removed if unused
import PhoneAuthModal from "../components/PhoneAuthModal";
import { ArrowLeft, MapPin, UserCircle } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

const Index = () => {
  const [currentView, setCurrentView] = useState("categories");
  const [selectedService, setSelectedService] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [isMultipleServices, setIsMultipleServices] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [currentLocation, setCurrentLocation] = useState("");
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Firebase Auth session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
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
    return () => window.removeEventListener("bookCartServices", handleCartBooking);
  }, []);

  // Google Maps reverse geocoding
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoordinates({ lat: latitude, lng: longitude });

        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${
              import.meta.env.VITE_GOOGLE_MAPS_API_KEY
            }`
          );
          const data = await response.json();
          const address = data.results[0]?.formatted_address || "Unknown Location";
          setCurrentLocation(address);
        } catch (err) {
          console.error("Geocoding error:", err);
          setCurrentLocation("Location unavailable");
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setCurrentLocation("Location access denied");
      }
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
    setCurrentUser(user);
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("firebase_user");
    localStorage.removeItem("auth_token");
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-3">
              {currentView !== "categories" && (
                <button
                  onClick={navigateBack}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
              )}
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                Home Services
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {currentLocation || "Select location"}
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
              )}
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
          <BookingHistory currentUser={currentUser} />
        )}
        {currentView === "reviews" && <Reviews provider={selectedProvider} />}
        {currentView === "joinAsPro" && <JoinAsPro onBack={function (): void {
          throw new Error("Function not implemented.");
        } } />}
      </main>

      {/* Auth Modal */}
      <PhoneAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Index;