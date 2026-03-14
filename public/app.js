'use strict';

/* ----------------------------------------------------------------
   STARS
---------------------------------------------------------------- */
(function createStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('span');
    s.style.left   = Math.random() * 100 + '%';
    s.style.top    = Math.random() * 100 + '%';
    s.style['--d']     = (2 + Math.random() * 4) + 's';
    s.style['--delay'] = (Math.random() * 4) + 's';
    container.appendChild(s);
  }
})();

/* ----------------------------------------------------------------
   PIXEL HERO (canvas character)
---------------------------------------------------------------- */
(function drawHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // 20x20 pixel art character (spaceman/knight)
  const X = 0, _ = null;
  const C = '#00d4ff', Y = '#ffd700', W = '#f0f0f0', R = '#e94560', B = '#1a1a2e';
  const px = [
    [X,X,X,X,C,C,C,C,C,C,C,C,C,C,C,C,X,X,X,X],
    [X,X,X,C,C,C,C,C,C,C,C,C,C,C,C,C,C,X,X,X],
    [X,X,C,C,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,C,C,X,X],
    [X,C,C,Y,W,W,W,W,W,W,W,W,W,W,W,W,Y,C,C,X],
    [X,C,C,Y,W,C,C,C,C,C,C,C,C,C,C,W,Y,C,C,X],
    [X,C,C,Y,W,C,W,W,W,W,W,W,W,W,C,W,Y,C,C,X],
    [X,C,C,Y,W,C,W,B,B,B,B,B,B,W,C,W,Y,C,C,X],
    [X,C,C,Y,W,C,W,B,C,C,C,C,B,W,C,W,Y,C,C,X],
    [X,C,C,Y,W,C,W,B,C,C,C,C,B,W,C,W,Y,C,C,X],
    [X,C,C,Y,W,C,W,W,W,W,W,W,W,W,C,W,Y,C,C,X],
    [X,C,C,Y,W,C,C,C,C,C,C,C,C,C,C,W,Y,C,C,X],
    [X,C,C,Y,W,W,W,W,W,W,W,W,W,W,W,W,Y,C,C,X],
    [X,C,C,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,C,C,X],
    [X,X,C,C,C,C,R,R,R,R,R,R,R,R,C,C,C,C,X,X],
    [X,X,X,C,R,R,R,R,R,R,R,R,R,R,R,R,C,X,X,X],
    [X,X,C,R,R,R,R,R,R,R,R,R,R,R,R,R,R,C,X,X],
    [X,X,C,R,R,C,C,R,R,R,R,R,R,C,C,R,R,C,X,X],
    [X,X,C,C,C,C,X,C,R,R,R,R,C,X,C,C,C,C,X,X],
    [X,X,X,X,X,X,X,C,C,C,C,C,C,X,X,X,X,X,X,X],
    [X,X,X,X,X,X,X,X,X,X,X,X,X,X,X,X,X,X,X,X],
  ];
  px.forEach((row, y) => {
    row.forEach((color, x) => {
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    });
  });
})();

/* ----------------------------------------------------------------
   SCREEN MANAGEMENT
---------------------------------------------------------------- */
const screens = {
  loading: document.getElementById('screen-loading'),
  login:   document.getElementById('screen-login'),
  home:    document.getElementById('screen-home'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

/* ----------------------------------------------------------------
   OKTA AUTH CLIENT
---------------------------------------------------------------- */
var authClient;

function initAuth() {
  const cfg = window.OKTA_CONFIG;
  if (!cfg || !cfg.issuer || cfg.issuer.includes('{your')) {
    // Demo mode — no real Okta config
    showScreen('login');
    document.getElementById('login-error').style.display = 'block';
    document.getElementById('login-error').textContent =
      'CONFIG NEEDED: Edit public/config.js with your Okta issuer & clientId.';
    return;
  }

  authClient = new OktaAuth({
    issuer:      cfg.issuer,
    clientId:    cfg.clientId,
    redirectUri: cfg.redirectUri,
    scopes:      cfg.scopes || ['openid', 'profile', 'email'],
    pkce:        cfg.pkce !== false,
    tokenManager: { storage: 'sessionStorage' },
  });

  // Subscribe to auth state changes
  authClient.authStateManager.subscribe(onAuthStateChange);
  authClient.start();

  // Handle redirect callback
  if (authClient.token.isLoginRedirect()) {
    handleRedirectCallback();
  } else {
    authClient.authStateManager.updateAuthState();
  }
}

async function handleRedirectCallback() {
  try {
    const { tokens } = await authClient.token.parseFromUrl();
    authClient.tokenManager.setTokens(tokens);
  } catch (err) {
    showScreen('login');
    showError('Redirect error: ' + err.message);
  }
}

function onAuthStateChange(authState) {
  if (!authState.isAuthenticated) {
    showScreen('login');
  } else {
    loadHomeScreen(authState);
  }
}

/* ----------------------------------------------------------------
   HOME SCREEN DATA
---------------------------------------------------------------- */
async function loadHomeScreen(authState) {
  showScreen('home');

  // Access token display
  const at = authState.accessToken;
  const tokenEl = document.getElementById('token-display');
  tokenEl.textContent = at ? at.accessToken : '-';

  // Token health (time remaining %)
  if (at) {
    const now    = Math.floor(Date.now() / 1000);
    const issued = at.claims.iat || now;
    const exp    = at.expiresAt;
    const total  = exp - issued;
    const left   = exp - now;
    const pct    = Math.max(0, Math.min(100, Math.round((left / total) * 100)));
    document.getElementById('stat-health-val').textContent = pct + '%';
    const bar = document.getElementById('stat-health-bar');
    bar.style.width = pct + '%';
    if (pct < 30) bar.className = 'bar-fill red';
    else if (pct < 60) bar.className = 'bar-fill yellow';
    else bar.className = 'bar-fill';
  }

  // Scopes
  const scopes = (at && at.scopes) ? at.scopes : (window.OKTA_CONFIG.scopes || []);
  document.getElementById('stat-scopes-val').textContent = scopes.length;
  document.getElementById('stat-scopes-bar').style.width =
    Math.min(100, (scopes.length / 5) * 100) + '%';

  // User info
  try {
    const user = await authClient.getUser();
    const name = user.name || user.preferred_username || user.email || 'HERO';
    document.getElementById('display-name').textContent = name.toUpperCase();
    document.getElementById('info-name').textContent  = user.name || '-';
    document.getElementById('info-email').textContent = user.email || '-';
    document.getElementById('info-sub').textContent   = user.sub ? user.sub.substring(0, 20) + '...' : '-';
    document.getElementById('info-locale').textContent = user.locale || user.zoneinfo || 'en';
  } catch (err) {
    document.getElementById('info-name').textContent = '(could not load)';
  }
}

/* ----------------------------------------------------------------
   ACTIONS
---------------------------------------------------------------- */
function showError(msg) {
  const el = document.getElementById('login-error');
  el.style.display = 'block';
  el.textContent = msg;
}

document.getElementById('btn-login-redirect').addEventListener('click', async () => {
  if (!authClient) return;
  try {
    await authClient.signInWithRedirect();
  } catch (err) {
    showError(err.message);
  }
});

document.getElementById('btn-login-form').addEventListener('click', async () => {
  if (!authClient) { showError('Configure Okta first.'); return; }
  const username = document.getElementById('inp-username').value.trim();
  const password = document.getElementById('inp-password').value;
  if (!username || !password) { showError('ENTER USERNAME & PASSWORD'); return; }
  const btn = document.getElementById('btn-login-form');
  btn.disabled = true;
  btn.textContent = '> AUTHENTICATING...';
  try {
    const transaction = await authClient.signInWithCredentials({ username, password });
    if (transaction.status === 'SUCCESS') {
      await authClient.token.getWithRedirect({ sessionToken: transaction.sessionToken });
    } else {
      showError('STATUS: ' + transaction.status);
    }
  } catch (err) {
    showError(err.message || 'AUTH FAILED');
  } finally {
    btn.disabled = false;
    btn.textContent = '> SIGN IN';
  }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  if (!authClient) return;
  try {
    await authClient.signOut();
  } catch (err) {
    console.error(err);
  }
});

document.getElementById('btn-refresh-token').addEventListener('click', async () => {
  if (!authClient) return;
  try {
    await authClient.tokenManager.renew('accessToken');
  } catch (err) {
    console.error('Refresh failed', err);
  }
});

/* ----------------------------------------------------------------
   BOOT
---------------------------------------------------------------- */
window.addEventListener('load', () => {
  // Small delay so the loading screen is visible
  setTimeout(initAuth, 400);
});
