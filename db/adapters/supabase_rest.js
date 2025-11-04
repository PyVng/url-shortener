// Supabase REST API adapter - uses HTTPS requests instead of direct PostgreSQL connection
class SupabaseRestAdapter {
  constructor(config) {
    this.supabaseUrl = config.url;
    this.supabaseKey = config.serviceRoleKey || config.anonKey; // Use service role for full access
    this.serviceRoleKey = config.serviceRoleKey;
    this.tableName = 'urls';

    // Lazy initialization tracking
    this.initialized = false;
    this.initializationPromise = null;
    this.lastConnectionCheck = 0;
    this.connectionStatus = null; // 'connected', 'failed', or null
  }

  async connect() {
    console.log(`Connected to Supabase REST API (${this.supabaseUrl})`);
    return this;
  }

  async disconnect() {
    console.log('Disconnected from Supabase REST API');
  }

  // Lazy initialization - only initialize when first needed
  async ensureInitialized() {
    if (this.initialized) {
      return true;
    }

    if (this.initializationPromise) {
      return await this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    const result = await this.initializationPromise;

    this.initialized = result;
    this.initializationPromise = null;

    return result;
  }

  async _performInitialization() {
    try {
      console.log('🔧 Lazy initializing Supabase REST API...');

      // Check if table exists by trying to select from it
      const initUrl = `${this.supabaseUrl}/rest/v1/${this.tableName}?limit=1`;

      // Configurable timeout for Vercel serverless functions (cold starts can take time)
      const defaultInitTimeout = process.env.VERCEL ? 20000 : 10000; // 20s on Vercel, 10s locally
      const initTimeout = parseInt(process.env.SUPABASE_INIT_TIMEOUT) || defaultInitTimeout;
      console.log(`🔧 Using initialization timeout: ${initTimeout}ms (${process.env.VERCEL ? 'Vercel' : 'local'})`);

      const response = await fetch(initUrl, {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(initTimeout),
      });

      console.log('🔧 Initialization response status:', response.status);

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text().catch(() => 'Unable to read response');
        console.error('🔧 Initialization failed with status:', response.status, 'Response:', errorText);
        this.connectionStatus = 'failed';
        return false;
      }

      console.log('✅ Supabase REST API initialized successfully');
      this.connectionStatus = 'connected';
      return true;
    } catch (error) {
      console.error('❌ Supabase REST API initialization error:', error.message);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        cause: error.cause,
        stack: error.stack?.split('\n')[0]
      });

      this.connectionStatus = 'failed';
      return false;
    }
  }

  // Legacy initialize method for backward compatibility
  async initialize() {
    return await this.ensureInitialized();
  }

  async createShortUrl(shortCode, originalUrl, userId = null) {
    try {
      if (!this.supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const data = {
        short_code: shortCode,
        original_url: originalUrl,
        ...(userId && { user_id: userId }),
      };

      const response = await fetch(`${this.supabaseUrl}/rest/v1/${this.tableName}`, {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create URL: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return {
        id: result[0].id,
        shortCode: result[0].short_code,
        originalUrl: result[0].original_url,
        userId: result[0].user_id,
        createdAt: result[0].created_at,
      };
    } catch (error) {
      throw error;
    }
  }

  async getOriginalUrl(shortCode) {
    try {
      if (!this.supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/${this.tableName}?short_code=eq.${encodeURIComponent(shortCode)}&select=original_url,click_count`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get URL: ${response.status}`);
      }

      const result = await response.json();

      if (result.length === 0) {
        return null;
      }

      // Increment click count
      await this.incrementClickCount(shortCode);

      return result[0].original_url;
    } catch (error) {
      throw error;
    }
  }

  async incrementClickCount(shortCode) {
    try {
      // First get current click count
      const getResponse = await fetch(
        `${this.supabaseUrl}/rest/v1/${this.tableName}?short_code=eq.${encodeURIComponent(shortCode)}&select=click_count`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!getResponse.ok) {
        console.warn('Failed to get current click count');
        return;
      }

      const current = await getResponse.json();
      if (current.length === 0) return;

      const newCount = (current[0].click_count || 0) + 1;

      // Update click count
      const updateResponse = await fetch(
        `${this.supabaseUrl}/rest/v1/${this.tableName}?short_code=eq.${encodeURIComponent(shortCode)}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ click_count: newCount }),
        }
      );

      if (!updateResponse.ok) {
        console.warn('Failed to update click count');
      }
    } catch (error) {
      console.error('Error incrementing click count:', error);
    }
  }

  async getAllUrls(limit = 100, offset = 0) {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/${this.tableName}?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get URLs: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getUrlStats(shortCode) {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/${this.tableName}?short_code=eq.${encodeURIComponent(shortCode)}&select=short_code,original_url,click_count,created_at`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get URL stats: ${response.status}`);
      }

      const result = await response.json();
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // User links operations
  async getUserLinks(userId, options = {}) {
    const maxRetries = 3;
    const baseRetryDelay = 1000; // 1 second base delay

    // Configurable timeout for requests
    const defaultRequestTimeout = process.env.VERCEL ? 18000 : 15000; // 18s on Vercel, 15s locally
    const requestTimeout = parseInt(process.env.SUPABASE_REQUEST_TIMEOUT) || defaultRequestTimeout;
    console.log(`🔍 Using request timeout: ${requestTimeout}ms (${process.env.VERCEL ? 'Vercel' : 'local'})`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 getUserLinks attempt ${attempt}/${maxRetries} with userId:`, userId);
        const url = `${this.supabaseUrl}/rest/v1/${this.tableName}?user_id=eq.${encodeURIComponent(userId)}&select=id,short_code,original_url,title,click_count,created_at&order=created_at.desc`;
        console.log('🔍 Supabase URL:', url);

        // Always use serviceRoleKey to bypass RLS policies
        const authToken = this.serviceRoleKey;
        const headers = {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        };

        console.log('🔍 Making request with headers:', {
          apikey: '***',
          Authorization: 'Bearer *** (Service Role)',
          'Content-Type': headers['Content-Type']
        });

        const response = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(requestTimeout),
        });

        console.log('🔍 getUserLinks response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unable to read error response');
          console.log('❌ getUserLinks error response:', errorText);

          // Don't retry on client errors (4xx), except for specific cases
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            // Attempt fallback with Supabase client if available and we got an auth error
            if ((response.status === 401 || response.status === 403) && options.supabaseClient) {
              console.log('🔄 Falling back to Supabase client for getUserLinks');
              try {
                const { data, error } = await options.supabaseClient
                  .from(this.tableName)
                  .select('id, short_code, original_url, title, click_count, created_at')
                  .eq('user_id', userId)
                  .order('created_at', { ascending: false });

                if (error) {
                  console.error('❌ Supabase client fallback error:', error);
                  throw error;
                }

                const fallbackResult = (data || []).map(link => ({
                  id: link.id,
                  short_code: link.short_code,
                  original_url: link.original_url,
                  title: link.title,
                  clicks: link.click_count || 0,
                  created_at: link.created_at,
                }));

                console.log('✅ Fallback successful, returning', fallbackResult.length, 'links');
                return fallbackResult;
              } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError);
              }
            }

            throw new Error(`Failed to get user links: ${response.status} - ${errorText}`);
          }

          // Retry on server errors (5xx) or rate limiting (429)
          if (attempt < maxRetries) {
            // Exponential backoff: baseDelay * 2^(attempt-1) + jitter
            const exponentialDelay = baseRetryDelay * Math.pow(2, attempt - 1);
            const jitter = Math.random() * 1000; // Add up to 1 second of jitter
            const totalDelay = Math.min(exponentialDelay + jitter, 10000); // Cap at 10 seconds
            console.log(`⏳ Retrying in ${Math.round(totalDelay)}ms (exponential backoff)... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, totalDelay));
            continue;
          }

          throw new Error(`Failed to get user links after ${maxRetries} attempts: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('🔍 getUserLinks raw result:', result);
        console.log('🔍 getUserLinks result length:', result.length);

        const mappedResult = result.map(link => ({
          id: link.id,
          short_code: link.short_code,
          original_url: link.original_url,
          clicks: link.click_count || 0,
          created_at: link.created_at,
        }));

        console.log('✅ getUserLinks successful, returning', mappedResult.length, 'links');
        return mappedResult;

      } catch (error) {
        console.error(`❌ getUserLinks attempt ${attempt} failed:`, error.message);

        // Log detailed error information
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          code: error.code,
          cause: error.cause?.message || error.cause,
          stack: error.stack?.split('\n')[0]
        });

        // Don't retry on certain errors
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          console.log('⏹️ Not retrying due to timeout error');
          throw error;
        }

        // Retry on network errors or if we haven't exhausted retries
        if (attempt < maxRetries && (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.name === 'TypeError')) {
          // Exponential backoff for network errors too
          const exponentialDelay = baseRetryDelay * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 1000;
          const totalDelay = Math.min(exponentialDelay + jitter, 10000);
          console.log(`⏳ Retrying in ${Math.round(totalDelay)}ms due to network error (exponential backoff)... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, totalDelay));
          continue;
        }

        // If this was the last attempt or not a retryable error, throw
        throw error;
      }
    }
  }

  async getLinkById(id) {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/${this.tableName}?id=eq.${encodeURIComponent(id)}&select=id,short_code,original_url,title,click_count,created_at,user_id`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get link by ID: ${response.status}`);
      }

      const result = await response.json();
      return result.length > 0 ? {
        id: result[0].id,
        short_code: result[0].short_code,
        original_url: result[0].original_url,
        title: result[0].title,
        clicks: result[0].click_count || 0,
        created_at: result[0].created_at,
        user_id: result[0].user_id,
      } : null;
    } catch (error) {
      throw error;
    }
  }

  async updateUserLink(id, updates) {
    try {
      const data = {};
      if (updates.title !== undefined) data.title = updates.title;
      if (updates.original_url !== undefined) data.original_url = updates.original_url;
      if (updates.short_code !== undefined) data.short_code = updates.short_code;

      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/${this.tableName}?id=eq.${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update link: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.length > 0 ? {
        id: result[0].id,
        short_code: result[0].short_code,
        original_url: result[0].original_url,
        title: result[0].title,
        clicks: result[0].click_count || 0,
        created_at: result[0].created_at,
        user_id: result[0].user_id,
      } : null;
    } catch (error) {
      throw error;
    }
  }

  async deleteUserLink(id) {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/${this.tableName}?id=eq.${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete link: ${response.status}`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  async ping() {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

module.exports = SupabaseRestAdapter;
