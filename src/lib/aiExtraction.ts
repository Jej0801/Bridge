import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { IdeaCategory, CostLevel, SourceType } from '@/types/bridge';

// Initialize AI clients (prefer Claude, fallback to OpenAI)
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const aiClient = anthropic || openai;

export interface ExtractedSpotData {
  title: string;
  description: string | null;
  category: IdeaCategory;
  location_name: string | null;
  address: string | null;
  cost_level: CostLevel;
  estimated_duration_minutes: number | null;
  best_time_of_day: string[] | null;
  vibe_tags: string[] | null;
  tags: string[];
  phone_number: string | null;
  website_url: string | null;
  hours_of_operation: string | null;
}

/**
 * Call AI (Claude or OpenAI) to extract JSON data
 */
async function callAI(systemPrompt: string, userPrompt: string): Promise<any> {
  if (anthropic) {
    // Use Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Extract JSON from the response (Claude might wrap it in markdown)
    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    return JSON.parse(jsonText);
  } else if (openai) {
    // Use OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } else {
    throw new Error('No AI client configured');
  }
}

/**
 * Extract spot information from a social media caption using AI
 */
export async function extractSpotFromCaption(
  caption: string,
  sourceType: SourceType,
  sourceUrl: string
): Promise<ExtractedSpotData> {
  if (!aiClient) {
    // Fallback: return basic extraction
    return {
      title: caption.slice(0, 100),
      description: caption,
      category: 'other',
      location_name: null,
      address: null,
      cost_level: '$$',
      estimated_duration_minutes: null,
      best_time_of_day: null,
      vibe_tags: null,
      tags: [],
      phone_number: null,
      website_url: null,
      hours_of_operation: null,
    };
  }

  const systemPrompt = 'You are a helpful assistant that extracts date spot information from social media captions. Always return valid JSON.';

  const userPrompt = `You are a date spot extraction assistant. Extract structured information about a date spot/activity from this ${sourceType} post.

Caption: "${caption}"

Extract the following information in JSON format:
- title: A concise, appealing name for the spot/activity (max 60 chars)
- description: A brief description (2-3 sentences)
- category: One of: food, drinks, activity, event, outdoors, travel, cozy, fancy, cheap, other
- location_name: The name of the place/venue (e.g., "Central Park", "The Cheesecake Factory")
- address: Full street address if mentioned
- cost_level: One of: free, $, $$, $$$
- estimated_duration_minutes: How long this activity typically takes (number)
- best_time_of_day: Array of: morning, afternoon, evening, night
- vibe_tags: Array from: romantic, adventurous, relaxing, energetic, cultural, social, intimate, fun, unique, trendy
- tags: Array of relevant tags (e.g., ["italian food", "outdoor seating", "live music"])
- phone_number: If mentioned
- website_url: If mentioned (not the social media URL)
- hours_of_operation: If mentioned

Return only valid JSON, no markdown formatting.`;

  try {
    const extracted = await callAI(systemPrompt, userPrompt);

    return {
      title: extracted.title || caption.slice(0, 100),
      description: extracted.description || caption,
      category: extracted.category || 'other',
      location_name: extracted.location_name || null,
      address: extracted.address || null,
      cost_level: extracted.cost_level || '$$',
      estimated_duration_minutes: extracted.estimated_duration_minutes || null,
      best_time_of_day: extracted.best_time_of_day || null,
      vibe_tags: extracted.vibe_tags || null,
      tags: extracted.tags || [],
      phone_number: extracted.phone_number || null,
      website_url: extracted.website_url || null,
      hours_of_operation: extracted.hours_of_operation || null,
    };
  } catch (error) {
    console.error('AI extraction error:', error);
    // Return fallback
    return {
      title: caption.slice(0, 100),
      description: caption,
      category: 'other',
      location_name: null,
      address: null,
      cost_level: '$$',
      estimated_duration_minutes: null,
      best_time_of_day: null,
      vibe_tags: null,
      tags: [],
      phone_number: null,
      website_url: null,
      hours_of_operation: null,
    };
  }
}

/**
 * Enrich spot data with web search results using Tavily
 */
export async function enrichSpotWithWebSearch(
  spotData: ExtractedSpotData
): Promise<Partial<ExtractedSpotData>> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  if (!tavilyApiKey) {
    console.warn('Tavily API key not configured, skipping web enrichment');
    return spotData;
  }

  if (!spotData.location_name && !spotData.title) {
    console.warn('No location name or title to search for');
    return spotData;
  }

  try {
    // Construct search query
    const searchQuery = spotData.location_name
      ? `${spotData.location_name} ${spotData.address || ''} hours reviews contact`
      : `${spotData.title} restaurant bar cafe location hours`;

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: searchQuery,
        search_depth: 'basic',
        include_answer: false,
        max_results: 3,
      }),
    });

    if (!response.ok) {
      console.error('Tavily API error:', response.status);
      return spotData;
    }

    const data = await response.json();

    // Extract useful information from search results
    const enrichedData: Partial<ExtractedSpotData> = { ...spotData };

    if (data.results && data.results.length > 0) {
      const topResult = data.results[0];

      // Try to extract phone, website, hours from search results
      // This is basic extraction - you could use AI to parse the content better
      const content = topResult.content || '';

      // Look for phone numbers (US format)
      const phoneMatch = content.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch && !enrichedData.phone_number) {
        enrichedData.phone_number = phoneMatch[0];
      }

      // Website is usually in the URL
      if (topResult.url && !enrichedData.website_url) {
        enrichedData.website_url = topResult.url;
      }

      // Use AI to extract structured info if AI client is configured
      if (aiClient && content) {
        try {
          const systemPrompt = 'Extract structured information from this search result about a location. Return JSON with: address, phone_number, website_url, hours_of_operation. Return null for fields not found.';
          const userPrompt = content.slice(0, 1000);

          const extracted = await callAI(systemPrompt, userPrompt);

          if (extracted.address && !enrichedData.address) {
            enrichedData.address = extracted.address;
          }
          if (extracted.phone_number && !enrichedData.phone_number) {
            enrichedData.phone_number = extracted.phone_number;
          }
          if (extracted.website_url && !enrichedData.website_url) {
            enrichedData.website_url = extracted.website_url;
          }
          if (extracted.hours_of_operation && !enrichedData.hours_of_operation) {
            enrichedData.hours_of_operation = extracted.hours_of_operation;
          }
        } catch (aiError) {
          console.warn('AI enrichment failed:', aiError);
        }
      }
    }

    return enrichedData;
  } catch (error) {
    console.error('Web enrichment error:', error);
    return spotData;
  }
}

/**
 * Geocode an address to get latitude and longitude
 */
export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('Google Maps API key not configured, skipping geocoding');
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results[0]) {
      const location = data.results[0].geometry.location;
      return { latitude: location.lat, longitude: location.lng };
    }

    if (data.status === 'ZERO_RESULTS') {
      console.warn('No results found for address:', address);
      return null;
    }

    console.error('Geocoding API error:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Fetch metadata and content from URL using web scraping
 */
export async function fetchURLMetadata(
  url: string,
  sourceType: SourceType
): Promise<{ title?: string; description?: string; content?: string } | null> {
  // Try oEmbed APIs first
  if (sourceType === 'instagram' && url.includes('instagram.com')) {
    try {
      const response = await fetch(
        `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`
      );

      if (response.ok) {
        const data = await response.json();
        return {
          title: data.title || null,
          description: data.author_name ? `Post by ${data.author_name}` : null,
        };
      }
    } catch (error) {
      console.warn('Instagram oEmbed failed:', error);
    }
  }

  if (sourceType === 'tiktok' && (url.includes('tiktok.com') || url.includes('vm.tiktok.com'))) {
    try {
      const response = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
      );

      if (response.ok) {
        const data = await response.json();
        return {
          title: data.title || null,
          description: data.author_name ? `Video by ${data.author_name}` : null,
        };
      }
    } catch (error) {
      console.warn('TikTok oEmbed failed:', error);
    }
  }

  // Use Tavily to fetch web content if available
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  if (tavilyApiKey) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: url,
          search_depth: 'basic',
          include_answer: true,
          max_results: 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results[0]) {
          return {
            title: data.results[0].title,
            description: data.results[0].content,
            content: data.answer || data.results[0].content,
          };
        }
      }
    } catch (error) {
      console.warn('Tavily fetch failed:', error);
    }
  }

  return null;
}

/**
 * Extract spot information from URL using AI (even without caption)
 */
export async function extractSpotFromURL(
  url: string,
  sourceType: SourceType
): Promise<ExtractedSpotData> {
  if (!aiClient) {
    // Fallback without AI
    return {
      title: `Date spot from ${sourceType}`,
      description: url,
      category: 'other',
      location_name: null,
      address: null,
      cost_level: '$$',
      estimated_duration_minutes: null,
      best_time_of_day: null,
      vibe_tags: null,
      tags: [],
      phone_number: null,
      website_url: null,
      hours_of_operation: null,
    };
  }

  // Fetch metadata from URL
  const metadata = await fetchURLMetadata(url, sourceType);

  // Create a rich context for AI
  const context = `
URL: ${url}
Platform: ${sourceType}
${metadata?.title ? `Title: ${metadata.title}` : ''}
${metadata?.description ? `Description: ${metadata.description}` : ''}
${metadata?.content ? `Content: ${metadata.content}` : ''}
  `.trim();

  const systemPrompt = 'You are a helpful assistant that extracts date spot information from social media posts. Always return valid JSON with educated guesses for missing fields.';

  const userPrompt = `You are analyzing a ${sourceType} post about a date spot or activity.

${context}

Based on this information, extract structured date spot details in JSON format:
- title: A concise, appealing name for the spot/activity (max 60 chars)
- description: A brief description (2-3 sentences)
- category: One of: food, drinks, activity, event, outdoors, travel, cozy, fancy, cheap, other
- location_name: The name of the place/venue (e.g., "Central Park", "The Cheesecake Factory")
- address: Full street address if mentioned
- cost_level: One of: free, $, $$, $$$
- estimated_duration_minutes: How long this activity typically takes (number)
- best_time_of_day: Array of: morning, afternoon, evening, night
- vibe_tags: Array from: romantic, adventurous, relaxing, energetic, cultural, social, intimate, fun, unique, trendy
- tags: Array of relevant tags (e.g., ["italian food", "outdoor seating", "live music"])
- phone_number: If mentioned
- website_url: If mentioned (not the social media URL)
- hours_of_operation: If mentioned

Make educated guesses based on the context. Return only valid JSON.`;

  try {
    const extracted = await callAI(systemPrompt, userPrompt);

    return {
      title: extracted.title || metadata?.title || `Spot from ${sourceType}`,
      description: extracted.description || metadata?.description || 'Shared date spot',
      category: extracted.category || 'other',
      location_name: extracted.location_name || null,
      address: extracted.address || null,
      cost_level: extracted.cost_level || '$$',
      estimated_duration_minutes: extracted.estimated_duration_minutes || null,
      best_time_of_day: extracted.best_time_of_day || null,
      vibe_tags: extracted.vibe_tags || null,
      tags: extracted.tags || [],
      phone_number: extracted.phone_number || null,
      website_url: extracted.website_url || null,
      hours_of_operation: extracted.hours_of_operation || null,
    };
  } catch (error) {
    console.error('AI extraction error:', error);
    return {
      title: metadata?.title || `Date spot from ${sourceType}`,
      description: metadata?.description || url,
      category: 'other',
      location_name: null,
      address: null,
      cost_level: '$$',
      estimated_duration_minutes: null,
      best_time_of_day: null,
      vibe_tags: null,
      tags: [],
      phone_number: null,
      website_url: null,
      hours_of_operation: null,
    };
  }
}

/**
 * Main extraction flow: URL -> Caption -> AI Extraction -> Web Enrichment
 */
export async function extractDateSpotFromURL(
  url: string,
  sourceType: SourceType,
  manualCaption?: string,
  options: {
    enableEnrichment?: boolean;
  } = {}
): Promise<{
  extracted: ExtractedSpotData;
  coordinates: { latitude: number; longitude: number } | null;
  sourceCaption: string | null;
}> {
  // Step 1: Get caption (either manual or scraped)
  let caption = manualCaption || (await fetchCaptionFromURL(url, sourceType));

  if (!caption) {
    // If no caption, create a basic extraction from the URL
    caption = `Date spot shared from ${sourceType}`;
    console.warn('No caption available, using placeholder');
  }

  // Step 2: AI extraction
  let extracted = await extractSpotFromCaption(caption, sourceType, url);

  // Step 3: Web enrichment (optional, can be slow)
  if (options.enableEnrichment && process.env.TAVILY_API_KEY) {
    try {
      const enriched = await enrichSpotWithWebSearch(extracted);
      extracted = { ...extracted, ...enriched };
    } catch (error) {
      console.warn('Web enrichment failed, continuing without it:', error);
    }
  }

  // Step 4: Geocoding
  let coordinates = null;
  if (extracted.address) {
    coordinates = await geocodeAddress(extracted.address);
  } else if (extracted.location_name) {
    // Try geocoding with just the location name
    coordinates = await geocodeAddress(extracted.location_name);
  }

  return {
    extracted,
    coordinates,
    sourceCaption: caption,
  };
}
