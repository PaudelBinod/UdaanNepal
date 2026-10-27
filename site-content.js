/* Loads the text that staff edit in the admin page (contact details, UNIF details,
   testimonials) and drops it into the page. If anything fails, the text already
   written in the HTML stays, so the page never breaks. */
(function () {
  /* Nepali (Devanagari) font, used wherever an element is marked lang="ne" */
  try {
    var fl = document.createElement('link'); fl.rel = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap';
    document.head.appendChild(fl);
    var fs = document.createElement('style');
    fs.textContent = '[lang="ne"],[lang="ne"] *{font-family:"Noto Sans Devanagari","Mangal",system-ui,sans-serif !important;line-height:1.7}';
    document.head.appendChild(fs);
  } catch (e) {}
  if (!window.supabase) return;
  /* Singleton Supabase client — shared by site-content.js and every page script.
     Creating more than one GoTrueClient per page triggers a browser warning.
     Pages must NOT call supabase.createClient() themselves; they reference
     window.supabaseClient (or window.UN.sb) which is set here. */
  var sb = window.supabaseClient || supabase.createClient(
    'https://idwbxagsxpkkqwfjftox.supabase.co',
    'sb_publishable_ju3GQ5lGipjlLtDRZZXxPg__J7tzqfw'
  );
  window.supabaseClient = sb;
  var UN = (window.UN = window.UN || {});
  UN.sb = sb;

  function isUrl(v) { return typeof v === 'string' && /^https:\/\//i.test(v); }
  function digits(v) { return String(v || '').replace(/[^0-9]/g, ''); }

  function apply(c) {
    document.querySelectorAll('[data-c]').forEach(function (el) {
      var v = c[el.getAttribute('data-c')];
      if (typeof v !== 'string' || !v.trim()) return;
      el.textContent = v.trim();
      var pre = el.getAttribute('data-pre');
      if (pre && el.tagName === 'A') el.setAttribute('href', pre + (pre === 'tel:' ? v.replace(/[^0-9+]/g, '') : v.trim()));
    });
    document.querySelectorAll('[data-social]').forEach(function (el) {
      var v = c[el.getAttribute('data-social')];
      if (isUrl(v)) { el.setAttribute('href', v); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
      else { el.style.display = 'none'; }
    });
    chatButtons(c);
  }

  function chatButtons(c) {
    var wa = digits(c.whatsapp), vb = digits(c.viber);
    if (!wa && !vb) return;
    var box = document.createElement('div');
    box.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:900;display:flex;flex-direction:column;gap:10px;';
    function btn(label, href, bg, icon) {
      var a = document.createElement('a');
      a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', label);
      a.style.cssText = 'width:54px;height:54px;border-radius:50%;background:' + bg + ';color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.35);font:800 13px Manrope,sans-serif;text-decoration:none;';
      a.textContent = icon; box.appendChild(a);
    }
    if (wa) btn('Chat on WhatsApp', 'https://wa.me/' + wa, '#25D366', 'WA');
    if (vb) btn('Chat on Viber', 'viber://chat?number=%2B' + vb, '#7360F2', 'Vb');
    document.body.appendChild(box);
  }

  // Looping intro video inside the big card on the home page (set in admin > Site content)
  function drawHeroVideo(v) {
    var panel = document.querySelector('.hero-panel');
    if (!panel || !v || !isUrl(v.url)) return;
    var inner = panel.querySelector('.hero-panel-inner'); if (inner) inner.style.display = 'none';
    var path = panel.querySelector('.flight-path'); if (path) path.style.display = 'none';
    var vid = document.createElement('video');
    vid.className = 'hero-loop'; vid.src = v.url; vid.muted = true; vid.defaultMuted = true; vid.loop = true; vid.autoplay = true;
    vid.setAttribute('playsinline', ''); vid.setAttribute('muted', ''); vid.setAttribute('preload', 'auto'); vid.setAttribute('aria-label', 'Udaan Nepal intro video');
    vid.disablePictureInPicture = true;
    panel.insertBefore(vid, panel.firstChild);
    var go = function () { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); };
    go(); document.addEventListener('visibilitychange', function () { if (!document.hidden) go(); });
  }

  // "Our Members" scrolling strip (hidden until staff add people)
  function drawMembers(list) {
    var sec = document.getElementById('sec-members'), track = document.getElementById('membersTrack');
    if (!sec || !track) return;
    var items = (list || []).filter(function (m) { return m && m.name; });
    if (!items.length) return;
    var set = items.slice(); while (set.length < 6) set = set.concat(items);
    function card(m, dup) {
      var c = document.createElement('div'); c.className = 'member-card' + (dup ? ' dup' : '');
      if (dup) c.setAttribute('aria-hidden', 'true');
      var ph = document.createElement('div'); ph.className = 'member-photo';
      if (isUrl(m.photo_url)) { var im = document.createElement('img'); im.src = m.photo_url; im.alt = dup ? '' : m.name; im.loading = 'lazy'; ph.appendChild(im); }
      else ph.textContent = m.name.replace(/^(Er\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
      var h3 = document.createElement('h3'); h3.textContent = m.name; c.appendChild(ph); c.appendChild(h3);
      if (m.role) { var r = document.createElement('span'); r.className = 'member-role'; r.textContent = m.role; c.appendChild(r); }
      if (m.details) { var p = document.createElement('p'); p.textContent = m.details; c.appendChild(p); }
      return c;
    }
    track.textContent = '';
    set.forEach(function (m) { track.appendChild(card(m, false)); });
    set.forEach(function (m) { track.appendChild(card(m, true)); });
    track.style.setProperty('--dur', Math.max(24, set.length * 6) + 's');
    var mq = document.getElementById('membersMarquee');
    ['touchstart', 'pointerdown'].forEach(function (ev) { mq.addEventListener(ev, function () { mq.classList.add('paused'); }, { passive: true }); });
    ['touchend', 'pointerup', 'pointercancel'].forEach(function (ev) { mq.addEventListener(ev, function () { setTimeout(function () { mq.classList.remove('paused'); }, 1500); }, { passive: true }); });
    sec.style.display = '';
  }

  // Leadership cards on the home page (replaced only when staff have saved a list)
  function drawFounders(list) {
    var grid = document.querySelector('.founders-grid');
    if (!grid || !list || !list.length) return;
    grid.textContent = '';
    list.forEach(function (f) {
      if (!f || !f.name) return;
      var card = document.createElement('div'); card.className = 'founder-card';
      var ph = document.createElement('div'); ph.className = 'founder-photo';
      if (isUrl(f.photo_url)) { var im = document.createElement('img'); im.src = f.photo_url; im.alt = f.name; im.loading = 'lazy'; im.style.cssText = 'width:100%;height:100%;object-fit:cover;'; ph.appendChild(im); }
      else { var sp = document.createElement('span'); sp.className = 'initials'; sp.textContent = f.name.replace(/^(Er\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase(); ph.appendChild(sp); }
      var body = document.createElement('div'); body.className = 'founder-body';
      var h3 = document.createElement('h3'); h3.textContent = f.name;
      var role = document.createElement('span'); role.className = 'founder-role'; role.textContent = f.role || '';
      var p = document.createElement('p'); p.textContent = f.bio || '';
      body.appendChild(h3); body.appendChild(role); body.appendChild(p); card.appendChild(ph); card.appendChild(body); grid.appendChild(card);
    });
  }

  // Photo sections: <section data-gallery="key"> stays hidden until real photos are added in the admin page
  function drawGalleries(lists) {
    document.querySelectorAll('[data-gallery]').forEach(function (sec) {
      var list = (lists[sec.getAttribute('data-gallery')] || []).filter(function (x) { return x && isUrl(x.url); });
      if (!list.length) return;
      var grid = sec.querySelector('.showcase-grid'); if (!grid) return;
      grid.textContent = ''; grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(240px,1fr))'; grid.style.gridAutoRows = '200px';
      list.forEach(function (x) {
        var d = document.createElement('div'); d.className = 'showcase-tile'; d.style.cssText = 'position:relative;overflow:hidden;padding:0;';
        var im = document.createElement('img'); im.src = x.url; im.alt = x.caption || ''; im.loading = 'lazy'; im.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
        d.appendChild(im);
        if (x.caption) { var c = document.createElement('span'); c.className = 'showcase-cap'; c.textContent = x.caption; d.appendChild(c); }
        grid.appendChild(d);
      });
      sec.style.display = '';
    });
  }

  // Greeting / wishes bar (set in admin > Site content). Only on pages whose <body> has data-greeting.
  // Scrolling text strip. On pages with a fixed header it sits just below the header (over the
  // empty space above the page content), so nothing on the page is pushed down or jumps.
  function drawGreeting(g) {
    if (!document.body.hasAttribute('data-greeting') || !g || g.enabled !== true) return;
    var ne = (g.text_ne || '').trim(), en = (g.text || '').trim();
    if (!ne && !en) return;
    if (g.until && new Date(g.until + 'T23:59:59').getTime() < Date.now()) return;
    var key = 'un-greet-' + (ne + en).length;
    try { if (sessionStorage.getItem(key)) return; } catch (e) {}
    if (!document.getElementById('un-greet-css')) {
      var st = document.createElement('style'); st.id = 'un-greet-css';
      st.textContent = '@keyframes unGreetMove{to{transform:translateX(-50%)}}' +
        '.un-greet-track{display:flex;width:max-content;animation:unGreetMove 60s linear infinite}' +
        '.un-greet:hover .un-greet-track{animation-play-state:paused}' +
        '@media (prefers-reduced-motion:reduce){.un-greet-track{animation:none}.un-greet-group+.un-greet-group{display:none}.un-greet{overflow-x:auto!important}}';
      document.head.appendChild(st);
    }
    function item() {
      var s = document.createElement('span'); s.className = 'un-greet-item';
      s.style.cssText = 'white-space:nowrap;padding-right:64px;';
      if (ne) { var a = document.createElement('span'); a.lang = 'ne'; a.textContent = ne; s.appendChild(a); }
      if (ne && en) s.appendChild(document.createTextNode('  •  '));
      if (en) { var b = document.createElement('span'); b.textContent = en; s.appendChild(b); }
      return s;
    }
    var hdr = document.querySelector('.navbar, .site-header');
    var fixedHdr = !!hdr && getComputedStyle(hdr).position === 'fixed';
    var bar = document.createElement('div');
    bar.className = 'un-greet'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Greeting');
    bar.style.cssText = 'background:linear-gradient(90deg,#F59E0B,#F97316);color:#0A1428;overflow:hidden;font:600 14px Manrope,sans-serif;line-height:40px;height:40px;z-index:850;' +
      (fixedHdr ? 'position:absolute;left:0;right:0;top:' + hdr.offsetHeight + 'px;' : 'position:relative;');
    var track = document.createElement('div'); track.className = 'un-greet-track';
    var g1 = document.createElement('div'); g1.className = 'un-greet-group'; g1.style.cssText = 'display:flex;flex:none;';
    g1.appendChild(item()); track.appendChild(g1); bar.appendChild(track);
    var x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Close');
    x.style.cssText = 'position:absolute;right:0;top:0;width:56px;height:40px;padding:0 0 0 12px;background:linear-gradient(90deg,rgba(249,115,22,0),#F97316 45%);border:0;font-size:24px;line-height:40px;cursor:pointer;color:#0A1428;';
    x.onclick = function () { bar.remove(); try { sessionStorage.setItem(key, '1'); } catch (e) {} };
    bar.appendChild(x);
    document.body.insertBefore(bar, document.body.firstChild);
    // repeat the message enough times that the loop never shows a gap, then loop two identical copies
    var iw = g1.firstChild.offsetWidth || 300;
    for (var i = 1; i < Math.ceil(1920 / iw) + 1; i++) g1.appendChild(item());
    var g2 = g1.cloneNode(true); g2.setAttribute('aria-hidden', 'true'); track.appendChild(g2);
    track.style.animationDuration = Math.max(20, Math.round(g1.offsetWidth / 70)) + 's';
    if (fixedHdr) window.addEventListener('resize', function () { bar.style.top = hdr.offsetHeight + 'px'; });
  }

  // Logo (set in admin > Site content). Replaces the "U" square in every header and footer, and the browser-tab icon.
  function drawLogo(l) {
    if (!l || !isUrl(l.url)) return;
    document.querySelectorAll('.brand-mark').forEach(function (m) {
      var im = document.createElement('img'); im.src = l.url; im.alt = 'Udaan Nepal logo';
      im.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;';
      m.textContent = ''; m.appendChild(im);
      m.style.background = 'transparent'; m.style.boxShadow = 'none'; m.style.padding = '0'; m.style.overflow = 'hidden'; m.style.border = '0';
    });
    try {
      var ic = document.querySelector('link[rel~="icon"]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon' }));
      ic.href = l.url;
    } catch (e) {}
  }

  // Is a program's registration open? (the database enforces this too)
  UN.registrationState = function (program) {
    var r = (UN.registration || {})[program] || {};
    var open = r.open !== false;
    if (open && r.deadline && new Date(r.deadline).getTime() < Date.now()) open = false;
    return { open: open, message: r.message || '', deadline: r.deadline || null };
  };

  // Used by the contact forms on the home page and the UNIF page
  UN.sendMessage = function (m) {
    return sb.from('contact_messages').insert({
      source: m.source, full_name: m.name, email: m.email || null, phone: m.phone || null,
      subject: m.subject || null, message: m.message
    });
  };

  Promise.all([
    sb.from('site_settings').select('key,value').in('key', ['contact_info', 'unif_content', 'unsmp_content', 'features', 'registration', 'home_content', 'founders', 'practify_content', 'studio_page', 'courses_page', 'auth_page', 'notices_page', 'unif_projects', 'unif_sponsors', 'studio_gallery', 'practify_gallery', 'unsmp_gallery', 'greeting_banner', 'site_logo', 'hero_video', 'members']),
    sb.from('testimonials').select('name,role,quote').eq('is_published', true).order('sort_order').order('created_at')
  ]).then(function (res) {
    var logo = {}, c = {}, features = { group_chat: false, parent_suggest: false, quiz: true }, registration = {}, founders = [], lists = {}, greeting = {}, heroVideo = {}, members = [];
    ((res[0] && res[0].data) || []).forEach(function (row) {
      if (row.key === 'features') features = Object.assign(features, row.value || {});
      else if (row.key === 'registration') registration = row.value || {};
      else if (row.key === 'greeting_banner') greeting = row.value || {};
      else if (row.key === 'site_logo') logo = row.value || {};
      else if (row.key === 'founders') founders = (row.value && row.value.list) || [];
      else if (row.key === 'hero_video') heroVideo = row.value || {};
      else if (row.key === 'members') members = (row.value && row.value.list) || [];
      else if (/^(unif_projects|unif_sponsors|studio_gallery|practify_gallery|unsmp_gallery)$/.test(row.key)) lists[row.key] = (row.value && row.value.list) || [];
      else Object.assign(c, row.value || {});
    });
    UN.lists = lists; UN.content = c; UN.features = features; UN.registration = registration;
    document.querySelectorAll('[data-feature]').forEach(function (el) {
      if (features[el.getAttribute('data-feature')] === true) el.style.display = '';
    });
    UN.testimonials = (res[1] && res[1].data) || [];
    apply(c);
    drawGreeting(greeting);
    drawLogo(logo);
    drawFounders(founders);
    drawHeroVideo(heroVideo);
    drawMembers(members);
    drawGalleries(lists);
    document.dispatchEvent(new CustomEvent('un-content', { detail: { content: c, testimonials: UN.testimonials, features: features, registration: registration, lists: lists } }));
  }).catch(function () {
    UN.testimonials = []; UN.features = { group_chat: false, parent_suggest: false, quiz: true }; UN.registration = {}; UN.lists = {};
    document.dispatchEvent(new CustomEvent('un-content', { detail: { content: {}, testimonials: [], features: UN.features, registration: {} } }));
  });
})();
