/*!
 * Simple Express server for the pixel-art-spa sample.
 * Serves static files from ./public and proxies the okta-auth-js UMD build.
 */
'use strict';

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Read the Okta issuer from config to build a tight CSP connect-src.
// We extract the hostname dynamically so you only need to update config.js.
function getOktaOrigin() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const src = require('fs').readFileSync(
      path.join(__dirname, 'public', 'config.js'), 'utf8'
    );
    const match = src.match(/issuer:\s*['"]([^'"]+)['"]/);
    if (match) {
      const url = new URL(match[1]);
      return url.origin; // e.g. https://integrator-5687332.okta.com
    }
  } catch (_) { /* ignore */ }
  return 'https://*.okta.com';
}

const OKTA_ORIGIN = getOktaOrigin();

// Content-Security-Policy that allows:
//  - our own scripts/styles (inline needed for the <style> block)
//  - Google Fonts
//  - okta-auth-js from CDN (fallback)
//  - API calls to the Okta tenant
//  - images from self + data URIs (canvas toDataURL, favicon)
const CSP = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' https://global.oktacdn.com`,
  `style-src  'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src   https://fonts.gstatic.com`,
  `img-src    'self' data:`,
  `connect-src 'self' ${OKTA_ORIGIN}`,
  `frame-src  ${OKTA_ORIGIN}`,
].join('; ');

// Apply CSP to every response
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP);
  next();
});

// Serve okta-auth-js UMD build from the repo's local build output when available
app.use('/okta-auth-js.min.js', (req, res, next) => {
  const localPath = path.resolve(__dirname, '../okta-auth-js/build/umd/default.js');
  res.sendFile(localPath, err => { if (err) next(); });
});

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback — serve index.html for any unknown route (handles /login/callback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\nPixel Art SPA running at http://localhost:${PORT}`);
  console.log(`Okta origin (CSP): ${OKTA_ORIGIN}`);
  console.log('Configure your Okta app settings in public/config.js\n');
});
