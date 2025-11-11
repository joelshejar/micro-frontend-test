/**
 * Cloudflare Pages Functions Middleware for Host App
 *
 * This edge function dynamically injects the remote app URL from KV storage
 * into the host app's JavaScript bundle. This enables automatic updates
 * when the remote app is redeployed without requiring host redeployment.
 */

interface Env {
  REMOTE_URLS: KVNamespace;
}

// Cache the KV value in memory for 5 minutes to reduce KV reads
let cachedRemoteUrl: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;

  try {
    const url = new URL(request.url);

    // Only process requests for HTML and JavaScript files
    const isHtmlOrJs =
      url.pathname === '/' ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.js');

    if (!isHtmlOrJs) {
      return next();
    }

    // Get the response from the origin
    const response = await next();

    // Only process successful responses with text content
    if (!response.ok || !response.headers.get('content-type')?.includes('text')) {
      return response;
    }

    // Check if we have a cached remote URL that's still valid
    const now = Date.now();
    if (!cachedRemoteUrl || now - cacheTimestamp > CACHE_TTL_MS) {
      // Fetch remote URL from KV
      if (env.REMOTE_URLS) {
        try {
          const remoteUrl = await env.REMOTE_URLS.get('remote1_url');
          if (remoteUrl) {
            cachedRemoteUrl = remoteUrl;
            cacheTimestamp = now;
            console.log(`[Host KV Fetch] Updated cache with remote1_url: ${remoteUrl}`);
          } else {
            console.warn('[Host KV Fetch] remote1_url not found in KV, using fallback');
            // Fallback to production URL if KV is not set
            cachedRemoteUrl = 'https://micro-frontend-test-remote.pages.dev/remoteEntry.js';
          }
        } catch (error) {
          console.error('[Host KV Fetch] Error reading from KV:', error);
          // Fallback URL in case of error
          cachedRemoteUrl = 'https://micro-frontend-test-remote.pages.dev/remoteEntry.js';
        }
      } else {
        console.warn('[Host KV Fetch] REMOTE_URLS binding not found');
        cachedRemoteUrl = 'https://micro-frontend-test-remote.pages.dev/remoteEntry.js';
      }
    }

    // Read the response body
    let body = await response.text();

    // Replace the placeholder with the actual remote URL
    if (body.includes('__REMOTE_URL_PLACEHOLDER__')) {
      body = body.replace(/__REMOTE_URL_PLACEHOLDER__/g, cachedRemoteUrl || '');
      console.log(`[Host URL Injection] Replaced placeholder with: ${cachedRemoteUrl}`);

      // Create a new response with the modified body
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    return response;
  } catch (error) {
    console.error('[Host Middleware Error]', error);
    // Always return a response even if something fails
    return next();
  }
};
