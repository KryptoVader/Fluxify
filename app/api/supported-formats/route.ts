// app/api/supported-formats/route.ts
import { NextResponse } from 'next/server';
import PluginManager from '@/lib/converters/PluginManager.js';

// We need Node.js runtime for the PluginManager which uses fs/child_process
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Default formats to use as fallback
const DEFAULT_FORMATS = {
  "pdf": ["jpg", "png", "txt"],
  "docx": ["pdf", "txt"],
  "doc": ["pdf", "txt"],
  "xlsx": ["csv", "pdf"],
  "xls": ["csv", "pdf"],
  "pptx": ["pdf", "jpg"],
  "ppt": ["pdf", "jpg"],
  "jpg": ["png", "pdf", "webp"],
  "jpeg": ["png", "pdf", "webp"],
  "png": ["jpg", "pdf", "webp"],
  "mp4": ["mp3", "gif", "webm"],
  "mov": ["mp4", "gif"],
  "avi": ["mp4", "webm"],
  "mp3": ["wav", "ogg"],
  "wav": ["mp3", "ogg"],
  "txt": ["pdf", "docx"],
  "csv": ["xlsx", "pdf"]
};

export async function GET() {
  try {
    // First try to use the configured backend service if available
    const BACKEND_URL = process.env.BACKEND_URL;
    
    if (BACKEND_URL) {
      try {
        const res = await fetch(`${BACKEND_URL}/supported-formats`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
        console.warn('Could not fetch formats from backend, falling back to PluginManager');
      } catch (e) {
        console.warn('Backend formats endpoint failed, falling back to PluginManager');
      }
    }
    
    // If backend isn't available, try to use PluginManager
    try {
      // Dynamically import and instantiate on each request to avoid client bundling
      const manager = new PluginManager();
      
      // Await the Promise to get the actual formats map
      const map = await manager.getSupportedFormats();
      
      // Return formats from PluginManager
      return NextResponse.json(map);
    } catch (e) {
      console.warn('PluginManager failed, using default formats', e);
    }
    
    // Return default formats if both backend and PluginManager fail
    return NextResponse.json(DEFAULT_FORMATS);
  } catch (e: any) {
    console.error('Error in formats endpoint:', e);
    return NextResponse.json(
      DEFAULT_FORMATS,
      { status: 200 }  // Return 200 with defaults even on error
    );
  }
}