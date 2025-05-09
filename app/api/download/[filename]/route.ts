import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;
if (!BACKEND_URL) {
  throw new Error('Missing BACKEND_URL env var');
}

export async function GET(
  _: Request,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;

  // 1) Fetch from your Railway backend
  const upstream = await fetch(
    `${BACKEND_URL}/files/${encodeURIComponent(filename)}`
  );

  if (!upstream.ok) {
    return new NextResponse('File not found', { status: upstream.status });
  }

  // 2) Read the bytes
  const arrayBuffer = await upstream.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  // 3) Mirror content-type, but force attachment
  const headers = new Headers(upstream.headers);
  headers.set(
    'Content-Disposition',
    `attachment; filename="${filename}"`
  );

  return new NextResponse(uint8, {
    status: 200,
    headers,
  });
}
