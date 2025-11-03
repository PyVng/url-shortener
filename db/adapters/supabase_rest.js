// Supabase REST API adapter - uses HTTPS requests instead of direct PostgreSQL connection
class SupabaseRestAdapter {
  constructor(config) {
    this.supabaseUrl = config.url;
    this.supabaseKey = config.serviceRoleKey || config.anonKey; // Use service role for full access
    this.serviceRoleKey = config.serviceRoleKey;
    this.tableName = 'urls';
  }

  async connect() {
    console.log(`Connected to Supabase REST API (${this.supabaseUrl})`);
    return this;
  }

  async disconnect() {
    console.log('Disconnected from Supabase REST API');
  }

  async initialize() {
    try {
      // Check if table exists by trying to select from it
      const response = await fetch(`${this.supabaseUrl}/rest/v1/${this.tableName}?limit=1`, {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to check table existence: ${response.status}`);
      }

      console.log('Supabase REST API initialized');
    } catch (error) {
      console.error('Supabase REST API initialization error:', error);
      throw error;
    }
  }

  async createShortUrl(shortCode, originalUrl, userId = null) {
    try {
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
    try {
      console.log('🔍 getUserLinks called with userId:', userId);
      const url = `${this.supabaseUrl}/rest/v1/${this.tableName}?user_id=eq.${encodeURIComponent(userId)}&select=id,short_code,original_url,title,click_count,created_at&order=created_at.desc`;
      console.log('🔍 Supabase URL:', url);

      const authToken = options.authToken || this.supabaseKey;
      const headers = {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(url, {
        headers,
      });

      console.log('🔍 getUserLinks response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ getUserLinks error response:', errorText);
        // Attempt fallback with Supabase client if available and we got an auth error
        if ((response.status === 401 || response.status === 403) && options.supabaseClient) {
          console.log('🔄 Falling back to Supabase client for getUserLinks');
          const { data, error } = await options.supabaseClient
            .from(this.tableName)
            .select('id, short_code, original_url, title, click_count, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('❌ Supabase client fallback error:', error);
            throw error;
          }

          return (data || []).map(link => ({
            id: link.id,
            short_code: link.short_code,
            original_url: link.original_url,
            title: link.title,
            clicks: link.click_count || 0,
            created_at: link.created_at,
          }));
        }

        throw new Error(`Failed to get user links: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🔍 getUserLinks raw result:', result);
      console.log('🔍 getUserLinks result length:', result.length);

      const mappedResult = result.map(link => ({
        id: link.id,
        short_code: link.short_code,
        original_url: link.original_url,
        title: link.title,
        clicks: link.click_count || 0,
        created_at: link.created_at,
      }));

      console.log('🔍 getUserLinks mapped result:', mappedResult);
      return mappedResult;
    } catch (error) {
      console.error('❌ getUserLinks exception:', error);
      throw error;
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
