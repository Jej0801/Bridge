# AI-Powered Date Spot Extraction

Bridge now includes AI-powered features to automatically extract and enrich date spot information from social media posts and web searches.

## Features Overview

### 1. **AI Caption Extraction**
Automatically extracts structured date spot information from TikTok/Instagram captions using OpenAI GPT-4o-mini.

**What it extracts:**
- Title and description
- Category (food, drinks, activity, etc.)
- Location name and address
- Cost level (free, $, $$, $$$)
- Estimated duration
- Best time of day
- Vibe tags (romantic, adventurous, etc.)
- Tags for search/filtering

### 2. **Web Enrichment**
Uses Tavily AI search to find additional details about locations.

**What it adds:**
- Phone numbers
- Website URLs
- Hours of operation
- Full addresses
- Reviews and ratings (future)

### 3. **Geocoding**
Converts addresses to GPS coordinates using Google Maps Geocoding API.

**Benefits:**
- Enables map view
- Powers "nearby spots" feature
- Distance calculations

### 4. **Social Media Integration**
Share date spots directly from TikTok/Instagram to Bridge.

**How it works:**
- Share a post to Bridge
- AI attempts to fetch caption via oEmbed APIs
- Falls back to manual input if needed
- Extracts all details automatically
- Saves to your couple's idea list

## Setup Requirements

### Required API Keys

Add these to your `.env` file:

```bash
# Required for AI extraction
OPENAI_API_KEY=your-openai-api-key-here

# Required for geocoding (address → GPS)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Optional: for web enrichment
TAVILY_API_KEY=your-tavily-api-key-here
```

### Getting API Keys

#### OpenAI (Required)
1. Visit https://platform.openai.com/api-keys
2. Create account or sign in
3. Create new API key
4. Cost: ~$0.01 per spot extraction with gpt-4o-mini

#### Google Maps (Required for geocoding)
1. Visit https://console.cloud.google.com/apis/credentials
2. Create project or select existing
3. Enable "Geocoding API"
4. Create credentials → API key
5. Free tier: 40,000 requests/month

#### Tavily (Optional)
1. Visit https://tavily.com
2. Sign up for free account
3. Get API key from dashboard
4. Free tier: 1,000 searches/month

## How to Use

### Method 1: Share Intent (Mobile)

1. Open TikTok or Instagram
2. Find a date spot post
3. Tap Share → Bridge
4. AI automatically:
   - Attempts to fetch caption
   - Extracts spot details
   - Geocodes address
   - Enriches with web data (if Tavily configured)
5. Spot saved to your ideas!

### Method 2: Manual Entry (Web/Mobile)

1. Go to Ideas → Add New
2. Paste TikTok/Instagram URL
3. (Optional) Paste caption for better extraction
4. Toggle "Use AI" ON
5. Tap "Extract with AI"
6. Review extracted details
7. Edit if needed
8. Save

## AI Extraction Flow

```
URL + Caption (optional)
    ↓
[1] Fetch Caption
    - Try oEmbed APIs (TikTok/Instagram)
    - Use manual input if available
    - Fallback to placeholder
    ↓
[2] AI Extraction (OpenAI)
    - Parse caption with GPT-4o-mini
    - Extract structured data
    - Categorize and tag
    ↓
[3] Web Enrichment (Tavily - Optional)
    - Search for location details
    - Extract contact info
    - Find hours/website
    ↓
[4] Geocoding (Google Maps)
    - Convert address to coordinates
    - Enable map features
    ↓
Save to Database
```

## What Gets Extracted

### Basic Fields
- **Title**: Catchy name for the spot (max 60 chars)
- **Description**: 2-3 sentence summary
- **Category**: food, drinks, activity, event, outdoors, travel, cozy, fancy, cheap, other
- **Tags**: Searchable keywords (e.g., "italian food", "outdoor seating")

### Location Fields
- **Location Name**: Venue name (e.g., "Central Park")
- **Address**: Full street address
- **Latitude/Longitude**: GPS coordinates (from geocoding)

### Metadata
- **Cost Level**: free, $, $$, $$$
- **Estimated Duration**: Minutes (e.g., 120 for 2 hours)
- **Best Time**: Array of: morning, afternoon, evening, night
- **Vibe Tags**: romantic, adventurous, relaxing, energetic, cultural, social, intimate, fun, unique, trendy

### Contact Info (from enrichment)
- **Phone Number**: Contact number
- **Website URL**: Official website
- **Hours of Operation**: Open hours

## Feature Flags

Control AI features in code:

```typescript
// Enable/disable web enrichment
const result = await extractDateSpotFromURL(url, platform, caption, {
  enableEnrichment: true  // Set to false to skip Tavily search
});
```

## Error Handling

The system gracefully handles:

- **No OpenAI key**: Falls back to basic extraction (uses caption as-is)
- **No caption**: Uses placeholder text and basic metadata
- **No Tavily key**: Skips enrichment, continues with AI extraction only
- **No Google Maps key**: Skips geocoding, spot saved without coordinates
- **API failures**: Logs warnings, continues with partial data

## Cost Estimates

Based on typical usage:

### OpenAI (Required)
- Model: gpt-4o-mini
- Cost per extraction: ~$0.01
- 100 spots/month: ~$1.00

### Google Maps (Required)
- Service: Geocoding API
- Cost: FREE up to 40,000 requests/month
- Typical usage: <100/month

### Tavily (Optional)
- Service: AI Search
- Cost: FREE up to 1,000 searches/month
- Typical usage: <50/month

**Total monthly cost for typical couple: ~$1-2**

## Privacy & Security

⚠️ **Important Security Notes:**

1. **API keys in client code**: The current implementation includes API keys in the React Native app bundle. This is convenient for development but **NOT secure for production**.

2. **Recommended for production**: Move AI features to Supabase Edge Functions
   - API keys stay server-side
   - Client calls your Edge Function
   - Edge Function calls OpenAI/Tavily/Google Maps
   - More secure, same functionality

3. **Data privacy**:
   - Captions sent to OpenAI for processing
   - Search queries sent to Tavily
   - Addresses sent to Google Maps
   - All extracted data stored in your Supabase database
   - You own all data

## Future Enhancements

Potential improvements:

- [ ] Image analysis (extract spot from photo)
- [ ] Automatic thumbnail generation
- [ ] Popular times data (Google Places API)
- [ ] Review summaries
- [ ] Price predictions
- [ ] Similar spots recommendations
- [ ] Calendar integration
- [ ] Weather-aware suggestions

## Troubleshooting

### "AI extraction not working"
- Check `.env` has `OPENAI_API_KEY`
- Restart dev server: `npm start`
- Check console for errors
- Verify API key is valid

### "Geocoding not working"
- Check `.env` has `GOOGLE_MAPS_API_KEY`
- Verify Geocoding API is enabled in Google Cloud Console
- Check API key restrictions/quotas

### "Enrichment not finding data"
- Tavily API key required
- Some locations may not have rich web data
- Works best with well-known venues

### "Caption not auto-fetching"
- TikTok/Instagram APIs don't reliably provide captions
- oEmbed only returns titles
- Manual caption input recommended
- Future: implement scraping via Edge Functions

## API Documentation

### `extractDateSpotFromURL()`

```typescript
async function extractDateSpotFromURL(
  url: string,
  sourceType: SourceType,
  manualCaption?: string,
  options?: {
    enableEnrichment?: boolean;
  }
): Promise<{
  extracted: ExtractedSpotData;
  coordinates: { latitude: number; longitude: number } | null;
  sourceCaption: string | null;
}>
```

**Parameters:**
- `url`: TikTok/Instagram URL
- `sourceType`: 'tiktok' | 'instagram' | 'manual'
- `manualCaption`: Optional caption text
- `options.enableEnrichment`: Enable Tavily search (default: false)

**Returns:**
- `extracted`: All extracted spot data
- `coordinates`: GPS coordinates (if geocoded)
- `sourceCaption`: The caption used for extraction

### Example Usage

```typescript
import { extractDateSpotFromURL } from '@/lib/aiExtraction';

// Basic extraction
const result = await extractDateSpotFromURL(
  'https://www.tiktok.com/@user/video/123',
  'tiktok',
  'Check out this amazing Italian restaurant in downtown!'
);

// With enrichment
const enrichedResult = await extractDateSpotFromURL(
  'https://www.instagram.com/p/ABC123/',
  'instagram',
  'Best brunch spot ever! 🥞',
  { enableEnrichment: true }
);

console.log(enrichedResult.extracted.title);
console.log(enrichedResult.extracted.phone_number); // From enrichment
console.log(enrichedResult.coordinates); // { latitude: 40.7128, longitude: -74.0060 }
```

## Support

For issues or questions:
- Check console logs for error messages
- Verify all API keys are correct
- Ensure APIs are enabled in respective dashboards
- Check API quotas/limits

---

**Happy date planning! 💕**
