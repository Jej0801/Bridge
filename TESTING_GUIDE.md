# Bridge App - Complete Testing Guide

**Your dev server is running at: http://localhost:8081**

## 🎯 Testing Overview

This guide will walk you through testing all features of your Bridge app. Follow the checklist to ensure everything works correctly.

---

## 📋 Pre-Testing Checklist

### ✅ Before You Start

- [ ] Dev server is running (http://localhost:8081)
- [ ] Supabase migrations applied (all 3 SQL files)
- [ ] API keys added to `.env` (optional for basic testing):
  - `OPENAI_API_KEY` - for AI spot extraction
  - `GOOGLE_MAPS_API_KEY` - for geocoding
  - `TAVILY_API_KEY` - for web enrichment (optional)

**Note**: The app works in "mock mode" without Supabase/API keys for basic testing.

---

## 🧪 Test Plan

### Phase 1: Authentication & Onboarding (5 min)

#### Test 1.1: Sign Up Flow

**Steps**:
1. Open http://localhost:8081 in your browser
2. You should see the Bridge welcome/auth screen
3. Enter your email address
4. If using Supabase:
   - Check your email for OTP code
   - Enter the 6-digit code
5. If using mock mode:
   - You'll be signed in automatically

**Expected Result**: ✅ You're signed in and see profile setup

#### Test 1.2: Profile Creation

**Steps**:
1. Enter your display name (e.g., "Alex")
2. Tap "Continue" or "Save"

**Expected Result**: ✅ Profile created, redirected to couple setup

#### Test 1.3: Couple Space Creation

**Steps**:
1. Choose "Create new couple space"
2. Enter couple name (e.g., "Us", "Alex & Jordan")
3. Tap "Create"
4. Note the invite code shown

**Expected Result**: ✅ Couple space created, you see the main app (Ideas tab)

---

### Phase 2: Profile & Settings (3 min)

#### Test 2.1: Edit Profile

**Steps**:
1. Go to Settings tab (bottom navigation)
2. Tap "Your profile" → "Edit"
3. Change your display name
4. Tap "Save Changes"

**Expected Result**: ✅ Name updated throughout the app

#### Test 2.2: Edit Couple Space

**Steps**:
1. In Settings, tap "Couple space"
2. Change the couple name
3. (Optional) Upload a couple photo if on mobile
4. Tap "Save Changes"

**Expected Result**: ✅ Couple name updated on home screen

#### Test 2.3: View Invite Code

**Steps**:
1. In Settings, tap "Invite partner"
2. Note the invite code (format: BRIDGE-XXXX)

**Expected Result**: ✅ Invite code displayed, can be copied

---

### Phase 3: Basic Idea Management (5 min)

#### Test 3.1: Create Manual Idea

**Steps**:
1. Go to Ideas tab
2. Tap "+" or "Add Idea" button
3. Fill in:
   - Title: "Sunset Beach Picnic"
   - Category: Outdoors
   - Cost: $$
   - Location: "Santa Monica Beach"
4. Tap "Save"

**Expected Result**: ✅ Idea appears in your ideas list

#### Test 3.2: Update Idea Status

**Steps**:
1. Find your idea in the list
2. Tap to open details
3. Change status: New → Shortlisted
4. Save

**Expected Result**: ✅ Status updated, idea moves to shortlisted section

#### Test 3.3: Create Multiple Ideas

**Create 3 more ideas** for testing:
1. "Italian Dinner" (Food, $$$, "Osteria Mozza")
2. "Hiking Trail" (Outdoors, Free, "Runyon Canyon")
3. "Comedy Show" (Event, $$, "The Comedy Store")

**Expected Result**: ✅ All 4 ideas visible in Ideas tab

---

### Phase 4: AI Spot Extraction (10 min)

**⚠️ Requires OPENAI_API_KEY in .env**

#### Test 4.1: Extract from URL with Caption

**Steps**:
1. Go to Ideas → Add New
2. Find a TikTok or Instagram post about a restaurant/activity
3. Copy the URL
4. Copy the caption/description
5. In Bridge:
   - Paste URL
   - Select source type (TikTok/Instagram)
   - Paste caption
   - Toggle "Use AI" ON
   - Tap "Extract with AI"
6. Wait for extraction (~2-5 seconds)

**Expected Result**:
✅ Form auto-fills with:
- Title (concise name)
- Description
- Category
- Location name
- Tags
- Cost level

#### Test 4.2: Verify Extracted Data

**Check**:
- [ ] Title makes sense
- [ ] Category is appropriate
- [ ] Tags are relevant
- [ ] Cost level seems right

**Edit if needed**, then Save

**Expected Result**: ✅ AI-extracted idea saved with rich metadata

#### Test 4.3: Geocoding (if GOOGLE_MAPS_API_KEY configured)

**After saving an idea with a location**:
1. Go to Map tab
2. Look for your idea marker

**Expected Result**: ✅ Idea appears on map at correct location

---

### Phase 5: Map View & Location (5 min)

#### Test 5.1: View Ideas on Map

**Steps**:
1. Go to Map tab
2. You should see markers for ideas with locations

**Expected Result**:
✅ Map shows:
- Custom markers (colored by status)
- Legend showing status colors
- Stats showing spot count

#### Test 5.2: Interact with Markers

**Steps**:
1. Tap a marker on the map
2. Callout/popup appears
3. Tap the callout

**Expected Result**: ✅ Options to view details or plan date

#### Test 5.3: Fit All Button

**Steps**:
1. Tap "Fit All" button (top right)

**Expected Result**: ✅ Map zooms to show all markers

---

### Phase 6: Date Planning (5 min)

#### Test 6.1: Create Date Plan

**Steps**:
1. Go to Plans tab (or Home → "Plan a date")
2. Tap "+" to create new plan
3. Fill in:
   - Title: "Weekend Adventure"
   - Select date/time
   - Add 2-3 ideas from your list
   - Set vibe (e.g., Romantic)
   - Add notes
4. Save

**Expected Result**: ✅ Plan created, selected ideas marked as "Planned"

#### Test 6.2: View Plan Details

**Steps**:
1. Tap on your plan in the Plans tab
2. Review details

**Expected Result**: ✅ See all plan info, linked ideas, itinerary

---

### Phase 7: Memories (5 min)

#### Test 7.1: Log a Memory

**Steps**:
1. Go to Memories tab
2. Tap "+" to add memory
3. Fill in:
   - Title: "Amazing Sunset Date"
   - Date: Yesterday
   - Link to plan or ideas
   - Rate food, vibe, value
   - Add notes
4. (Optional) Add photos if on mobile
5. Save

**Expected Result**: ✅ Memory created, linked ideas marked as "Done"

#### Test 7.2: View Memory

**Steps**:
1. Tap on your memory
2. Review details

**Expected Result**: ✅ See ratings, photos, linked ideas

---

### Phase 8: Real-time Sync (Advanced - requires partner)

**⚠️ Requires Supabase configured and a partner**

#### Test 8.1: Invite Partner

**Steps**:
1. Share your invite code with partner
2. Partner opens Bridge in different browser/device
3. Partner selects "Join couple space"
4. Partner enters invite code

**Expected Result**: ✅ Partner joins your couple space

#### Test 8.2: Test Real-time Updates

**Steps**:
1. You: Add a new idea
2. Partner: Should see it appear automatically (no refresh needed)
3. Partner: Edit the idea
4. You: Should see the update

**Expected Result**: ✅ Changes sync in real-time

---

## 🐛 Common Issues & Solutions

### Issue: "Supabase is not configured"

**Solution**:
- App runs in mock mode (data in memory only)
- To enable cloud sync:
  1. Add Supabase URL and key to `.env`
  2. Apply database migrations
  3. Restart dev server

### Issue: "AI extraction not working"

**Solution**:
- Check `OPENAI_API_KEY` in `.env`
- Restart dev server after adding key
- Check browser console for errors

### Issue: "Map not showing markers"

**Solution**:
- Ideas need latitude/longitude to appear on map
- Use AI extraction with location names
- Or add `GOOGLE_MAPS_API_KEY` for geocoding

### Issue: "Can't see QR code for mobile"

**Solution**:
- Check terminal output for QR code
- Or manually enter URL in Expo Go app
- Or test in web browser first

### Issue: App crashes or white screen

**Solution**:
1. Check browser console for errors
2. Clear browser cache/storage
3. Restart dev server
4. Check for TypeScript errors: `npm run typecheck`

---

## ✅ Testing Checklist Summary

**Basic Features** (Works without Supabase/API keys):
- [ ] Sign in / Create profile
- [ ] Create couple space
- [ ] Add ideas manually
- [ ] Update idea status
- [ ] View ideas list
- [ ] Edit profile
- [ ] Edit couple settings

**Cloud Features** (Requires Supabase):
- [ ] Data persists after reload
- [ ] Photos upload to storage
- [ ] Real-time sync with partner
- [ ] Presence tracking

**AI Features** (Requires OPENAI_API_KEY):
- [ ] Extract spot from caption
- [ ] Auto-categorize and tag
- [ ] Vibe tags extraction

**Location Features** (Requires GOOGLE_MAPS_API_KEY):
- [ ] Geocode addresses
- [ ] View spots on map
- [ ] Find nearby spots

**Advanced Features** (Requires TAVILY_API_KEY):
- [ ] Web enrichment (phone, hours, website)

---

## 📊 What to Look For

### ✅ Good Signs

- ✅ Data persists after page reload (if Supabase configured)
- ✅ UI is responsive and smooth
- ✅ Forms validate correctly
- ✅ Images display properly
- ✅ Map markers appear in correct locations
- ✅ Real-time updates work (if with partner)

### ⚠️ Red Flags

- ❌ Console errors (open browser DevTools → Console)
- ❌ Data disappears on reload (check Supabase config)
- ❌ Buttons don't respond
- ❌ Forms submit but nothing happens
- ❌ Map doesn't load

---

## 📝 Test Results Template

**Date**: _____________________

**Environment**:
- [ ] Web browser
- [ ] iOS (Expo Go)
- [ ] Android (Expo Go)

**Supabase**:
- [ ] Configured
- [ ] Mock mode

**API Keys**:
- [ ] OpenAI
- [ ] Google Maps
- [ ] Tavily

**Tests Passed**: _____ / _____

**Issues Found**:
1. _____________________
2. _____________________
3. _____________________

**Notes**:
_____________________
_____________________

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅

1. **Test with partner** using invite code
2. **Add your real data** (actual date ideas, memories)
3. **Take screenshots** for App Store listing
4. **Prepare for production**:
   - Move API keys to Supabase Edge Functions
   - Set up custom domain
   - Configure email provider
   - Enable email confirmation

### If Tests Fail ❌

1. **Document the issue** (what happened, expected vs actual)
2. **Check console logs** for error messages
3. **Share error details** for debugging help
4. **Try in different browser/device**

---

## 🎉 Ready to Test!

**Start here**:
1. Open http://localhost:8081
2. Follow Phase 1: Authentication
3. Work through each phase in order
4. Check off items as you go

**Need help?**
- Check browser console for errors
- Review error messages carefully
- Reference SUPABASE_SETUP.md for setup
- Reference AI_FEATURES.md for AI features

**Good luck testing your Bridge app! 💕**
