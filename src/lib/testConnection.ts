import { getSupabase, isSupabaseConfigured } from './supabase';

/**
 * Test Supabase connection and authentication setup
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: 'Supabase not configured. Running in mock mode.',
      details: null,
    };
  }

  try {
    const supabase = getSupabase();

    // Test 1: Check if we can connect to the database
    const { data: healthCheck, error: healthError } = await supabase
      .from('couples')
      .select('count')
      .limit(0);

    if (healthError) {
      return {
        success: false,
        message: 'Database connection failed',
        details: healthError.message,
      };
    }

    // Test 2: Check auth status
    const { data: { session } } = await supabase.auth.getSession();

    return {
      success: true,
      message: 'Supabase connected successfully!',
      details: {
        authenticated: !!session,
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Connection test failed',
      details: error.message,
    };
  }
}
