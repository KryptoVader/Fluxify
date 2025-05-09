// app/api/convert/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
  console.error('Missing BACKEND_URL environment variable');
  throw new Error('Server configuration error');
}

export async function POST(request: Request) {
  try {
    const original = await request.formData();
    
    const forward = new FormData();
    
    // Map `outputFormat` → `format` (required by backend)
    const fmt = original.get('outputFormat');
    if (!fmt) {
      return NextResponse.json(
        { error: 'No output format specified' },
        { status: 400 }
      );
    }
    forward.append('format', fmt as string);
    
    // File (required by backend)
    const file = original.get('file');
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }
    forward.append('file', file as Blob);
    
    // Optional flags
    if (original.has('highQuality'))
      forward.append('highQuality', original.get('highQuality') as string);
    if (original.has('forceTranscode'))
      forward.append('forceTranscode', original.get('forceTranscode') as string);
    
    console.log(`Forwarding conversion request to ${BACKEND_URL}/convert`);
    
    const res = await fetch(`${BACKEND_URL}/convert`, {
      method: 'POST',
      body: forward,
    });
    
    if (!res.ok) {
      console.error(`Backend error: ${res.status} ${res.statusText}`);
      const errorText = await res.text();
      try {
        // Try to parse as JSON
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorJson.error || 'Conversion service error' },
          { status: res.status }
        );
      } catch (e) {
        // If not JSON, return text error
        return NextResponse.json(
          { error: errorText || 'Conversion service error' },
          { status: res.status }
        );
      }
    }
    
    // If Express sent back a file download
    const disposition = res.headers.get('content-disposition') || '';
    if (disposition.includes('attachment')) {
      console.log('Received file download response from backend');
      const arrayBuffer = await res.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      
      // Mirror the headers (incl. content-type, content-disposition)
      const headers = new Headers();
      res.headers.forEach((v, k) => headers.set(k, v));
      
      return new NextResponse(uint8, {
        status: 200,
        headers,
      });
    }
    
    // Otherwise assume JSON and proxy it
    try {
      const json = await res.json();
      console.log('Received JSON response from backend:', json);
      
      // Check if we got the expected response format
      if (!json.converted || !Array.isArray(json.converted)) {
        console.error('Unexpected response format from backend');
        return NextResponse.json(
          { error: 'Invalid response from conversion service' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(json);
    } catch (e) {
      console.error('Failed to parse JSON response from backend:', e);
      return NextResponse.json(
        { error: 'Invalid response from conversion service' },
        { status: 500 }
      );
    }
  } catch (e: any) {
    console.error('Proxy error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to connect to conversion service' },
      { status: 500 }
    );
  }
}