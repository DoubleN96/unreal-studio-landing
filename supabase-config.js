// Supabase Configuration for Unreal Studio
// Self-hosted on Coolify

const SUPABASE_CONFIG = {
    // API URL (Kong Gateway) - HTTPS Forced to avoid Mixed Content
    url: 'https://supabasekong-wckks4gsg8owkososoo8sosg.128.140.44.162.sslip.io',

    // Anon key (public, safe to expose)
    anonKey: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2ODkwNjQ0MCwiZXhwIjo0OTI0NTgwMDQwLCJyb2xlIjoiYW5vbiJ9.aePQztzDdhmgXjPlJ9zxh4_Qf5ex7Au7UyEiF_jzXK0',

    // REST API endpoint
    get restUrl() {
        return `${this.url}/rest/v1`;
    },

    // Auth endpoint
    get authUrl() {
        return `${this.url}/auth/v1`;
    },

    // Storage endpoint
    get storageUrl() {
        return `${this.url}/storage/v1`;
    }
};

// Supabase Client Helper
class SupabaseClient {
    constructor(config) {
        this.url = config.url;
        this.anonKey = config.anonKey;
        this.restUrl = config.restUrl;
        this.authUrl = config.authUrl;
        this.storageUrl = config.storageUrl;
        this.accessToken = null;
    }

    // Default headers for API requests
    get headers() {
        const h = {
            'apikey': this.anonKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
        if (this.accessToken) {
            h['Authorization'] = `Bearer ${this.accessToken}`;
        } else {
            h['Authorization'] = `Bearer ${this.anonKey}`;
        }
        return h;
    }

    // Set access token after login
    setAccessToken(token) {
        this.accessToken = token;
        localStorage.setItem('supabase_access_token', token);
    }

    // Get stored access token
    getStoredToken() {
        return localStorage.getItem('supabase_access_token');
    }

    // Clear access token
    clearAccessToken() {
        this.accessToken = null;
        localStorage.removeItem('supabase_access_token');
    }

    // Initialize client with stored token
    init() {
        const token = this.getStoredToken();
        if (token) {
            this.accessToken = token;
        }
        return this;
    }

    // ========== AUTH ==========

    async signIn(email, password) {
        const response = await fetch(`${this.authUrl}/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': this.anonKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.access_token) {
            this.setAccessToken(data.access_token);
            return { user: data.user, session: data };
        }

        throw new Error(data.error_description || data.message || 'Login failed');
    }

    async signOut() {
        this.clearAccessToken();
        return { success: true };
    }

    async getUser() {
        if (!this.accessToken) return null;

        const response = await fetch(`${this.authUrl}/user`, {
            headers: {
                'apikey': this.anonKey,
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        if (response.ok) {
            return await response.json();
        }
        return null;
    }

    // ========== DATABASE ==========

    // Select data from a table
    async select(table, options = {}) {
        let url = `${this.restUrl}/${table}`;
        const params = new URLSearchParams();

        if (options.select) {
            params.append('select', options.select);
        }

        if (options.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
                params.append(key, value);
            });
        }

        if (options.order) {
            params.append('order', options.order);
        }

        if (options.limit) {
            params.append('limit', options.limit);
        }

        if (options.offset) {
            params.append('offset', options.offset);
        }

        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        const response = await fetch(url, {
            headers: this.headers
        });

        if (!response.ok) {
            throw new Error(`Select failed: ${response.statusText}`);
        }

        return await response.json();
    }

    // Insert data into a table
    async insert(table, data) {
        const response = await fetch(`${this.restUrl}/${table}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Insert failed');
        }

        return await response.json();
    }

    // Update data in a table
    async update(table, data, filter) {
        let url = `${this.restUrl}/${table}`;
        const params = new URLSearchParams();

        Object.entries(filter).forEach(([key, value]) => {
            params.append(key, value);
        });

        url += `?${params.toString()}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Update failed');
        }

        return await response.json();
    }

    // Delete data from a table
    async delete(table, filter) {
        let url = `${this.restUrl}/${table}`;
        const params = new URLSearchParams();

        Object.entries(filter).forEach(([key, value]) => {
            params.append(key, value);
        });

        url += `?${params.toString()}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.headers
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Delete failed');
        }

        return response.status === 204 ? { success: true } : await response.json();
    }

    // ========== STORAGE ==========

    async uploadFile(bucket, path, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.storageUrl}/object/${bucket}/${path}`, {
            method: 'POST',
            headers: {
                'apikey': this.anonKey,
                'Authorization': `Bearer ${this.accessToken || this.anonKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        return await response.json();
    }

    getPublicUrl(bucket, path) {
        return `${this.storageUrl}/object/public/${bucket}/${path}`;
    }
}

// Create and export client instance
const supabase = new SupabaseClient(SUPABASE_CONFIG).init();

// Make available globally
if (typeof window !== 'undefined') {
    window.supabase = supabase;
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}
