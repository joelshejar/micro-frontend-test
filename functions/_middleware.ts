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

const FALLBACK_REMOTE_URL = 'https://micro-frontend-test-remote.pages.dev/remoteEntry.js';

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

    // Only process successful responses
    if (!response.ok) {
      return response;
    }

    // Check content type - must be text-based
    const contentType = response.headers.get('content-type') || '';
    const isTextContent = contentType.includes('text') ||
                          contentType.includes('javascript') ||
                          contentType.includes('html') ||
                          contentType.includes('application/javascript');

    if (!isTextContent) {
      return response;
    }

    // IMPORTANT: Clone response before reading body
    // The original response body can only be read once
    const clonedResponse = response.clone();

    // Read the response body
    let body;
    try {
      body = await clonedResponse.text();
    } catch (err) {
      console.error('[Host Middleware] Failed to read response body:', err);
      return response; // Return original response on error
    }

    // Check if we need to replace the placeholder
    if (!body.includes('__REMOTE_URL_PLACEHOLDER__')) {
      return response; // No replacement needed, return original
    }

    // Get remote URL from KV with fallback
    let remoteUrl = FALLBACK_REMOTE_URL;

    if (env.REMOTE_URLS) {
      try {
        const kvUrl = await env.REMOTE_URLS.get('remote1_url');
        if (kvUrl) {
          remoteUrl = kvUrl;
          console.log(`[Host KV Fetch] Using remote URL from KV: ${remoteUrl}`);
        } else {
          console.warn('[Host KV Fetch] remote1_url not found in KV, using fallback');
        }
      } catch (error) {
        console.error('[Host KV Fetch] Error reading from KV:', error);
      }
    } else {
      console.warn('[Host KV Fetch] REMOTE_URLS binding not found, using fallback');
    }

    // Replace the placeholder with the actual remote URL
    const modifiedBody = body.replace(/__REMOTE_URL_PLACEHOLDER__/g, remoteUrl);
    console.log(`[Host URL Injection] Replaced placeholder with: ${remoteUrl}`);

    // Create new headers object (Response headers are immutable)
    const newHeaders = new Headers(response.headers);

    // Create a new response with the modified body
    return new Response(modifiedBody, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    // Log the error for debugging
    console.error('[Host Middleware Error]', error);

    // Return a generic error response instead of trying to call next()
    // Calling next() here might fail since we already called it
    return new Response('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
