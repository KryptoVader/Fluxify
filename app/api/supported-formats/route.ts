import PluginManager from '@/lib/converters/PluginManager.js';

// Ensure this route runs in the Node.js runtime so fs/child_process are available
export const runtime = 'nodejs';

export async function GET() {
  // Dynamically import and instantiate on each request to avoid client bundling
  const manager = new PluginManager();

  // Await the Promise to get the actual formats map
  const map = await manager.getSupportedFormats();

  return new Response(JSON.stringify(map), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}