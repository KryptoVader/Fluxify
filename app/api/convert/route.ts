// app/api/convert/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const BACKEND_URL = process.env.BACKEND_URL;  // ← ensure this is defined

if (!BACKEND_URL) {
  throw new Error('Missing BACKEND_URL environment variable');
}

export async function POST(request: Request) {
  try {
    const original = await request.formData();

    const forward = new FormData();
    // map `outputFormat` → `format`
    const fmt = original.get('outputFormat');
    if (fmt) forward.append('format', fmt as string);

    // file
    const file = original.get('file');
    if (file) forward.append('file', file as Blob);

    // optional flags
    if (original.has('highQuality'))
      forward.append('highQuality', original.get('highQuality') as string);
    if (original.has('forceTranscode'))
      forward.append('forceTranscode', original.get('forceTranscode') as string);

    const res = await fetch(`${BACKEND_URL}/convert`, {
      method: 'POST',
      body: forward,
    });

    // If Express sent back a file download…
    const disposition = res.headers.get('content-disposition') || '';
    if (disposition.includes('attachment')) {
      const arrayBuffer = await res.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      // mirror the headers (incl. content-type, content-disposition)
      const headers = new Headers();
      res.headers.forEach((v, k) => headers.set(k, v));

      return new NextResponse(uint8, {
        status: res.status,
        headers,
      });
    }

    // Otherwise assume JSON and proxy it
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });

  } catch (e: any) {
    console.error('Proxy error:', e);
    return NextResponse.json(
      { error: 'Failed to connect to conversion service' },
      { status: 500 }
    );
  }
}
