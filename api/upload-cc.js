import { put, list, del } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    // GET: List all CC filters
    if (request.method === 'GET') {
      const { blobs } = await list({ 
        prefix: 'cc-filters/',
        limit: 100
      });

      // Fetch and parse each CC filter
      const filters = await Promise.all(
        blobs.map(async (blob) => {
          try {
            const response = await fetch(blob.url);
            const data = await response.json();
            return {
              name: data.name || blob.pathname,
              url: blob.url,
              uploadedAt: blob.uploadedAt,
              size: blob.size,
              values: data.values || data,
            };
          } catch {
            return null;
          }
        })
      );

      return new Response(JSON.stringify({
        success: true,
        filters: filters.filter(f => f !== null),
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // POST: Upload new CC filter
    if (request.method === 'POST') {
      const ccData = await request.json();
      const safeName = (ccData.name || 'custom').replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `cc-filters/${safeName}_${Date.now()}.json`;

      const blob = await put(filename, JSON.stringify(ccData), {
        access: 'public',
        contentType: 'application/json',
      });

      return new Response(JSON.stringify({
        success: true,
        url: blob.url,
        name: ccData.name,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // DELETE: Remove CC filter
    if (request.method === 'DELETE') {
      const { searchParams } = new URL(request.url);
      const url = searchParams.get('url');
      
      if (!url) {
        throw new Error('URL parameter required');
      }

      await del(url);

      return new Response(JSON.stringify({
        success: true,
        message: 'CC filter deleted',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Method not allowed
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed',
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
