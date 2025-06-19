# Supabase + Google Maps Integration Guide

This guide provides a comprehensive implementation of location services using Supabase for data persistence and Google Maps API for location functionality.

## 🚀 Features

- **Location Detection**: HTML5 Geolocation with fallback to IP-based detection
- **Geocoding & Reverse Geocoding**: Convert addresses to coordinates and vice versa
- **Place Autocomplete**: Smart location search with suggestions
- **Location Persistence**: Save and manage user locations in Supabase
- **Provider Matching**: Find nearby service providers based on location
- **Rider Assignment**: Automatically assign optimal riders to bookings
- **Location Analytics**: Track location-based business metrics
- **Real-time Updates**: Live location tracking for riders
- **Favorites Management**: Save and organize favorite locations

## 📁 Project Structure

```
src/
├── services/
│   ├── locationService.ts           # Core location service
│   └── providerLocationService.ts   # Provider/rider location matching
├── hooks/
│   └── useLocation.tsx              # Location management hook
├── components/
│   ├── LocationManager.tsx          # Enhanced location component
│   └── LocationIntegrationDemo.tsx  # Complete demo component
└── integrations/supabase/
    └── types.ts                     # Updated with location types

supabase/migrations/
└── 004_create_location_tables.sql   # Database schema
```

## 🛠 Setup Instructions

### 1. Database Setup

Run the migration to create location tables:

```sql
-- Apply the migration
supabase migration up
```

This creates:

- `user_locations` - Store user's saved locations
- `location_search_history` - Track search patterns
- Enhanced `bookings` table with location data
- Enhanced `riders` table with real-time location
- Spatial functions for distance calculations

### 2. Environment Variables

Ensure these environment variables are set:

```env
# Google Maps API Key (with Places, Geocoding APIs enabled)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Google Maps API Setup

Enable the following APIs in Google Cloud Console:

- Maps JavaScript API
- Places API
- Geocoding API
- Distance Matrix API (optional)

## 🎯 Usage Examples

### Basic Location Detection

```tsx
import { useLocation } from "@/hooks/useLocation";

function MyComponent() {
  const {
    currentLocation,
    currentAddress,
    isDetecting,
    getCurrentLocation,
    saveLocation,
  } = useLocation({
    autoGeocoding: true,
    saveToSupabase: true,
  });

  const handleGetLocation = async () => {
    const coords = await getCurrentLocation();
    if (coords) {
      console.log("Location:", coords);

      // Save to Supabase
      await saveLocation({
        name: "My Current Location",
        is_favorite: true,
      });
    }
  };

  return (
    <div>
      <button onClick={handleGetLocation} disabled={isDetecting}>
        {isDetecting ? "Detecting..." : "Get My Location"}
      </button>
      {currentAddress && <p>Address: {currentAddress}</p>}
    </div>
  );
}
```

### Location Manager Component

```tsx
import LocationManager from "@/components/LocationManager";

function BookingPage() {
  const handleLocationChange = (address, coordinates, additionalData) => {
    console.log("Selected location:", address, coordinates);
    // Use the location data for booking
  };

  return (
    <LocationManager
      onLocationChange={handleLocationChange}
      enableSaveToSupabase={true}
      showFavorites={true}
      showHistory={true}
    />
  );
}
```

### Provider Matching

```tsx
import { providerLocationService } from "@/services/providerLocationService";

async function findNearbyProviders(location) {
  const providers = await providerLocationService.findNearbyProviders({
    center: location,
    radius_km: 10,
    service_types: ["House Cleaning", "Plumbing"],
    rating_min: 4.0,
  });

  console.log("Nearby providers:", providers);
  return providers;
}
```

### Booking with Location

```tsx
async function createBookingWithLocation(bookingData) {
  const booking = await providerLocationService.createBookingWithLocation({
    customer_id: "user-id",
    service_type: "House Cleaning",
    services: ["House Cleaning"],
    scheduled_date: "2024-01-15",
    scheduled_time: "14:00",
    address: "123 Main St, City",
    coordinates: { lat: 40.7128, lng: -74.006 },
    total_price: 80,
  });

  // Auto-assign optimal rider
  const assignment = await providerLocationService.assignOptimalRider(
    booking.id,
  );
  if (assignment.success) {
    console.log("Rider assigned:", assignment.riderId);
  }
}
```

### Rider Location Updates

```tsx
async function updateRiderLocation(riderId, coordinates) {
  await providerLocationService.updateRiderLocation(riderId, {
    coordinates,
    // address will be auto-geocoded
  });
}
```

## 📊 Database Schema

### user_locations

```sql
CREATE TABLE user_locations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  address TEXT NOT NULL,
  formatted_address TEXT,
  coordinates JSONB NOT NULL,
  place_id TEXT,
  address_components JSONB,
  is_favorite BOOLEAN DEFAULT FALSE,
  location_type TEXT CHECK (location_type IN ('home', 'work', 'other')),
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enhanced bookings table

```sql
ALTER TABLE bookings ADD COLUMN
  formatted_address TEXT,
  coordinates JSONB,
  place_id TEXT,
  distance_km DECIMAL(10,2),
  estimated_duration_minutes INTEGER;
```

### Enhanced riders table

```sql
ALTER TABLE riders ADD COLUMN
  current_coordinates JSONB,
  service_radius_km DECIMAL(10,2) DEFAULT 5.0,
  last_location_update TIMESTAMP WITH TIME ZONE;
```

## 🔧 Core Services

### LocationService

Main service for location operations:

- `getCurrentLocation()` - Get device location
- `geocodeCoordinates()` - Convert coordinates to address
- `getCoordinatesFromAddress()` - Convert address to coordinates
- `getPlaceAutocomplete()` - Search place suggestions
- `calculateDistance()` - Calculate distance between points
- `saveLocationToSupabase()` - Persist location data
- `getUserLocations()` - Fetch user's saved locations

### ProviderLocationService

Service for provider/rider matching:

- `findNearbyProviders()` - Find providers within radius
- `findNearbyRiders()` - Find available riders
- `createBookingWithLocation()` - Create booking with location data
- `assignOptimalRider()` - Auto-assign best rider
- `updateRiderLocation()` - Update rider's real-time location
- `getLocationAnalytics()` - Business location insights

## 🎨 Components

### LocationManager

Full-featured location management component:

- Location search with autocomplete
- Current location detection
- Saved locations management
- Favorites system
- Integration with Supabase

### LocationIntegrationDemo

Complete demo showcasing all features:

- Provider search
- Rider availability
- Booking creation
- Analytics dashboard

## 📱 React Hook

### useLocation

Comprehensive hook for location management:

```tsx
const {
  // State
  currentLocation,
  currentAddress,
  isDetecting,
  error,
  savedLocations,
  favoriteLocations,

  // Actions
  getCurrentLocation,
  saveLocation,
  deleteLocation,
  toggleFavorite,
  clearError,
} = useLocation(options);
```

## 🔒 Security & Privacy

### Row Level Security (RLS)

All location tables have RLS enabled:

- Users can only access their own location data
- Riders can update their own location
- Admins can view analytics

### Privacy Considerations

- Location data is encrypted in transit
- Sensitive coordinates are stored securely
- Users control their location sharing preferences
- Location history can be cleared by users

## 📈 Performance Optimization

### Database Indexing

```sql
-- Spatial indexes for fast location queries
CREATE INDEX idx_user_locations_coordinates ON user_locations USING GIN (coordinates);
CREATE INDEX idx_bookings_coordinates ON bookings USING GIN (coordinates);
CREATE INDEX idx_riders_coordinates ON riders USING GIN (current_coordinates);

-- Performance indexes
CREATE INDEX idx_riders_online_location ON riders(is_online, current_coordinates)
WHERE is_online = TRUE;
```

### Caching Strategy

- Client-side caching of recent location searches
- Service worker for offline location data
- Debounced autocomplete requests
- Optimistic updates for better UX

## 🧪 Testing

### Test Location Data

The migration includes sample data for testing:

- Demo user locations
- Sample provider coordinates
- Test booking scenarios

### Mock Services

For development without API keys:

- Fallback to OpenStreetMap geocoding
- Mock provider data
- Local storage persistence

## 🚀 Production Deployment

### Checklist

- [ ] Google Maps API key configured
- [ ] Supabase project set up
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Environment variables set
- [ ] SSL certificates configured
- [ ] API rate limits configured

### Monitoring

- Track API usage and costs
- Monitor location accuracy
- Alert on geocoding failures
- Analytics on location patterns

## 🆘 Troubleshooting

### Common Issues

1. **Location not detected**

   - Check browser permissions
   - Ensure HTTPS in production
   - Verify API keys

2. **Geocoding failures**

   - Check API quota limits
   - Verify API key permissions
   - Handle fallback scenarios

3. **Database errors**
   - Verify RLS policies
   - Check user authentication
   - Validate data types

### Debug Tools

```tsx
// Enable debug logging
localStorage.setItem("debug-location", "true");

// Check API status
console.log("Google Maps loaded:", !!window.google);
console.log("Supabase configured:", supabase.supabaseUrl);
```

## 📚 API Reference

See the individual service files for detailed API documentation:

- [`locationService.ts`](./src/services/locationService.ts)
- [`providerLocationService.ts`](./src/services/providerLocationService.ts)
- [`useLocation.tsx`](./src/hooks/useLocation.tsx)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Update documentation
5. Submit a pull request

## 📄 License

This integration is part of the main project license.
