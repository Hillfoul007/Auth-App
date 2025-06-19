import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Phone, ArrowLeft } from "lucide-react";
import { setupRecaptcha, sendOTP, verifyOTP } from "@/lib/firebase";
import { RecaptchaVerifier } from "firebase/auth";

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<"phone" | "otp" | "details">(
    "phone",
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] =
    useState<RecaptchaVerifier | null>(null);
  const [userDetails, setUserDetails] = useState({
    fullName: "",
    email: "",
  });

  // Initialize reCAPTCHA when modal opens
  useEffect(() => {
    if (isOpen && !recaptchaVerifier) {
      const verifier = setupRecaptcha("recaptcha-container");
      setRecaptchaVerifier(verifier);
    }

    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, [isOpen]);

  const resetForm = () => {
    setCurrentStep("phone");
    setPhoneNumber("");
    setOtp("");
    setError("");
    setConfirmationResult(null);
    setUserDetails({ fullName: "", email: "" });
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      setRecaptchaVerifier(null);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // Add country code if not present
    if (cleaned.startsWith("91")) {
      return `+${cleaned}`;
    } else if (cleaned.length === 10) {
      return `+91${cleaned}`;
    } else {
      return `+${cleaned}`;
    }
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (!recaptchaVerifier) {
      setError("Please wait for reCAPTCHA to load");
      return;
    }

    setIsLoading(true);
    setError("");

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const result = await sendOTP(formattedPhone, recaptchaVerifier);

    if (result.success) {
      setConfirmationResult(result.confirmationResult);
      setCurrentStep("otp");
    } else {
      setError(result.error || "Failed to send OTP");
    }

    setIsLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await verifyOTP(confirmationResult, otp);

    if (result.success) {
      setCurrentStep("details");
    } else {
      setError(result.error || "Invalid OTP");
    }

    setIsLoading(false);
  };

  const handleCompleteSignup = async () => {
    if (!userDetails.fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!userDetails.email.trim() || !/\S+@\S+\.\S+/.test(userDetails.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    // Create user object with Firebase user data and additional details
    const user = {
      uid: confirmationResult?.user?.uid,
      phoneNumber: phoneNumber,
      fullName: userDetails.fullName,
      email: userDetails.email,
      provider: "firebase",
      createdAt: new Date(),
    };

    // Store in localStorage for demo purposes
    localStorage.setItem("firebase_user", JSON.stringify(user));
    localStorage.setItem("auth_token", `firebase_${user.uid}`);

    setIsLoading(false);
    onSuccess(user);
    handleClose();
  };

  const handleBack = () => {
    if (currentStep === "otp") {
      setCurrentStep("phone");
      setOtp("");
      setError("");
    } else if (currentStep === "details") {
      setCurrentStep("otp");
      setError("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            {currentStep !== "phone" && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Phone className="h-5 w-5" />
              {currentStep === "phone" && "Enter Phone Number"}
              {currentStep === "otp" && "Verify OTP"}
              {currentStep === "details" && "Complete Profile"}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {currentStep === "phone" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your 10-digit phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={10}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll send you an OTP to verify your number
                </p>
              </div>

              <Button
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </div>
          )}

          {currentStep === "otp" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  className="mt-1 text-center text-lg tracking-wider"
                />
                <p className="text-xs text-gray-500 mt-1">
                  OTP sent to {formatPhoneNumber(phoneNumber)}
                </p>
              </div>

              <Button
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.length !== 6}
                className="w-full"
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>

              <Button
                variant="outline"
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full"
              >
                Resend OTP
              </Button>
            </div>
          )}

          {currentStep === "details" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={userDetails.fullName}
                  onChange={(e) =>
                    setUserDetails((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={userDetails.email}
                  onChange={(e) =>
                    setUserDetails((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleCompleteSignup}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Creating Account..." : "Complete Signup"}
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* reCAPTCHA container - hidden */}
      <div id="recaptcha-container" className="hidden"></div>
    </div>
  );
};

export default PhoneAuthModal;
