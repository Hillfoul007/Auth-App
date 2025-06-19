import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, Phone, MessageSquare } from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";

interface PhoneOTPAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const PhoneOTPAuthModal: React.FC<PhoneOTPAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentView, setCurrentView] = useState<"phone" | "otp" | "name">(
    "phone",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
          },
          "expired-callback": () => {
            setError("reCAPTCHA expired. Please try again.");
          },
        },
      );
    }
  };

  const sendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError(
        "Please enter a valid phone number with country code (e.g., +1234567890)",
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier,
      );
      setConfirmationResult(confirmation);
      setCurrentView("otp");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      if (error.code === "auth/invalid-phone-number") {
        setError(
          "Invalid phone number format. Please include country code (e.g., +1234567890)",
        );
      } else if (error.code === "auth/too-many-requests") {
        setError(
          "Too many requests. Please wait a moment before trying again.",
        );
      } else {
        setError(error.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    if (!confirmationResult) {
      setError("No OTP request found. Please request OTP again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      // Check if user already has a name in MongoDB
      const existingUser = await checkUserInMongoDB(user.phoneNumber!);

      if (existingUser && existingUser.full_name) {
        // User exists with name, login directly
        await handleUserLogin(existingUser);
      } else {
        // New user or user without name, ask for name
        setCurrentView("name");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      if (error.code === "auth/invalid-verification-code") {
        setError("Invalid OTP. Please check and try again.");
      } else {
        setError(error.message || "Failed to verify OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserInMongoDB = async (phone: string) => {
    try {
      const response = await fetch("/api/auth/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.user || null;
      }
      return null;
    } catch (error) {
      console.error("Error checking user in MongoDB:", error);
      return null;
    }
  };

  const createUserInMongoDB = async (userData: any) => {
    try {
      const response = await fetch("/api/auth/register-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (response.ok) {
        return { data: data.user, error: null };
      } else {
        return { data: null, error: { message: data.error } };
      }
    } catch (error: any) {
      return { data: null, error: { message: "Network error" } };
    }
  };

  const handleUserLogin = async (user: any) => {
    // Store user data in localStorage
    localStorage.setItem("auth_token", `phone_${user.phone}_${Date.now()}`);
    localStorage.setItem("current_user", JSON.stringify(user));

    onSuccess(user);
    onClose();
    resetForm();
  };

  const handleNameSubmit = async () => {
    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const userData = {
        phone: phoneNumber,
        full_name: fullName.trim(),
        user_type: "customer",
        phone_verified: true,
      };

      const { data, error } = await createUserInMongoDB(userData);

      if (error) {
        setError(error.message);
      } else {
        await handleUserLogin(data);
      }
    } catch (error: any) {
      setError(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setOtp("");
    setFullName("");
    setError("");
    setCurrentView("phone");
    setConfirmationResult(null);

    // Clean up recaptcha
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  };

  const handleBack = () => {
    if (currentView === "otp") {
      setCurrentView("phone");
      setOtp("");
    } else if (currentView === "name") {
      setCurrentView("otp");
      setFullName("");
    }
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {currentView !== "phone" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-1 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {currentView === "phone" && "Sign In with Phone"}
              {currentView === "otp" && "Verify OTP"}
              {currentView === "name" && "Complete Profile"}
            </h2>
          </div>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Phone Input */}
        {currentView === "phone" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +1 for US, +91 for India)
              </p>
            </div>

            <Button
              onClick={sendOTP}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </div>
        )}

        {/* OTP Verification */}
        {currentView === "otp" && (
          <div className="space-y-4">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                We've sent a 6-digit code to
                <br />
                <span className="font-medium">{phoneNumber}</span>
              </p>
            </div>

            <div>
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="text-center text-lg tracking-widest"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={verifyOTP}
              disabled={isLoading || otp.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setCurrentView("phone")}
              className="w-full"
              disabled={isLoading}
            >
              Change Phone Number
            </Button>
          </div>
        )}

        {/* Name Input */}
        {currentView === "name" && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <p className="text-sm text-gray-600">
                Phone verified successfully!
                <br />
                Please tell us your name to complete registration.
              </p>
            </div>

            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={handleNameSubmit}
              disabled={isLoading || !fullName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Creating Account..." : "Complete Registration"}
            </Button>
          </div>
        )}

        {/* reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default PhoneOTPAuthModal;
