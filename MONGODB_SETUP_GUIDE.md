# MongoDB Setup and Migration Guide

## 🎯 Overview

Your Home Services app has been successfully migrated from localStorage to MongoDB! All user data, bookings, and rider information will now be stored in a real MongoDB database.

## 🔧 Setup Instructions

### 1. Set Your MongoDB Password

Edit the `.env` file in the root directory and add your MongoDB password:

```env
MONGODB_PASSWORD=your_actual_mongodb_password_here
```

### 2. Install Dependencies (if not already done)

```bash
npm install
```

### 3. Start the Application

#### Option A: Start Both Servers Together (Recommended)

```bash
npm run dev:mongodb
```

#### Option B: Start Servers Separately

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev
```

### 4. Verify Setup

1. **Backend Health Check**: Visit http://localhost:3001/health
2. **Frontend App**: Visit http://localhost:8080
3. **Check Console**: Look for "✅ MongoDB Connected: cluster0.ic8p792.mongodb.net"

## 📊 What Changed

### ✅ Data Storage Migration

- **Before**: All data stored in localStorage (temporary, browser-only)
- **After**: All data stored in MongoDB (persistent, real database)

### 🔐 Authentication System

- **User Registration**: Real database with email/phone uniqueness
- **Login System**: JWT tokens with secure password hashing
- **Session Management**: Persistent login across browser sessions

### 📦 Booking System

- **Real Bookings**: All bookings saved to MongoDB
- **Status Tracking**: Complete booking lifecycle management
- **Rider Assignment**: Real-time booking acceptance system

### 🚗 Rider Management

- **Rider Profiles**: Complete rider onboarding system
- **Location Tracking**: Real-time rider location updates
- **Statistics**: Accurate earnings and performance tracking

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-token` - Token verification
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Bookings

- `POST /api/bookings` - Create booking
- `GET /api/bookings/customer/:id` - Get customer bookings
- `GET /api/bookings/rider/:id` - Get rider bookings
- `PUT /api/bookings/:id/accept` - Accept booking
- `PUT /api/bookings/:id/status` - Update booking status

### Riders

- `POST /api/riders/profile` - Create/update rider profile
- `GET /api/riders/profile/:userId` - Get rider by user ID
- `PUT /api/riders/:id/status` - Update rider status
- `GET /api/riders/online` - Get online riders

## 🗄️ Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  password: String (hashed),
  full_name: String,
  phone: String (unique),
  user_type: 'customer' | 'provider' | 'rider',
  is_verified: Boolean,
  created_at: Date,
  updated_at: Date
}
```

### Bookings Collection

```javascript
{
  _id: ObjectId,
  customer_id: ObjectId (ref: User),
  rider_id: ObjectId (ref: User),
  service: String,
  service_type: String,
  services: [String],
  scheduled_date: String,
  scheduled_time: String,
  provider_name: String,
  address: String,
  coordinates: { lat: Number, lng: Number },
  total_price: Number,
  final_amount: Number,
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded',
  created_at: Date,
  updated_at: Date
}
```

### Riders Collection

```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  vehicle_type: String,
  vehicle_number: String,
  license_number: String,
  is_online: Boolean,
  current_location: String,
  coordinates: { lat: Number, lng: Number },
  rating: Number,
  completed_rides: Number,
  status: 'pending' | 'approved' | 'suspended' | 'rejected',
  created_at: Date,
  updated_at: Date
}
```

## 🔒 Security Features

### Password Security

- Bcrypt hashing with salt rounds: 12
- Minimum password length: 6 characters
- Secure password comparison

### JWT Tokens

- 24-hour expiration
- Secure token generation
- Token verification middleware

### Data Validation

- Email format validation
- Phone number validation
- Required field enforcement
- Mongoose schema validation

## 🚨 Troubleshooting

### Connection Issues

1. **MongoDB Connection Failed**

   - Check your MongoDB password in `.env`
   - Verify network connectivity
   - Ensure MongoDB Atlas allows your IP

2. **Backend Won't Start**

   ```bash
   # Check if port 3001 is available
   lsof -i :3001

   # Kill any process using the port
   kill -9 <PID>
   ```

3. **Frontend API Errors**
   - Ensure backend is running on port 3001
   - Check browser console for error details
   - Verify API_BASE_URL in `.env.local`

### Common Fixes

```bash
# Restart with clean state
npm run dev:mongodb

# Check backend health
curl http://localhost:3001/health

# View backend logs
npm run dev:backend
```

## 📈 Performance Features

### Database Optimization

- Indexed fields: email, phone, customer_id, rider_id, status
- Efficient queries with proper filtering
- Pagination support for large datasets

### Caching Strategy

- JWT tokens stored in localStorage
- User profile caching
- Optimistic UI updates

## 🔄 Migration from localStorage

### Existing Users

- All localStorage data is now obsolete
- Users need to register again (email uniqueness enforced)
- Previous demo bookings won't appear in history

### Data Persistence

- All new data persists across browser sessions
- Database-level data integrity
- Real-time synchronization across devices

## 🎯 Next Steps

1. **Set MongoDB Password**: Update `.env` with your actual password
2. **Test Registration**: Create a new account to verify database connection
3. **Test Booking Flow**: Create and manage bookings
4. **Monitor Logs**: Watch for any connection or validation errors

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Ensure MongoDB Atlas is configured correctly
4. Review server logs for specific error messages

Your app is now running on a production-ready MongoDB backend! 🎉
