// EfbiSave - frontend-only implementation
// CONFIG:
const MODE = "DEMO"; // "DEMO" or "REAL"
const API_BASE = ""; // e.g. "https://your-domain.example/api/resolve" (used when MODE === "REAL")

/* -------------------------
   Utilities & DOM bindings
   ------------------------- */
const form = document.getElementById('downloadForm');
const input = document.getElementById('videoUrl');
const pasteBtn = document.getElementById('pasteBtn');
const downloadBtn = document.getElementById('downloadBtn');
const formMessage = document.getElementById('formMessage');
const resultsEl = document.getElementById('results');
const emptyState = document.getElementById('emptyState');

function setFormMessage(text, type = 'info') {
  formMessage.textContent = text || '';
  formMessage.className = 'form-message ' + (type === 'error' ? 'error' : '');
}

/* Simple validation for Facebook URLs */
function validateFacebookUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    // allow missing scheme
    let u = url.trim();
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    const parsed = new URL(u);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    const path = parsed.pathname.toLowerCase();

    const fbHosts = ['facebook.com', 'm.facebook.com', 'fb.watch', 'fbcdn.net', 'facebook.com.hk'];
    const allowedHost = fbHosts.some(h => host === h || host.endsWith('.' + h));
    if (!allowedHost) {
      // allow fb.watch shorthand host
      if (!host.includes('facebook') && !host.includes('fb.')) return false;
    }

    // accept typical video/reel/watch/video.php patterns
    if (host.includes('facebook') || host.includes('fb.')) {
      // basic check for video-like path or query
      if (path.includes('/reel') || path.includes('/reels') || path.includes('/watch') || path.includes('/video') || parsed.searchParams.has('v')) {
        return true;
      }
      // fb.watch short links
      if (host.startsWith('fb.watch')) return true;
      // also accept general facebook urls (best-effort)
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

/* -------------------------
   Resolver implementation
   ------------------------- */
async function resolveFacebookVideo(url) {
  // Primary API contract:
  // DEMO: return mocked JSON that matches what the UI expects
  // REAL: call API_BASE?q=url and expect JSON { ok: true, title, thumbnail, formats: [{quality, mime, url, size}] }
  if (MODE === 'DEMO') {
    // Mock delay to show spinner
    await new Promise(r => setTimeout(r, 900));
    // Provide a range of fake format entries
    const demoFormats = [
      { quality: '360p', mime: 'video/mp4', url: 'https://sample-videos.com/video123/mp4/360/big_buck_bunny_360p_1mb.mp4', size: 450000 },
      { quality: '720p', mime: 'video/mp4', url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', size: 1200000 },
      { quality: '1080p', mime: 'video/mp4', url: 'https://sample-videos.com/video123/mp4/1080/big_buck_bunny_1080p_1mb.mp4', size: 2400000 },
      { quality: '2K', mime: 'video/mp4', url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', size: 3600000 },
      { quality: '4K', mime: 'video/mp4', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', size: 8000000 }
    ];
    return {
      ok: true,
      title: 'Demo video — Big Buck Bunny (sample)',
      thumbnail: '',
      formats: demoFormats
    };
  } else {
    // REAL mode: call backend resolver
    if (!API_BASE) {
      return { ok: false, error: 'API_BASE not configured. Set API_BASE in app.js when using REAL mode.' };
    }
    try {
      const endpoint = `${API_BASE}${API_BASE.includes('?') ? '&' : '?'}url=${encodeURIComponent(url)}`;
      const resp = await fetch(endpoint, { method: 'GET' });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        return { ok: false, error: `Resolver returned HTTP ${resp.status} ${txt}` };
      }
      const data = await resp.json();
      return data;
    } catch (err) {
      return { ok: false, error: err.message || String(err) };
    }
  }
}

/* -------------------------
   UI rendering functions
   ------------------------- */

function clearResults() {
  resultsEl.querySelectorAll('.card').forEach(n => n.remove());
  emptyState.style.display = '';
}

function showLoading() {
  clearResults();
  setFormMessage('');
  emptyState.style.display = 'none';
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center">
      <div class="spinner" aria-hidden="true"></div>
      <div>
        <strong>Resolving video</strong>
        <div style="color:var(--muted);font-size:13px;margin-top:6px">Contacting resolver and analyzing available formats…</div>
      </div>
    </div>
  `;
  resultsEl.prepend(card);
}

function renderError(errorMessage) {
  clearResults();
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="error"><strong>Error</strong><div style="margin-top:6px;color:#6b0000">${escapeHtml(errorMessage)}</div></div>
  `;
  resultsEl.prepend(card);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function renderFormats(title, formats = []) {
  clearResults();
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <h3>Available formats</h3>
    <div style="color:var(--muted);font-size:13px">${escapeHtml(title || '')}</div>
    <div class="formats" id="formatsList"></div>
  `;
  resultsEl.prepend(card);

  const list = card.querySelector('#formatsList');

  if (!formats || formats.length === 0) {
    list.innerHTML = `<div style="padding:8px;color:var(--muted)">No downloadable formats found.</div>`;
    return;
  }

  formats.forEach(fmt => {
    const row = document.createElement('div');
    row.className = 'format-row';
    const sizeText = fmt.size ? humanSize(fmt.size) : '';
    row.innerHTML = `
      <div class="format-left">
        <div class="quality">${escapeHtml(fmt.quality || fmt.mime || 'Unknown')}</div>
        <div class="meta">${escapeHtml(fmt.mime || '')} ${sizeText ? ' · ' + sizeText : ''}</div>
      </div>
      <div class="format-actions">
        <a class="btn-link" target="_blank" rel="noopener noreferrer" href="${escapeAttribute(fmt.url)}">Open</a>
        <button class="btn-primary btn-download" data-url="${escapeAttribute(fmt.url)}">Download</button>
      </div>
    `;
    list.appendChild(row);
  });

  // wired download buttons
  list.querySelectorAll('.btn-download').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = btn.getAttribute('data-url');
      if (!url) return;
      // create temporary anchor to download / open
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      // try to set download attribute (may not work cross-origin)
      // filename as quality if present in UI
      try { a.download = ''; } catch(e) {}
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  });
}

/* helpers */
function humanSize(bytes) {
  if (!bytes || isNaN(bytes)) return '';
  const units = ['B','KB','MB','GB','TB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val >= 10 ? 0 : 1)} ${units[i]}`;
}

function escapeAttribute(s) {
  if (!s) return '';
  return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* -------------------------
   Event handlers
   ------------------------- */

pasteBtn.addEventListener('click', async () => {
  // Attempt clipboard API
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      if (text) {
        input.value = text.trim();
        setFormMessage('Pasted from clipboard');
        input.focus();
        return;
      } else {
        setFormMessage('Clipboard is empty', 'info');
      }
    } else {
      // fallback prompt
      const fallback = prompt('Paste clipboard content here:');
      if (fallback) {
        input.value = fallback.trim();
        setFormMessage('Pasted (fallback)');
        input.focus();
      }
    }
  } catch (err) {
    // permission denied or other
    const fallback = prompt('Could not access clipboard. Paste your URL here:');
    if (fallback) {
      input.value = fallback.trim();
      setFormMessage('Pasted (fallback)');
      input.focus();
    } else {
      setFormMessage('Unable to paste from clipboard', 'error');
    }
  }
});

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const url = input.value && input.value.trim();
  setFormMessage('');
  if (!url) {
    setFormMessage('Please enter a Facebook video URL.', 'error');
    input.focus();
    return;
  }
  if (!validateFacebookUrl(url)) {
    setFormMessage('Please enter a valid Facebook video URL (fb.watch, facebook.com, reels, watch, etc.).', 'error');
    input.focus();
    return;
  }

  // begin resolve
  showLoading();
  const result = await resolveFacebookVideo(url);

  if (!result) {
    renderError('Resolver returned empty response.');
    return;
  }
  if (!result.ok) {
    renderError(result.error || 'Unknown error from resolver.');
    return;
  }

  // success
  renderFormats(result.title || '', result.formats || []);
  setFormMessage(`Found ${ (result.formats && result.formats.length) || 0 } format(s).`);
});

/* Initialize: ensure empty state shown */
(function init(){
  // if MODE === REAL but API_BASE empty, warn user in UI
  if (MODE === 'REAL' && !API_BASE) {
    setFormMessage('Running in REAL mode but API_BASE is not configured. Edit app.js to set API_BASE.', 'error');
  } else {
    setFormMessage('');
  }
})();
