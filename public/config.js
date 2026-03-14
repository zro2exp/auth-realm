/**
 * Okta configuration — fill in your own values.
 *
 * 1. Create an Okta account at https://developer.okta.com/
 * 2. Create a new "Single-Page App" application in the Okta Admin Console.
 * 3. Set the Login redirect URI to: http://localhost:3000/login/callback
 * 4. Set the Logout redirect URI to: http://localhost:3000
 * 5. Copy your Issuer and Client ID below.
 */
window.OKTA_CONFIG = {
  issuer:      'https://integrator-5687332.okta.com/oauth2/default',   // e.g. https://dev-123456.okta.com/oauth2/default
  clientId:    '0oa1003jdnwpRLQbW698',                            // e.g. 0oa1b2c3d4E5F6G7H8i9
  redirectUri: window.location.origin + '/login/callback',
  scopes:      ['openid', 'profile', 'email'],
  pkce:        true,
};
