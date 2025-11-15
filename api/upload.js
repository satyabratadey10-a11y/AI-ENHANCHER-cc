import { put } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || `upload_${Date.now()}.jpg`;

    // Upload to Vercel Blob
    const blob = await put(filename, request.body, {
      access: 'public',
      addRandomSuffix: true,
    });

    return new Response(JSON.stringify({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      size: blob.size,
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
