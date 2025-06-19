import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  MapPin,
  Clock,
  DollarSign,
  User,
  Phone,
} from "lucide-react";
import DateTimePicker from "./DateTimePicker";
import PhoneAuthModal from "./PhoneAuthModal";
import LocationDetector from "./LocationDetector.tsx";
import BookingConfirmation from "./BookingConfirmation";
import { bookingHelpers } from "@/integrations/mongodb/client";

interface BookingFlowProps {
  provider?: any;
  services?: any[];
  isMultipleServices?: boolean;
  currentUser?: any;
  userLocation?: string;
  locationCoordinates?: { lat: number; lng: number } | null;
  onBookingComplete?: () => void;
}

const BookingFlow: React.FC<BookingFlowProps> = ({
  provider,
  services = [],
  isMultipleServices = false,
  currentUser,
  userLocation,
  locationCoordinates,
  onBookingComplete,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(userLocation || "");
  const [addressCoordinates, setAddressCoordinates] = useState(
    locationCoordinates || null,
  );
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const calculateTotalPrice = () => {
    if (isMultipleServices) {
      return services.reduce(
        (total, service) =>
          total + (service.price * (service.quantity || 1) || 80),
        0,
      );
    }
    return provider?.price || 80;
  };

  const calculateFinalAmount = () => {
    const basePrice = calculateTotalPrice();
    const serviceCharge = basePrice * 0.1; // 10% service charge
    const tax = (basePrice + serviceCharge) * 0.12; // 12% GST
    const subtotal = basePrice + serviceCharge + tax;

    // 5% discount for orders above $200
    const discount = subtotal > 200 ? subtotal * 0.05 : 0;

    return Math.round((subtotal - discount) * 100) / 100;
  };

  const handleBookService = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (!selectedDate || !selectedTime) {
      setError("Please select date and time");
      return;
    }

    if (!selectedAddress.trim()) {
      setError("Please provide your address");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const bookingData = {
        customer_id: currentUser._id || currentUser.uid,
        service: isMultipleServices
          ? services.map((s) => s.name).join(", ")
          : provider?.name || "Service",
        service_type: isMultipleServices
          ? "Multiple Services"
          : "Single Service",
        services: isMultipleServices
          ? services.map((s) => `${s.name} (x${s.quantity})`)
          : [provider?.name || "Service"],
        scheduled_date: selectedDate.toISOString().split("T")[0],
        scheduled_time: selectedTime,
        provider_name: isMultipleServices
          ? "Multiple Providers"
          : provider?.provider || "Home Services",
        address: selectedAddress,
        coordinates: addressCoordinates,
        additional_details: additionalDetails,
        total_price: calculateTotalPrice(),
        final_amount: calculateFinalAmount(),
        special_instructions: additionalDetails,
        charges_breakdown: {
          base_price: calculateTotalPrice(),
          service_fee: calculateTotalPrice() * 0.1,
          tax_amount:
            (calculateTotalPrice() + calculateTotalPrice() * 0.1) * 0.12,
          discount:
            calculateFinalAmount() > 200 ? calculateTotalPrice() * 0.05 : 0,
        },
      };

      const { data, error: bookingError } =
        await bookingHelpers.createBooking(bookingData);

      if (bookingError) {
        setError(bookingError.message);
      } else {
        setShowConfirmation(true);
      }
    } catch (error: any) {
      setError(error.message || "Failed to create booking");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    if (onBookingComplete) {
      onBookingComplete();
    }
  };

  const handleLoginSuccess = (user: any) => {
    setShowAuthModal(false);
    // The user will be set in the parent component
  };

  if (showConfirmation) {
  return (
    <BookingConfirmation
      bookingData={{
        services: isMultipleServices ? services : [{ name: provider?.name, price: provider?.price }],
        selectedDate: selectedDate!,
        selectedTime,
        selectedAddress,
        additionalDetails,
        isMultipleServices,
        provider,
        currentUser,
      }}
      onConfirmBooking={handleBookService}
      onBack={() => setShowConfirmation(false)}
      isProcessing={isProcessing}
    />
  );
}


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Book Your Service
        </h2>
        <p className="text-gray-600">
          Schedule your service at your convenience
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Details Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Selected Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isMultipleServices ? (
                  services.map((service, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-600">
                          by {service.provider} • Qty: {service.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${service.price * service.quantity}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{provider?.name}</p>
                      <p className="text-sm text-gray-600">
                        by {provider?.provider}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {provider?.duration}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          ⭐ {provider?.rating}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        ${provider?.price}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Date & Time Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DateTimePicker
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateChange={setSelectedDate}
                onTimeChange={setSelectedTime}
              />
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Service Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationDetector
  onAddressSelect={(address, coordinates) => {
    setSelectedAddress(address);
    setAddressCoordinates(coordinates);
  }}
  onLocationChange={(location, coordinates) => {
    setSelectedAddress(location);
    setAddressCoordinates(coordinates || null);
  }}
  defaultValue={selectedAddress}
/>

            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any special instructions or requirements..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                className="min-h-20"
              />
            </CardContent>
          </Card>
        </div>

        {/* Price Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Price Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Base Price</span>
                  <span>${calculateTotalPrice()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Service Charge (10%)</span>
                  <span>${(calculateTotalPrice() * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax (12% GST)</span>
                  <span>
                    $
                    {(
                      (calculateTotalPrice() + calculateTotalPrice() * 0.1) *
                      0.12
                    ).toFixed(2)}
                  </span>
                </div>
                {calculateFinalAmount() > 200 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount (5%)</span>
                    <span>-${(calculateTotalPrice() * 0.05).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Amount</span>
                  <span>${calculateFinalAmount()}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button
                onClick={handleBookService}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                size="lg"
              >
                {isProcessing
                  ? "Processing..."
                  : `Confirm Booking - $${calculateFinalAmount()}`}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                No payment required now. Pay after service completion.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Authentication Modal */}
      <PhoneAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default BookingFlow;
