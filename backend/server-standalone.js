const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:3000",
      "http://localhost:5173",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    message: "Home Services Backend API (Standalone Mode)",
    version: "1.0.0",
    database: "Mock/In-Memory",
  });
});

// API test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Home Services API is working! (Standalone Mode)",
    version: "1.0.0",
    mode: "standalone",
    note: "This is running without MongoDB for basic testing",
    endpoints: [
      "GET /health - Health check",
      "GET /api/test - API test",
      "POST /api/auth/register - User registration (mock)",
      "POST /api/auth/login - User login (mock)",
      "POST /api/bookings - Create booking (mock)",
      "GET /api/bookings/customer/:id - Get customer bookings (mock)",
    ],
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint to check request data
app.all("/api/debug/*", (req, res) => {
  res.json({
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
  });
});

// Mock authentication endpoints
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Mock successful registration
  const mockUser = {
    _id: `user_${Date.now()}`,
    email,
    full_name: name,
    phone: phone || "",
    user_type: "customer",
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockToken = `mock_token_${Date.now()}`;

  res.status(201).json({
    message: "User registered successfully (mock)",
    user: mockUser,
    token: mockToken,
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Mock successful login - create user if doesn't exist
  const mockUser = {
    _id: `user_${Date.now()}`,
    email,
    full_name: email
      .split("@")[0]
      .replace(/[^a-zA-Z]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    phone: "+1234567890",
    user_type: "customer",
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockToken = `mock_token_${Date.now()}`;

  res.json({
    message: "Login successful (mock)",
    user: mockUser,
    token: mockToken,
  });
});

// Check if phone exists
app.post("/api/auth/check-phone", (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  // Mock response - in real app, this would check MongoDB
  // For demo, return existing user for some numbers
  const existingNumbers = ["+1234567890", "+9876543210"];

  if (existingNumbers.includes(phone)) {
    const mockUser = {
      _id: `user_phone_${phone.replace(/\D/g, "")}`,
      phone,
      full_name: "John Doe",
      user_type: "customer",
      phone_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    res.json({ exists: true, user: mockUser });
  } else {
    res.json({ exists: false, user: null });
  }
});

// Register with phone (after OTP verification)
app.post("/api/auth/register-phone", (req, res) => {
  const {
    phone,
    full_name,
    user_type = "customer",
    phone_verified = true,
  } = req.body;

  if (!phone || !full_name) {
    return res.status(400).json({ error: "Phone and full name are required" });
  }

  // Mock successful registration
  const mockUser = {
    _id: `user_phone_${Date.now()}`,
    phone,
    full_name,
    user_type,
    phone_verified,
    created_at: new Date(),
    updated_at: new Date(),
  };

  res.status(201).json({
    message: "User registered successfully (mock)",
    user: mockUser,
  });
});

// Mock booking endpoint for testing
app.post("/api/bookings", (req, res) => {
  const {
    customer_id,
    service,
    service_type,
    services,
    scheduled_date,
    scheduled_time,
    provider_name,
    address,
    total_price,
  } = req.body;

  // Handle missing customer_id gracefully
  const effectiveCustomerId = customer_id || `mock_customer_${Date.now()}`;

  // Basic validation
  if (
    !service ||
    !scheduled_date ||
    !scheduled_time ||
    !address ||
    !total_price
  ) {
    return res.status(400).json({
      error: "Missing required fields",
      details: "Please provide service, date, time, address, and price",
    });
  }

  // Mock successful booking creation
  const mockBooking = {
    _id: `booking_${Date.now()}`,
    customer_id: effectiveCustomerId,
    service,
    service_type: service_type || "Single Service",
    services: services || [service],
    scheduled_date,
    scheduled_time,
    provider_name: provider_name || "Home Services",
    address,
    total_price,
    final_amount: total_price,
    status: "pending",
    payment_status: "pending",
    created_at: new Date(),
    updated_at: new Date(),
  };

  res.status(201).json({
    message: "Booking created successfully (mock)",
    booking: mockBooking,
  });
});

// Mock get customer bookings
app.get("/api/bookings/customer/:customerId", (req, res) => {
  const { customerId } = req.params;

  // Mock bookings data
  const mockBookings = [
    {
      _id: `booking_${Date.now()}`,
      customer_id: customerId,
      service: "House Cleaning",
      status: "completed",
      scheduled_date: "2024-01-15",
      scheduled_time: "10:00",
      total_price: 150,
      created_at: new Date(Date.now() - 86400000), // 1 day ago
    },
    {
      _id: `booking_${Date.now() + 1}`,
      customer_id: customerId,
      service: "Plumbing Repair",
      status: "pending",
      scheduled_date: "2024-01-20",
      scheduled_time: "14:00",
      total_price: 200,
      created_at: new Date(),
    },
  ];

  res.json({
    bookings: mockBookings,
    message: "Mock data - no MongoDB connection",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Home Services Backend API (Standalone Mode)",
    version: "1.0.0",
    mode: "standalone",
    documentation: "/api/test",
    health: "/health",
    note: "Running without MongoDB for basic API testing",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error stack:", err.stack);

  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT} (Standalone Mode)`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 API test: http://localhost:${PORT}/api/test`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 CORS enabled for frontend connections`);
  console.log(`⚠️  Running in standalone mode (no MongoDB required)`);
  console.log(`📋 Mock API endpoints available at /api/*`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log("\n🔄 Graceful shutdown initiated...");
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

module.exports = app;
