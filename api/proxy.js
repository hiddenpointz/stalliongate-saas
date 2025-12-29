// api/proxy.js
import fetch from 'node-fetch';

// Your token database (in production, use a real database)
const TOKEN_DATABASE = {
  'MTc2NzAxOTk3NzE2': {
    originalUrl: 'https://www.configurationalmodeling.com',
    email: 'drvivek@doctor.com',
    active: true,
    expiresAt: '2026-01-28'
  },
  // Add more tokens as needed
};

export default async function handler(req, res) {
  const { token } = req.query;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  // 1. VERIFY TOKEN
  const tokenData = TOKEN_DATABASE[token];
  
  if (!tokenData) {
    return res.status(403).send(generateErrorPage('Invalid or expired token'));
  }
  
  if (!tokenData.active) {
    return res.status(403).send(generateErrorPage('Access has been revoked'));
  }
  
  // Check expiration
  if (new Date(tokenData.expiresAt) < new Date()) {
    return res.status(403).send(generateErrorPage('Token has expired'));
  }

  // 2. BUILD TARGET URL
  const originalUrl = tokenData.originalUrl;
  const proxyBaseUrl = `https://${req.headers.host}/api/proxy?token=${token}`;
  
  // Get the path after /api/proxy?token=XXX
  const targetPath = req.url.split('&path=')[1] || '';
  const targetUrl = `${originalUrl}${targetPath ? '/' + decodeURIComponent(targetPath) : ''}`;

  try {
    // 3. FETCH CONTENT FROM ORIGINAL URL
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Stalliongate-Proxy/1.0',
        'Accept': req.headers['accept'] || '*/*',
        'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
        'Referer': originalUrl,
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      return res.status(response.status).send(generateErrorPage(`Error loading content: ${response.status}`));
    }

    const contentType = response.headers.get('content-type') || '';

    // 4. HANDLE DIFFERENT CONTENT TYPES
    
    // HTML - Rewrite all URLs
    if (contentType.includes('text/html')) {
      let html = await response.text();
      
      // Rewrite URLs to go through proxy
      html = rewriteHtmlUrls(html, originalUrl, proxyBaseUrl);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }
    
    // CSS - Rewrite URLs in CSS
    else if (contentType.includes('text/css')) {
      let css = await response.text();
      css = rewriteCssUrls(css, originalUrl, proxyBaseUrl);
      
      res.setHeader('Content-Type', 'text/css');
      return res.send(css);
    }
    
    // JavaScript - Rewrite URLs in JS
    else if (contentType.includes('javascript') || contentType.includes('application/json')) {
      let js = await response.text();
      js = rewriteJsUrls(js, originalUrl, proxyBaseUrl);
      
      res.setHeader('Content-Type', contentType);
      return res.send(js);
    }
    
    // Binary content (images, fonts, etc.) - Pass through
    else {
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      return res.send(Buffer.from(buffer));
    }

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).send(generateErrorPage('Failed to load content'));
  }
}

// REWRITE HTML URLS
function rewriteHtmlUrls(html, originalUrl, proxyUrl) {
  const originalDomain = new URL(originalUrl).origin;
  
  // Replace absolute URLs
  html = html.replace(
    new RegExp(originalDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    proxyUrl
  );
  
  // Replace protocol-relative URLs
  html = html.replace(
    new RegExp(`//${new URL(originalUrl).host}`, 'g'),
    proxyUrl
  );
  
  // Replace relative URLs in common attributes
  html = html.replace(
    /href=["']\/([^"']*?)["']/g,
    `href="${proxyUrl}&path=$1"`
  );
  
  html = html.replace(
    /src=["']\/([^"']*?)["']/g,
    `src="${proxyUrl}&path=$1"`
  );
  
  html = html.replace(
    /action=["']\/([^"']*?)["']/g,
    `action="${proxyUrl}&path=$1"`
  );
  
  // Replace CSS url() in inline styles
  html = html.replace(
    /url\(["']?\/([^"')]*?)["']?\)/g,
    `url("${proxyUrl}&path=$1")`
  );
  
  return html;
}

// REWRITE CSS URLS
function rewriteCssUrls(css, originalUrl, proxyUrl) {
  const originalDomain = new URL(originalUrl).origin;
  
  // Replace absolute URLs
  css = css.replace(
    new RegExp(originalDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    proxyUrl
  );
  
  // Replace relative URLs in url()
  css = css.replace(
    /url\(["']?\/([^"')]*?)["']?\)/g,
    `url("${proxyUrl}&path=$1")`
  );
  
  return css;
}

// REWRITE JAVASCRIPT URLS
function rewriteJsUrls(js, originalUrl, proxyUrl) {
  const originalDomain = new URL(originalUrl).origin;
  
  // Replace absolute URLs (be careful with this)
  js = js.replace(
    new RegExp(`["']${originalDomain}`, 'g'),
    `"${proxyUrl}`
  );
  
  return js;
}

// ERROR PAGE GENERATOR
function generateErrorPage(message) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Stalliongate - Access Error</title>
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container { 
            background: white; 
            padding: 50px; 
            border-radius: 20px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 600px;
          }
          h1 { 
            color: #e74c3c; 
            margin: 0 0 20px 0;
            font-size: 32px;
          }
          p { 
            color: #555; 
            line-height: 1.8;
            font-size: 16px;
          }
          .icon { 
            font-size: 80px; 
            margin-bottom: 20px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🚫</div>
          <h1>Access Denied</h1>
          <p>${message}</p>
          <p style="margin-top: 30px; color: #999; font-size: 14px;">Powered by Stalliongate SaaS</p>
        </div>
      </body>
    </html>
  `;
}
