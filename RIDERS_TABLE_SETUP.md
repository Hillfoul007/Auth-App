# Riders Table Setup Guide

## 🚨 Quick Fix for "Failed to fetch" Error

The error occurs because the new riders table hasn't been created in your Supabase database yet. Here are 3 ways to fix this:

## Method 1: Manual Setup (Recommended)

### Step 1: Open Supabase Dashboard

1. Go to [supabase.com](https://supabase.com) and log in
2. Select your project
3. Go to **SQL Editor** (in the left sidebar)

### Step 2: Run the Migration

1. Click **"New Query"**
2. Copy the entire contents of `supabase/migrations/005_create_dedicated_riders_table.sql`
3. Paste it into the SQL editor
4. Click **"Run"** button

### Step 3: Verify Tables Created

Check that these tables now exist in your **Table Editor**:

- ✅ `riders`
- ✅ `delivery_requests`
- ✅ `rider_earnings`

## Method 2: Using Supabase CLI (If you have it installed)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-id

# Apply migrations
supabase db push
```

## Method 3: Run Migration Script

```bash
# Add your Supabase credentials to .env file first
node scripts/apply-riders-migration.js
```

## 🔧 If You Don't Have Supabase Setup

If you're in demo mode and don't have Supabase configured, the app will work with localStorage. But for the riders table, you need to:

1. **Set up Supabase** (free tier available)
2. **Add environment variables**:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 📊 Database Schema Created

After running the migration, you'll have:

### `riders` Table

- Personal info (name, email, phone)
- Vehicle details (type, model, license)
- Location tracking (GPS coordinates, service radius)
- Performance metrics (rating, deliveries completed)
- Earnings tracking
- Document storage
- Working hours configuration

### `delivery_requests` Table

- Pickup and delivery addresses
- Package details
- Status tracking
- Payment information
- Route optimization
- Customer and rider ratings

### `rider_earnings` Table

- Detailed earnings breakdown
- Payment tracking
- Performance analytics

## 🎯 Test the Setup

After applying the migration:

1. **Check Tables**: Go to Supabase Dashboard → Table Editor
2. **Test Registration**: Try registering a new rider
3. **Verify Data**: Check if the rider data appears in the `riders` table

## 🚨 Troubleshooting

### Error: "Failed to fetch"

- ✅ Apply the migration using Method 1 above
- ✅ Check your Supabase credentials in environment variables
- ✅ Verify tables exist in Supabase dashboard

### Error: "relation riders does not exist"

- ✅ The migration hasn't been applied yet
- ✅ Use Method 1 to manually run the SQL

### Error: "permission denied"

- ✅ Check Row Level Security policies are enabled
- ✅ Make sure you're authenticated when testing

## 📝 Sample SQL to Verify Setup

Run this in Supabase SQL Editor to test:

```sql
-- Check if riders table exists and has correct structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'riders';

-- Check if you can insert a test rider
INSERT INTO riders (
    user_id, full_name, email, phone,
    vehicle_type, license_number, base_location
) VALUES (
    gen_random_uuid(),
    'Test Rider',
    'test@example.com',
    '+1234567890',
    'motorcycle',
    'TEST123',
    'Test Location'
);

-- Check the data was inserted
SELECT * FROM riders WHERE full_name = 'Test Rider';

-- Clean up test data
DELETE FROM riders WHERE full_name = 'Test Rider';
```

## ✅ Success Checklist

- [ ] Supabase project is set up
- [ ] Environment variables are configured
- [ ] Migration SQL has been executed
- [ ] `riders` table exists in Supabase dashboard
- [ ] `delivery_requests` table exists
- [ ] `rider_earnings` table exists
- [ ] Test rider registration works
- [ ] No "Failed to fetch" errors

Once these steps are complete, your rider registration system will work perfectly!
