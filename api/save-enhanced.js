import { put } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    if (request.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { image, metadata } = await request.json();

    const base64Data = image.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const filename = `enhanced/enhanced_${Date.now()}.jpg`;

    const blob = await put(filename, binaryData, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    const metadataFilename = `metadata/${blob.pathname}.json`;
    await put(metadataFilename, JSON.stringify({
      ...metadata,
      imageUrl: blob.url,
      timestamp: new Date().toISOString(),
    }), {
      access: 'public',
      contentType: 'application/json',
    });

    return new Response(JSON.stringify({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
    }), {
      status: 200,
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
