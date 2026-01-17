// api/proxy.js
import fetch from "node-fetch";

/**
 * 🚨 REQUIRED: Force Node runtime on Vercel
 */
export const config = {
  runtime: "nodejs",
};

/**
 * 🔐 Token database (replace with real DB in prod)
 */
const TOKEN_DATABASE = {
  MTc2NzAxOTk3NzE2: {
    originalUrl: "https://www.configurationalmodeling.com",
    email: "drvivek@doctor.com",
    active: true,
    expiresAt: "2026-01-28",
  },
};

/**
 * 🚀 Main handler
 */
export default async function handler(req, res) {
  try {
    const { token } = req.query;

    // ---- CORS ----
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (!token) {
      return res.status(400).json({ error: "Token required" });
    }

    // ---- TOKEN VALIDATION ----
    const tokenData = TOKEN_DATABASE[token];

    if (!tokenData) {
      return res
        .status(403)
        .send(generateErrorPage("Invalid or expired token"));
    }

    if (!tokenData.active) {
      return res
        .status(403)
        .send(generateErrorPage("Access has been revoked"));
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      return res
        .status(403)
        .send(generateErrorPage("Token has expired"));
    }

    // ---- SAFE HOST / PROTOCOL DETECTION ----
    const host =
      req.headers["x-forwarded-host"] ||
      req.headers.host ||
      "stalliongate-saas.vercel.app";

    const protocol = req.headers["x-forwarded-proto"] || "https";

    const proxyBaseUrl = `${protocol}://${host}/api/proxy?token=${token}`;

    // ---- TARGET URL RESOLUTION ----
    const originalUrl = tokenData.originalUrl;
    const targetPath = req.url.split("&path=")[1] || "";
    const targetUrl = `${originalUrl}${
      targetPath ? "/" + decodeURIComponent(targetPath) : ""
    }`;

    // ---- FETCH ORIGINAL CONTENT ----
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "User-Agent":
          req.headers["user-agent"] || "Stalliongate-Proxy/1.0",
        Accept: req.headers["accept"] || "*/*",
        "Accept-Language":
          req.headers["accept-language"] || "en-US,en;q=0.9",
        Referer: originalUrl,
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .send(
          generateErrorPage(
            `Error loading content (${response.status})`
          )
        );
    }

    const contentType = response.headers.get("content-type") || "";

    // ---- HTML ----
    if (contentType.includes("text/html")) {
      let html = await response.text();
      html = rewriteHtmlUrls(html, originalUrl, proxyBaseUrl);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    }

    // ---- CSS ----
    if (contentType.includes("text/css")) {
      let css = await response.text();
      css = rewriteCssUrls(css, originalUrl, proxyBaseUrl);
      res.setHeader("Content-Type", "text/css");
      return res.send(css);
    }

    // ---- JS / JSON ----
    if (
      contentType.includes("javascript") ||
      contentType.includes("application/json")
    ) {
      let js = await response.text();
      js = rewriteJsUrls(js, originalUrl, proxyBaseUrl);
      res.setHeader("Content-Type", contentType);
      return res.send(js);
    }

    // ---- BINARY ----
    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", contentType);
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Proxy crash:", error);
    return res
      .status(500)
      .send(generateErrorPage("Failed to load content"));
  }
}

/* =======================
   🔄 REWRITE UTILITIES
   ======================= */

function rewriteHtmlUrls(html, originalUrl, proxyUrl) {
  const originalDomain = new URL(originalUrl).origin;

  html = html.replace(
    new RegExp(
      originalDomain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "g"
    ),
    proxyUrl
  );

  html = html.replace(
    new RegExp(`//${new URL(originalUrl).host}`, "g"),
    proxyUrl
  );

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

  html = html.replace(
    /url\(["']?\/([^"')]*?)["']?\)/g,
    `url("${proxyUrl}&path=$1")`
  );

  return html;
}

function rewriteCssUrls(css, originalUrl, proxyUrl) {
  const originalDomain = new URL(originalUrl).origin;

  css = css.replace(
    new RegExp(
      originalDomain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "g"
    ),
    proxyUrl
  );

  css = css.replace(
    /url\(["']?\/([^"')]*?)["']?\)/g,
    `url("${proxyUrl}&path=$1")`
  );

  return css;
}

function rewriteJsUrls(js, originalUrl, proxyUrl) {
  const originalDomain = new URL(originalUrl).origin;

  js = js.replace(
    new RegExp(`["']${originalDomain}`, "g"),
    `"${proxyUrl}`
  );

  return js;
}

/* =======================
   🚫 ERROR PAGE
   ======================= */

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
      background: linear-gradient(135deg,#667eea,#764ba2);
    }
    .container {
      background: white;
      padding: 50px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,.3);
      text-align: center;
      max-width: 600px;
    }
    h1 { color: #e74c3c; margin-bottom: 20px; }
    p { color: #555; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="container">
    <div style="font-size:72px">🚫</div>
    <h1>Access Denied</h1>
    <p>${message}</p>
    <p style="margin-top:30px;color:#999;font-size:14px">
      Powered by Stalliongate SaaS
    </p>
  </div>
</body>
</html>
`;
}
