// Fungsi dasar panggil API Supabase
async function supabaseFetch(path, options = {}) {
    let url = path.startsWith('http') ? path : `${SUPABASE_URL}/rest/v1/${path}`;
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (options.method === 'DELETE') {
        if (response.status === 204 || response.status === 200) {
            return { success: true };
        }
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        return { success: true };
    }
    
    if (options.method === 'PATCH' || options.method === 'POST') {
        if (response.status === 204) {
            return { success: true };
        }
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        const text = await response.text();
        if (text && text.length > 0) {
            try {
                return JSON.parse(text);
            } catch (e) {
                return { success: true, raw: text };
            }
        }
        return { success: true };
    }
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }
    
    const text = await response.text();
    if (!text || text.length === 0) {
        return [];
    }
    
    try {
        return JSON.parse(text);
    } catch (e) {
        console.warn('Response bukan JSON:', text);
        return [];
    }
}