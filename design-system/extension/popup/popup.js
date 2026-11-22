// Toolbar popup. Preview outside the extension: popup.html?state=active|paused|unsupported|offline&theme=light|dark
// (sample history from the markup). Inside the extension it reads the active tab and chrome.storage.
// The paste box calls the same API as the web form; the result renders with reference/card.js in a shadow root.
(async () => {
  const q = new URLSearchParams(location.search);
  const EXT = !!globalThis.chrome?.storage;
  const $ = s => document.querySelector(s);
  const PLATFORMS = { 'x.com': 'X', 'twitter.com': 'X', 'facebook.com': 'Facebook', 'instagram.com': 'Instagram', 'reddit.com': 'Reddit', 'tiktok.com': 'TikTok' };
  const platformOf = host => Object.entries(PLATFORMS).find(([d]) => host === d || host.endsWith('.' + d))?.[1];
  const TONE = { confirmed: 'ok', false: 'bad', misleading: 'pend' };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const T = await (await fetch(EXT ? chrome.runtime.getURL('pl.json') : '../../copy/pl.json')).json();
  MeritumCard.use(T);

  let theme = q.get('theme'), state = q.get('state'), host = q.get('host') || 'x.com', tab;
  if (EXT) {
    const s = await chrome.storage.local.get({ theme: 'auto', paused: [], checks: [] });
    theme = theme || s.theme;
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try { host = new URL(tab.url).hostname.replace(/^www\./, ''); } catch { host = ''; }
    if (!state) state = !navigator.onLine ? 'offline' : !platformOf(host) ? 'unsupported' : s.paused.includes(host) ? 'paused' : 'active';
    renderChecks(s.checks);
  }
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  render(state || 'active');

  function render(st) {
    document.body.dataset.state = st;
    $('#site-name').textContent = host;
    $('[data-host-name]').textContent = host;
    $('[data-site-switch] input').checked = st === 'active' || st === 'offline';
    $('[data-site-switch]').hidden = st === 'unsupported';
    $('[data-site-state]').textContent = { active: 'Przycisk „Sprawdź” jest pod postami', paused: 'Wstrzymane na tej stronie', unsupported: 'Ta strona nie jest obsługiwana', offline: 'Brak połączenia' }[st];
    $('[data-offline]').hidden = st !== 'offline';
    $('[data-paused]').hidden = st !== 'paused';
    $('[data-unsupported]').hidden = st !== 'unsupported';
  }

  function renderChecks(list) {
    if (!list.length) { $('[data-checks]').innerHTML = `<li class="m">${esc(T.history.empty)}</li>`; return; }
    $('[data-checks]').innerHTML = list.slice(0, 3).map(r => {
      const t = new Date(r.at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
      const where = r.platform ? `${esc(PLATFORMS[r.platform + '.com'] || r.platform)}, ` : '';
      const word = r.verdict ? T.verdict[r.verdict] : T.status[r.status] || '';
      return `<li><span class="grow"><span class="t">${esc(r.excerpt)}</span><span class="m">${where}${r.handle ? `<span class="num">${esc(r.handle)}</span>, ` : ''}<span class="num">${t}</span></span></span><span class="badge ${TONE[r.verdict] || ''}">${esc(word)}</span></li>`;
    }).join('');
  }

  // ---------- paste box ----------
  const ta = $('#ask'), err = $('#ask-err'), submit = $('[data-submit]'), out = $('[data-result]');
  const shadow = out.attachShadow({ mode: 'open' });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(await (await fetch('../widget.css')).text());
  shadow.adoptedStyleSheets = [sheet];
  const syncDark = () => out.classList.toggle('dark', document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches));
  syncDark();

  ta.addEventListener('input', () => { submit.disabled = ta.value.trim().length < 3; err.hidden = true; });
  $('[data-form]').addEventListener('submit', async e => {
    e.preventDefault();
    const req = MeritumInput.toRequest(ta.value, 'extension');
    if (typeof req === 'string') { err.textContent = T.errors[req]; err.hidden = false; return; }
    submit.disabled = true; submit.textContent = T.form.checking;
    out.hidden = false;
    shadow.innerHTML = '<output class="m-proc"></output>';
    let result;
    try { result = await MeritumAPI.check(req, st => { shadow.querySelector('.m-proc').innerHTML = MeritumCard.steps(st); }); }
    catch { result = { check_id: '', status: 'technical_failure', corpus_version: '' }; }
    shadow.innerHTML = MeritumCard.card(result);
    submit.disabled = false; submit.textContent = T.form.submit;
    if (EXT && result.status !== 'technical_failure') {
      const item = { id: result.check_id, platform: '', handle: '', excerpt: (req.text || req.url).slice(0, 120), at: Date.now(), verdict: result.claims?.[0]?.verdict || null, status: result.status };
      const { checks = [] } = await chrome.storage.local.get('checks');
      await chrome.storage.local.set({ checks: [item, ...checks].slice(0, 20) });
      renderChecks([item, ...checks]);
    }
  });

  async function setPaused(paused) {
    if (EXT) {
      const { paused: list = [] } = await chrome.storage.local.get('paused');
      await chrome.storage.local.set({ paused: paused ? [...new Set([...list, host])] : list.filter(h => h !== host) });
      chrome.tabs.reload(tab.id); // the content script reads the setting on load
    }
    render(paused ? 'paused' : 'active');
  }
  $('[data-site-switch] input').addEventListener('change', e => setPaused(!e.target.checked));
  $('[data-resume]').addEventListener('click', () => setPaused(false));
  $('[data-retry]').addEventListener('click', () => render(navigator.onLine ? 'active' : 'offline'));
})();
