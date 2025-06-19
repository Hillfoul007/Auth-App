# Complete Setup Guide: Supabase + Google Maps Integration

This guide will help you set up the complete Supabase and Google Maps integration for the TaskApp platform with rider registration and location services.

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A Google Cloud Platform account
- Git installed

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd <project-directory>
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Optional: Backend API URL (if using custom backend)
VITE_API_URL=http://localhost:3001/api
```

### 4. Database Setup

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

#### Option B: Manual SQL Execution

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the content from `supabase/migrations/004_create_location_tables.sql`
4. Execute the SQL

### 5. Storage Setup

In your Supabase dashboard:

1. Go to Storage
2. Create a new bucket called `rider-documents`
3. Set the bucket to public or configure appropriate policies
4. Upload policies for authenticated users

### 6. Google Cloud Setup

#### Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API (optional)

#### Create API Key

1. Go to Credentials section
2. Create a new API key
3. Restrict the key to your domain(s)
4. Copy the API key to your `.env.local` file

### 7. Run the Application

```bash
# Development server
npm run dev

# The app will be available at http://localhost:8080
```

## 🔧 Detailed Configuration

### Supabase Configuration

#### Row Level Security (RLS) Policies

The migration automatically creates RLS policies, but verify they're working:

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('user_locations', 'location_search_history', 'riders', 'bookings');

-- Test policy (should only return your data)
SELECT * FROM user_locations WHERE user_id = auth.uid();
```

#### Storage Policies

Create policies for the `rider-documents` bucket:

```sql
-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'rider-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'rider-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Google Maps Configuration

#### API Key Restrictions

1. **Application restrictions**:

   - HTTP referrers: `localhost:8080/*`, `your-domain.com/*`

2. **API restrictions**:
   - Maps JavaScript API
   - Places API
   - Geocoding API

#### Testing API Key

```javascript
// Test in browser console
fetch(
  `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${YOUR_API_KEY}`,
)
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## 📱 Features Overview

### Core Features Implemented

✅ **Enhanced Location Services**

- Device location detection with permission handling
- Google Maps geocoding and reverse geocoding
- Place autocomplete with smart suggestions
- Distance calculations
- Location history and favorites

✅ **Rider Registration System**

- Multi-step registration form
- Document upload (driver's license, vehicle registration, etc.)
- Location-based service area setup
- Preferred services selection
- Emergency contact information

✅ **Rider Portal Dashboard**

- Real-time location tracking
- Online/offline status management
- Booking request management (accept/reject)
- Navigation integration
- Payment collection workflow
- Performance analytics

✅ **Supabase Integration**

- User authentication and profiles
- Location data persistence
- Search history tracking
- Document storage
- Real-time updates

✅ **Location-Based Matching**

- Find nearby riders within service radius
- Optimal rider assignment algorithm
- Distance-based pricing
- Service area management

### User Flows

#### 1. Customer Booking Flow

1. Customer selects location using LocationManager
2. Chooses service type and schedule
3. System finds nearby providers/riders
4. Booking created with location data
5. Optimal rider auto-assigned
6. Real-time tracking and updates

#### 2. Rider Registration Flow

1. Personal information (Step 1)
2. Professional details (Step 2)
3. Location and services setup (Step 3)
4. Document upload and verification (Step 4)
5. Profile review and approval
6. Dashboard access granted

#### 3. Rider Operation Flow

1. Login and location setup
2. Go online and set availability
3. Receive nearby booking notifications
4. Accept/reject booking requests
5. Navigate to customer location
6. Complete service and collect payment

## 🛠 Customization

### Adding New Service Types

1. Update the `serviceTypes` array in:

   - `src/components/RiderRegistration.tsx`
   - `src/pages/EnhancedRiderPortal.tsx`
   - `src/components/ServiceCategories.tsx`

2. Update any related filtering logic

### Modifying Location Services

1. **Custom Geocoding Provider**: Modify `src/services/locationService.ts`
2. **Distance Calculation**: Update the Haversine formula or use external APIs
3. **Location Accuracy**: Adjust GPS settings in `useLocation.tsx`

### Database Schema Changes

1. Create new migration files in `supabase/migrations/`
2. Update TypeScript types in `src/integrations/supabase/types.ts`
3. Test migrations in development before deploying

## 🚨 Troubleshooting

### Common Issues

#### 1. Google Maps API Not Loading

```bash
# Check browser console for errors
# Verify API key is correct
# Ensure APIs are enabled in Google Cloud Console
```

#### 2. Supabase Connection Issues

```bash
# Verify environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Check Supabase dashboard for service status
```

#### 3. Location Not Detecting

```bash
# Ensure HTTPS in production (required for geolocation)
# Check browser location permissions
# Verify GPS/location services are enabled
```

#### 4. Database Migration Errors

```sql
-- Check current migration status
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC;

-- Reset migrations (CAUTION: This drops all data)
-- supabase db reset
```

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem("debug-location", "true");
localStorage.setItem("debug-supabase", "true");

// Then refresh the page
```

### Testing Database Functions

```sql
-- Test find_nearby_riders function
SELECT * FROM find_nearby_riders(28.6139, 77.2090, 10.0);

-- Test distance calculation
SELECT calculate_distance_km(28.6139, 77.2090, 28.7041, 77.1025);
```

## 🌐 Production Deployment

### Environment Variables for Production

```env
# Production Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Production Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_production_api_key

# Optional production API
VITE_API_URL=https://api.your-domain.com
```

### Build and Deploy

```bash
# Build for production
npm run build

# The dist/ folder contains your built application
# Deploy to your preferred hosting service (Vercel, Netlify, etc.)
```

### Security Checklist

- [ ] API keys are properly restricted
- [ ] RLS policies are enabled and tested
- [ ] HTTPS is enforced
- [ ] Environment variables are secure
- [ ] File upload limits are configured
- [ ] Rate limiting is implemented
- [ ] Error logging is set up

### Performance Optimization

1. **Location Services**:

   - Cache geocoding results
   - Debounce location updates
   - Optimize search radius

2. **Database**:

   - Monitor query performance
   - Add indexes for common queries
   - Use connection pooling

3. **Frontend**:
   - Lazy load components
   - Optimize bundle size
   - Use service workers for caching

## 📊 Monitoring and Analytics

### Built-in Analytics

The system includes:

- Booking location analytics
- Rider performance metrics
- Service area optimization
- Popular locations tracking

### Custom Analytics

Add tracking for:

- User location search patterns
- Service demand by area
- Rider efficiency metrics
- Customer satisfaction by location

## 🔄 Updates and Maintenance

### Regular Tasks

1. **Weekly**:

   - Review error logs
   - Check API usage and costs
   - Monitor database performance

2. **Monthly**:

   - Update dependencies
   - Review and optimize queries
   - Analyze location data patterns

3. **Quarterly**:
   - Review and update location service coverage
   - Optimize service areas based on data
   - Update privacy policies and terms

### Backup Strategy

1. **Database**: Supabase handles automatic backups
2. **Files**: Set up storage bucket replication
3. **Configuration**: Version control all settings

## 📞 Support

### Getting Help

1. **Documentation**: Refer to this guide and inline code comments
2. **Issues**: Check GitHub issues for known problems
3. **Community**: Join relevant Discord/Slack communities
4. **Support**: Contact support for critical issues

### Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Update documentation
5. Submit a pull request

## 📋 Checklist

### Before Going Live

- [ ] All environment variables are configured
- [ ] Database migrations are applied
- [ ] API keys are properly restricted
- [ ] Storage policies are configured
- [ ] RLS policies are tested
- [ ] Location services are working
- [ ] Rider registration flow is tested
- [ ] Payment collection is working
- [ ] Error handling is implemented
- [ ] Monitoring is set up
- [ ] Backup strategy is in place

---

**🎉 Congratulations!** You now have a complete Supabase + Google Maps integration with rider registration and location services. The system is ready for production use with real-time location tracking, intelligent rider matching, and comprehensive business analytics.
