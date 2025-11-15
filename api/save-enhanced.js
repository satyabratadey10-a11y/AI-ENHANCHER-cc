import { put } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { image, metadata } = body;

    if (!image) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No image provided'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract base64 data
    const base64Match = image.match(/^data:image\/\w+;base64,(.+)$/);
    if (!base64Match) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid image format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const base64Data = base64Match[1];
    
    // Convert base64 to binary using Web APIs (Edge-compatible)
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const filename = `enhanced/enhanced_${Date.now()}.jpg`;

    // Upload enhanced image
    const blob = await put(filename, bytes, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    // Save metadata if provided
    if (metadata) {
      const metadataFilename = `metadata/meta_${Date.now()}.json`;
      const metadataContent = JSON.stringify({
        ...metadata,
        imageUrl: blob.url,
        timestamp: new Date().toISOString(),
      });

      await put(metadataFilename, metadataContent, {
        access: 'public',
        contentType: 'application/json',
      });
    }

    return new Response(JSON.stringify({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      size: blob.size,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Save enhanced error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to save image'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
