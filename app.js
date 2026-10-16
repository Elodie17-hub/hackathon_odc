'use strict';
/* =====================================================================
   MammoData — application (routage, vues, graphiques, formulaires)
   ===================================================================== */

/* ---------- Profils et navigation ---------- */
const ROLES = {
  agent: { label: 'Agent de santé', nav: ['dashboard', 'patients', 'suivi'], scope: 'centre', create: true },
  responsable: { label: 'Responsable de centre', nav: ['dashboard', 'patients', 'suivi', 'stats', 'centres'], scope: 'centre', create: true },
  regional: { label: 'Responsable régional / national', nav: ['dashboard', 'patients', 'suivi', 'stats', 'centres'], scope: 'all', create: false },
  admin: { label: 'Administrateur', nav: ['dashboard', 'centres', 'utilisateurs'], scope: 'all', create: false }
};
const NAV = [
  { k: 'dashboard', l: 'Tableau de bord', i: 'home' },
  { k: 'patients', l: 'Patient(e)s', i: 'users' },
  { k: 'suivi', l: 'Suivi & rappels', i: 'calendar' },
  { k: 'stats', l: 'Statistiques', i: 'chart' },
  { k: 'centres', l: 'Centres de santé', i: 'building' },
  { k: 'utilisateurs', l: 'Utilisateurs & audit', i: 'shield' }
];
const DEMO = { agent: 'u1', responsable: 'u2', regional: 'u3', admin: 'u4' };
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const state = {
  dash: { period: 12, region: '' },
  pl: { q: '', statut: '', centre: '', periode: '', page: 1 },
  sv: { q: '', statut: '', centre: '', n: 15 },
  st: { period: 12, region: '', metric: 'dep' },
  fiche: { tab: 'resume', last: null },
  au: { filter: '' }
};
let draft = null;
const role = () => ROLES[session.role];
const scoped = () => role().scope === 'all' ? DB.patients : DB.patients.filter(p => p.consultations.some(c => c.centre === session.centre));

/* ---------- Icônes ---------- */
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><path d="M17 4a4 4 0 010 8M22 21c0-3-2-5.500-5-6.500"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>',
  file: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8M9 17h8"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  building: '<path d="M4 21V4h10v17M14 9h6v12M2 21h20M8 8h2M8 12h2M8 16h2"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.500 9-8 11-4.500-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
  logout: '<path d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  bell: '<path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  print: '<path d="M6 9V2h12v7M6 18H4v-7h16v7h-2M6 14h12v8H6z"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chev: '<path d="M9 6l6 6-6 6"/>'
};
const ico = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- Logo ---------- */
function logoSvg(size = 50) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lgr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F78DB0"/><stop offset="1" stop-color="#EC4083"/></linearGradient></defs>
  <path d="M26 5c-11 5-13 22-2 31s17 14 9 22c15-3 20-20 7-31S22 21 26 5z" fill="url(#lgr)"/>
  <ellipse cx="42" cy="30" rx="12" ry="4.500" fill="#6B52B8"/><path d="M30 30v18c0 2.500 5.400 4.500 12 4.500S54 50.500 54 48V30c0 2.500-5.400 4.500-12 4.500S30 32.500 30 30z" fill="#4B3B9A"/></svg>`;
}
const LOGO_SRC = 'assets/logo.jpeg'; // ← adapte au nom réel de ton fichier
function logoSvg(size = 50) {
  return `<span class="logo-tile" style="width:${size}px;height:${size}px"><img src="${LOGO_SRC}" alt="Logo MammoData"></span>`;
}
const brandImg = () => `<div class="login-brand"><img src="${LOGO_SRC}" alt="Logo MammoData"><div><b>Mammo<span>Data</span></b><small>Registre numérique du cancer du sein</small></div></div>`;
/* ---------- Toasts, modale ---------- */
function toast(msg, type = 'ok') {
  const t = document.createElement('div'); t.className = 'toast ' + type; t.innerHTML = `${ico(type === 'ok' ? 'check' : 'alert')}<span>${esc(msg)}</span>`;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 4200);
}
function openModal(title, body, footer = '', closable = true) {
  const m = $('#modal'); m.hidden = false; m.dataset.closable = closable ? '1' : '';
  m.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h3 style="margin:0">${esc(title)}</h3>${closable ? `<button class="icon-btn" data-act="close-modal" aria-label="Fermer">${ico('x')}</button>` : ''}</header><div class="body">${body}</div>${footer ? `<footer>${footer}</footer>` : ''}</div>`;
}
const closeModal = () => { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; };

/* ---------- Session ---------- */
function loadSession() { try { session = JSON.parse(sessionStorage.getItem('md.session')); } catch (e) { session = null; } }
let idleTimer = null;
function resetIdle() { clearTimeout(idleTimer); if (!session) return; idleTimer = setTimeout(sessionExpired, 20 * 60 * 1000); }
function sessionExpired() {
  openModal('Session expirée', `<div class="empty-state" style="padding:10px"><div class="art">${ico('lock')}</div><h3>Votre session a expiré</h3><p>Pour protéger les données des patientes, vous avez été déconnecté(e) après une période d'inactivité.</p></div>`, `<button class="btn accent" data-act="logout">Se reconnecter</button>`, false);
}
function logout() { if (session) audit('Déconnexion', ''); sessionStorage.removeItem('md.session'); session = null; clearTimeout(idleTimer); closeModal(); location.hash = ''; render(); }

/* ---------- Gabarits communs ---------- */
const head = (t, sub, actions = '') => `<div class="page-head"><div><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="row">${actions}</div></div>`;
const skeleton = () => `<div class="grid g4" style="margin-bottom:18px">${'<div class="skel" style="height:88px"></div>'.repeat(4)}</div><div class="grid g-21"><div class="skel" style="height:300px"></div><div class="skel" style="height:300px"></div></div>`;
const emptyState = (icon, title, text, action = '') => `<div class="empty-state"><div class="art">${ico(icon)}</div><h3>${title}</h3><p>${text}</p>${action}</div>`;
const optList = (arr, cur, all) => (all ? `<option value="">${all}</option>` : '') + arr.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(cur) === String(v) ? ' selected' : ''}>${esc(l)}</option>`; }).join('');

/* ---------- Graphiques SVG ---------- */
const topMax = v => Math.max(4, Math.ceil(v / 4) * 4);
function lineChart(labels, series) {
  const W = 640, H = 260, L = 38, R = 14, T = 14, B = 30; const max = topMax(Math.max(1, ...series.flatMap(s => s.values)));
  const x = i => L + (labels.length === 1 ? 0 : i * (W - L - R) / (labels.length - 1)); const y = v => T + (H - T - B) * (1 - v / max);
  let g = '';
  for (let k = 0; k <= 4; k++) { const v = max * k / 4; g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${L - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${Math.round(v)}</text>`; }
  labels.forEach((l, i) => g += `<text x="${x(i)}" y="${H - 8}" class="ax" text-anchor="middle">${l}</text>`);
  series.forEach(s => {
    g += `<polyline points="${s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round"/>`;
    s.values.forEach((v, i) => g += `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="#fff" stroke="${s.color}" stroke-width="2"><title>${s.name} : ${v}</title></circle>`);
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Courbe d'évolution mensuelle">${g}</svg>`;
}
function groupedBars(labels, series) {
  const W = 420, H = 260, L = 34, R = 8, T = 14, B = 30; const max = topMax(Math.max(1, ...series.flatMap(s => s.values)));
  const gw = (W - L - R) / labels.length; const bw = Math.min(22, gw / (series.length + 1)); const y = v => T + (H - T - B) * (1 - v / max);
  let g = '';
  for (let k = 0; k <= 4; k++) { const v = max * k / 4; g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${L - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${Math.round(v)}</text>`; }
  labels.forEach((l, i) => {
    const cx = L + gw * i + gw / 2; g += `<text x="${cx}" y="${H - 8}" class="ax" text-anchor="middle">${l}</text>`;
    series.forEach((s, j) => { const bx = cx - (series.length * bw) / 2 + j * bw; g += `<rect x="${bx}" y="${y(s.values[i])}" width="${bw - 2}" height="${H - B - y(s.values[i])}" rx="4" fill="${s.color}"><title>${s.name} : ${s.values[i]}</title></rect>`; });
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Répartition par tranche d'âge">${g}</svg>`;
}
const DONUT_COLORS = ['#2E2A78', '#EC4083', '#625F9A', '#F28DB5', '#9794BC', '#B8266A', '#4B47A0', '#F7B6D0', '#7A3E9D', '#C0BFD7', '#D94F8C', '#3A5BA0', '#8E7CC3'];
function donutChart(map) {
  const entries = Object.entries(map).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, n]) => s + n, 0);
  if (!total) return '<p class="muted">Aucune donnée.</p>';
  const R = 70, C = 2 * Math.PI * R; let off = 0, arcs = '';
  entries.forEach(([k, n], i) => {
    const len = n / total * C;
    arcs += `<circle cx="100" cy="100" r="${R}" fill="none" stroke="${DONUT_COLORS[i % DONUT_COLORS.length]}" stroke-width="30" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)"><title>${esc(k)} : ${n}</title></circle>`;
    off += len;
  });
  const legend = entries.map(([k, n], i) => `<li><i style="background:${DONUT_COLORS[i % DONUT_COLORS.length]}"></i><span>${esc(k)}</span><b>${nf(n)} <small>${(n / total * 100).toFixed(0)} %</small></b></li>`).join('');
  return `<div class="donut-wrap"><svg viewBox="0 0 200 200" class="donut" role="img" aria-label="Répartition par région">${arcs}<text x="100" y="104" text-anchor="middle" class="d-val">${nf(total)}</text><text x="100" y="122" text-anchor="middle" class="d-lab">dépistages</text></svg><ul class="donut-legend">${legend}</ul></div>`;
}
const TILE_POS = { 'Nord': [1, 0], 'Sahel': [2, 0], 'Boucle du Mouhoun': [0, 1], 'Centre-Nord': [2, 1], 'Plateau-Central': [3, 1], 'Est': [4, 1], 'Hauts-Bassins': [0, 2], 'Centre-Ouest': [1, 2], 'Centre': [2, 2], 'Centre-Est': [3, 2], 'Cascades': [0, 3], 'Sud-Ouest': [1, 3], 'Centre-Sud': [2, 3] };
/* ---------- Carte du Burkina Faso (tracés dans bf-map.js) ---------- */
const MAP_STEPS = ['#E0DFEB', '#C0BFD7', '#9794BC', '#625F9A', '#2E2A78'];
function bfMap(values, f = v => v, label = '') {
  const max = Math.max(1, ...Object.values(values));
  const lvl = v => v ? Math.ceil(v / max * 4) : 0;
  const regs = Object.entries(BF_MAP.regions);
  const paths = regs.map(([n, r]) => { const v = values[n] || 0; return `<path class="bf-reg" d="${r.d}" fill="${MAP_STEPS[lvl(v)]}" data-name="${esc(n)}" data-val="${esc(f(v))}" data-label="${esc(label)}"/>`; }).join('');
  const labs = regs.map(([n, r]) => { const v = values[n] || 0; return `<text class="bf-lab" x="${r.cx}" y="${r.cy}" fill="${lvl(v) >= 3 ? '#fff' : '#1F1B4D'}">${esc(f(v))}</text>`; }).join('');
  return `<div class="bf-map"><svg viewBox="${BF_MAP.viewBox}" role="img" aria-label="Carte du Burkina Faso par région">${paths}<path class="bf-hl" d=""/>${labs}</svg><div class="maptip" hidden></div></div>
  <div class="scale"><span>Faible</span>${MAP_STEPS.map(c => `<i style="background:${c}"></i>`).join('')}<span>Élevé</span></div>
  <p class="muted small" style="margin:8px 0 0">Survolez une région pour voir le détail.</p>`;
}
let mapTip = null;
document.addEventListener('mousemove', e => {
  const r = e.target.closest && e.target.closest('.bf-reg');
  if (!r) { if (mapTip) { mapTip.tip.hidden = true; mapTip.hl.setAttribute('d', ''); mapTip = null; } return; }
  const box = r.closest('.bf-map'), tip = $('.maptip', box), hl = $('.bf-hl', box), b = box.getBoundingClientRect();
  mapTip = { tip, hl }; hl.setAttribute('d', r.getAttribute('d'));
  tip.innerHTML = `<b>${esc(r.dataset.name)}</b><span>${esc(r.dataset.label)} : <strong>${esc(r.dataset.val)}</strong></span>`;
  tip.hidden = false;
  tip.style.left = Math.max(0, Math.min(e.clientX - b.left + 14, b.width - tip.offsetWidth - 4)) + 'px';
  tip.style.top = (e.clientY - b.top + 14) + 'px';
});
function monthsBack(n) { const out = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1); out.push({ key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: MOIS[d.getMonth()] }); } return out; }
const AGE_GROUPS = [['< 30', 0, 29], ['30-39', 30, 39], ['40-49', 40, 49], ['50-59', 50, 59], ['60 +', 60, 200]];

/* ---------- Données agrégées ---------- */
function filterByPeriod(list, months, region) {
  const cut = addDays(TODAY, -months * 30.4);
  return list.filter(p => new Date(p.consultations[0].date) >= cut && (!region || p.region === region));
}
function kpis(list) {
  const cases = list.filter(isCase);
  return { dep: list.length, sus: list.filter(p => p.statut === 'suspect').length, cas: cases.length, pos: pct(cases.length, list.length), trt: list.filter(p => p.statut === 'traitement').length, per: list.filter(p => p.statut === 'perdue').length };
}
function byRegion(list, fn) { const o = {}; REGIONS.forEach(r => o[r] = 0); list.forEach(p => { if (fn(p)) o[p.region]++; }); return o; }

/* =====================================================================
   VUES
   ===================================================================== */
const VIEWS = {};

/* ---------- Connexion ---------- */
function renderLogin(err = '') {
  $('#root').innerHTML = `<div class="login">
    <div class="login-art"><span class="orbit o1"></span><span class="orbit o2"></span>
      <div style="position:relative"><div style="margin-bottom:30px">${logoSvg(64)}</div>
      <h2>Centraliser les données pour mieux dépister et mieux soigner.</h2>
      <p>Un registre numérique unique, alimenté à chaque consultation dans tous les centres de santé, pour piloter la lutte contre le cancer du sein.</p>
      <ul><li>${ico('shield')} Accès réservé au personnel de santé habilité</li><li>${ico('activity')} Indicateurs nationaux en temps réel</li><li>${ico('lock')} Toutes les actions sont journalisées</li></ul></div></div>
    <div class="login-card"><div>${brandImg()}</div>
      <h1>Connexion</h1><p class="muted" style="margin:4px 0 0">Identifiez-vous avec vos accès professionnels.</p>
      <form id="login-form" novalidate>
        ${err ? `<div class="alert err" role="alert">${ico('alert')}<span>${esc(err)}</span></div>` : ''}
        <div class="fld"><label for="lg-id">Identifiant professionnel</label><input id="lg-id" autocomplete="username" placeholder="ex. a.sawadogo"></div>
        <div class="fld"><label for="lg-pw">Mot de passe</label><input id="lg-pw" type="password" autocomplete="current-password" placeholder="••••••••"></div>
                <div class="fld"><label for="lg-role">Profil de démonstration</label><select id="lg-role">${optList(Object.keys(ROLES).map(k => [k, ROLES[k].label]), 'agent')}</select></div>
        <button class="btn accent" type="submit" style="justify-content:center">Se connecter</button>
        <div class="secure-note">${ico('lock')}<span>Accès réservé au personnel de santé autorisé.</span></div>
      </form></div></div>`;
  $('#lg-id').focus();
}
function submitLogin(e) {
  e.preventDefault();
   const id = $('#lg-id').value.trim(), pw = $('#lg-pw').value, rl = $('#lg-role').value;
  if (!id || !pw) return renderLogin('Veuillez renseigner tous les champs.');
  if (pw.length < 6) return renderLogin('Le mot de passe doit contenir au moins 6 caractères.');
  const u = DB.users.find(x => x.id === DEMO[rl]);
  session = { userId: u.id, name: u.nom, role: u.role, centre: u.centre };
  sessionStorage.setItem('md.session', JSON.stringify(session));
  audit('Connexion', ROLES[u.role].label); resetIdle();
  location.hash = '#/dashboard'; render();
}
const TICKER = [
  'Données de santé confidentielles : accès réservé au personnel de santé autorisé',
  'Toutes les actions sont journalisées',
  'Vérifiez l\'existence d\'un dossier avant d\'en créer un nouveau',
  'Octobre Rose : un dépistage précoce sauve des vies'
];
const tickerHtml = () => { const g = TICKER.map(t => `<span>${ico('lock')}${esc(t)}</span>`).join(''); return `<div class="ticker" role="status" aria-label="Annonces"><div class="ticker-track"><div class="tk-group">${g}</div><div class="tk-group" aria-hidden="true">${g}</div></div></div>`; };
/* ---------- Coque de l'application ---------- */
function buildShell() {
  const r = role(), nb = scoped().filter(p => p.statut === 'suspect').length;
  $('#root').innerHTML = `<div class="app">
    <aside class="sidebar" id="sidebar"><div class="brand">${logoSvg(38)}<b>Mammo<span>Data</span><small>Registre numérique du cancer du sein</small></b></div>
      <nav class="nav" aria-label="Navigation principale">${NAV.filter(n => r.nav.includes(n.k)).map(n => `<a href="#/${n.k}" data-k="${n.k}">${ico(n.i)}<span>${n.l}</span></a>`).join('')}</nav>
      <div class="side-foot">${ico('lock')}<span>Données de santé confidentielles. Chaque accès est enregistré.</span></div></aside>
    <div class="scrim" id="scrim" data-act="close-side"></div>
    <div class="main">
      <header class="topbar"><button class="icon-btn menu-btn" data-act="open-side" aria-label="Menu">${ico('menu')}</button>
        ${r.nav.includes('patients') ? `<div class="search">${ico('search')}<input id="g-search" placeholder="Rechercher une patiente, un n° de dossier…" aria-label="Recherche globale"></div>` : '<div style="flex:1"></div>'}
        <div style="flex:1"></div>
        <span class="chip centre">${ico('building')}${esc(r.scope === 'all' ? 'Niveau national' : centreName(session.centre))}</span>
        ${r.nav.includes('suivi') ? `<button class="icon-btn" data-act="goto" data-to="#/suivi" aria-label="Alertes">${ico('bell')}${nb ? `<span class="dot">${nb > 99 ? '99+' : nb}</span>` : ''}</button>` : ''}
        <div class="profile"><button data-act="profile" aria-haspopup="true"><span class="avatar">${esc(initials(session.name.replace(/^Dr\s/, '')))}</span><span class="pmeta"><b>${esc(session.name)}</b><span>${r.label}</span></span></button>
          <div class="dropdown" id="pmenu" hidden><button data-act="expire">${ico('clock')} Simuler l'expiration de session</button><button data-act="reset">${ico('activity')} Réinitialiser les données de démo</button><button data-act="logout">${ico('logout')} Se déconnecter</button></div></div>
      </header>
            ${tickerHtml()}
      <main class="content" id="view" tabindex="-1"></main></div></div>`;
}
let renderToken = 0;
function render() {
  if (!session) return renderLogin();
  if (!$('#view')) buildShell();
  const r = parseRoute();
  if (!VIEWS[r.name]) { location.hash = '#/dashboard'; return; }
  const key = r.name;
  if (!role().nav.includes(key)) { toast('Accès non autorisé pour votre profil.', 'err'); location.hash = '#/dashboard'; return; }
  if (key === 'patients' && r.id === 'new' && !role().create) { toast('Votre profil ne permet pas de créer un dossier.', 'err'); location.hash = '#/patients'; return; }
  $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.k === key));
  closeSide();
  const v = $('#view'); v.innerHTML = skeleton(); window.scrollTo(0, 0);
  const tk = ++renderToken;
  setTimeout(() => {
    if (tk !== renderToken) return;
    try { VIEWS[key](r, v); } catch (e) { console.error(e); v.innerHTML = `<div class="card">${emptyState('alert', 'Une erreur est survenue', 'Impossible d\'afficher cette page. Réessayez ou revenez au tableau de bord.', '<a class="btn" href="#/dashboard">Retour au tableau de bord</a>')}</div>`; }
  }, 160);
}
function refresh() { const r = parseRoute(); if (VIEWS[r.name]) VIEWS[r.name](r, $('#view')); }
function parseRoute() { const h = (location.hash || '').replace(/^#\/?/, ''); const [a, b] = h.split('/'); return { name: a || 'dashboard', id: b ? decodeURIComponent(b) : null }; }
const openSide = () => { $('#sidebar')?.classList.add('open'); $('#scrim')?.classList.add('open'); };
const closeSide = () => { $('#sidebar')?.classList.remove('open'); $('#scrim')?.classList.remove('open'); };

/* ---------- Tableau de bord ---------- */
VIEWS.dashboard = (r, v) => {
  const f = state.dash, all = role().scope === 'all';
  const list = filterByPeriod(scoped(), f.period, all ? f.region : '');
  const k = kpis(list);
  const months = monthsBack(f.period >= 12 ? 12 : f.period === 6 ? 6 : 3);
  const dep = months.map(m => list.filter(p => p.consultations[0].date.startsWith(m.key)).length);
  const cas = months.map(m => list.filter(p => isCase(p) && p.consultations[0].date.startsWith(m.key)).length);
  const ageDep = AGE_GROUPS.map(([, a, b]) => list.filter(p => { const x = ageOf(p.naissance); return x >= a && x <= b; }).length);
  const ageCas = AGE_GROUPS.map(([, a, b]) => list.filter(p => { const x = ageOf(p.naissance); return isCase(p) && x >= a && x <= b; }).length);
  const regVals = byRegion(list, () => true);
  const cc = {}; list.forEach(p => cc[p.centre] = (cc[p.centre] || 0) + 1);
  const top = Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 5); const topMaxV = top.length ? top[0][1] : 1;
  const card = (cls, icn, val, lab, hero = '') => `<div class="card kpi ${hero}"><div class="ic ${cls}">${ico(icn)}</div><div><b>${val}</b><span>${lab}</span></div></div>`;
  v.innerHTML = `${head('Tableau de bord', all ? 'Vue d\'ensemble nationale du dépistage et des cas de cancer du sein' : `Activité de ${esc(centreName(session.centre))}`)}
  <div class="card filters flat"><b style="color:var(--indigo)">Filtres</b>
    <select data-f="dash.period" data-num aria-label="Période">${optList([[3, '3 derniers mois'], [6, '6 derniers mois'], [12, '12 derniers mois']], f.period)}</select>
    ${all ? `<select data-f="dash.region" aria-label="Région">${optList(REGIONS, f.region, 'Toutes les régions')}</select>` : ''}
    <span class="muted small">${nf(list.length)} dossier(s) sur la période</span></div>
  ${list.length === 0 ? `<div class="card">${emptyState('chart', 'Aucune donnée sur cette période', 'Modifiez les filtres ou enregistrez de nouveaux dossiers.')}</div>` : `
  <div class="grid g3" style="margin-bottom:18px">
    ${card('rose', 'users', nf(k.dep), 'Patientes dépistées', 'hero')}${card('warn', 'alert', nf(k.sus), 'Cas suspects')}${card('danger', 'activity', nf(k.cas), 'Cas confirmés')}
    ${card('', 'chart', k.pos, 'Taux de positivité')}${card('info', 'shield', nf(k.trt), 'Patientes en traitement')}${card('grey', 'clock', nf(k.per), 'Perdues de vue')}</div>
  <div class="grid g-21" style="margin-bottom:18px">
    <div class="card"><h3>Évolution mensuelle</h3><div class="legend"><span><i style="background:var(--indigo)"></i>Dépistages</span><span><i style="background:var(--rose)"></i>Cas confirmés</span></div>${lineChart(months.map(m => m.label), [{ name: 'Dépistages', color: '#2E2A78', values: dep }, { name: 'Cas confirmés', color: '#EC4083', values: cas }])}</div>
        <div class="card"><h3>Répartition par tranche d'âge</h3><div class="legend"><span><i style="background:var(--indigo)"></i>Dépistées</span><span><i style="background:var(--rose)"></i>Cas</span></div>${groupedBars(AGE_GROUPS.map(g => g[0]), [{ name: 'Dépistées', color: '#2E2A78', values: ageDep }, { name: 'Cas', color: '#EC4083', values: ageCas }])}</div></div>
    <div class="card"><h3>Dépistages par région</h3>${donutChart(regVals)}</div>`}`;
};

/* ---------- Liste des patientes ---------- */
function filteredPatients() {
  const f = state.pl, q = f.q.trim().toLowerCase(), cut = f.periode ? addDays(TODAY, -Number(f.periode)) : null;
  return scoped().filter(p => (!q || `${p.nom} ${p.prenoms} ${p.id} ${p.tel}`.toLowerCase().includes(q)) && (!f.statut || p.statut === f.statut) && (!f.centre || p.consultations.some(c => c.centre === f.centre)) && (!cut || new Date(lastCons(p).date) >= cut))
    .sort((a, b) => lastCons(b).date.localeCompare(lastCons(a).date));
}
function drawPatients() {
  const f = state.pl, list = filteredPatients(), per = 10, pages = Math.max(1, Math.ceil(list.length / per)); if (f.page > pages) f.page = pages;
  const slice = list.slice((f.page - 1) * per, f.page * per);
  $('#plist').innerHTML = list.length === 0 ? emptyState('search', 'Aucun dossier trouvé', 'Aucun dossier ne correspond à votre recherche ou à vos filtres.', '<button class="btn ghost" data-act="reset-filters">Réinitialiser les filtres</button>') :
    `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>N° dossier</th><th>Patiente</th><th>Téléphone</th><th>Centre</th><th>Dernière consultation</th><th>Statut</th><th></th></tr></thead><tbody>${slice.map(p => `<tr data-act="open" data-id="${p.id}" tabindex="0"><td>${p.id}</td><td class="who"><b>${esc(p.nom.toUpperCase())} ${esc(p.prenoms[0])}.</b><span>${ageOf(p.naissance)} ans · ${esc(p.region)}</span></td><td>${maskTel(p.tel)}</td><td>${esc(centreName(p.centre))}</td><td>${fmt(lastCons(p).date)}</td><td>${badge(p.statut)}</td><td>${ico('chev')}</td></tr>`).join('')}</tbody></table></div>
    <div class="pager"><span class="muted small">${(f.page - 1) * per + 1}–${Math.min(f.page * per, list.length)} sur ${list.length}</span><div class="pages"><button data-act="page" data-p="${f.page - 1}" ${f.page === 1 ? 'disabled' : ''} aria-label="Page précédente">‹</button>${Array.from({ length: pages }, (_, i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - f.page) <= 1).map((n, i, a) => (i && n - a[i - 1] > 1 ? '<span style="align-self:center">…</span>' : '') + `<button class="${n === f.page ? 'on' : ''}" data-act="page" data-p="${n}">${n}</button>`).join('')}<button data-act="page" data-p="${f.page + 1}" ${f.page === pages ? 'disabled' : ''} aria-label="Page suivante">›</button></div></div>`;
}
VIEWS.patients = (r, v) => {
  if (r.id === 'new') return viewNew(v);
  if (r.id) return viewFiche(r.id, v);
  const f = state.pl, cs = role().scope === 'all' ? CENTRES : CENTRES.filter(c => scoped().some(p => p.consultations.some(x => x.centre === c.id)));
  v.innerHTML = `${head('Patient(e)s', `${nf(scoped().length)} dossier(s) accessible(s)`, role().create ? `<a class="btn accent" href="#/patients/new">${ico('plus')} Nouveau dossier</a>` : '')}
  <div class="card filters flat"><div class="search">${ico('search')}<input id="pl-q" placeholder="Nom, n° de dossier ou téléphone" value="${esc(f.q)}" aria-label="Rechercher"></div>
    <select data-f="pl.statut" aria-label="Statut">${optList(Object.keys(STATUTS).map(k => [k, STATUTS[k].label]), f.statut, 'Tous les statuts')}</select>
    <select data-f="pl.centre" aria-label="Centre">${optList(cs.map(c => [c.id, c.nom]), f.centre, 'Tous les centres')}</select>
    <select data-f="pl.periode" aria-label="Période">${optList([['30', '30 derniers jours'], ['90', '3 derniers mois'], ['365', '12 derniers mois']], f.periode, 'Toute période')}</select></div>
  <div class="card" id="plist"></div>`;
  drawPatients();
};

/* ---------- Nouveau dossier (formulaire multi-étapes) ---------- */
const STEPS = ['Identification', 'Antécédents', 'Dépistage / examen', 'Diagnostic', 'Prise en charge', 'Récapitulatif'];
function newDraft() {
  return { step: 1, errors: {}, dup: null, dupOk: false, data: { nom: '', prenoms: '', sexe: 'F', naissance: '', tel: '', region: '', localite: '', familial: 'Non', menopause: 'Non', grossesses: '0', allaitement: 'Non', tabac: 'Non', alcool: 'Non', typeConsult: 'Dépistage', autopalpation: 'Oui', examenClinique: '', imagerie: 'Aucune', birads: '', biopsie: 'Non', typeHisto: '', stade: '', hormonal: '', chirurgie: false, chimio: false, radio: false, hormono: false, reference: 'c-yalgado', prochainRdv: '', statut: '', certif: false } };
}
const dv = n => esc(draft.data[n]);
const sel = (n, opts, rr = false, all = '') => `<select data-d="${n}" ${rr ? 'data-rr' : ''}>${optList(opts, draft.data[n], all)}</select>`;
const inp = (n, type = 'text', extra = '') => `<input data-d="${n}" type="${type}" value="${dv(n)}" ${extra}>`;
function fld(label, n, html, req = false, span = 1) { const err = draft.errors[n]; return `<div class="fld${err ? ' bad' : ''}" style="${span > 1 ? 'grid-column:1/-1' : ''}"><label>${label}${req ? '<b class="req">*</b>' : ''}</label>${html}${err ? `<small class="err">${esc(err)}</small>` : ''}</div>`; }
const chk = (n, label) => `<label class="chk"><input type="checkbox" data-d="${n}" data-rr ${draft.data[n] ? 'checked' : ''}> ${label}</label>`;
const YN = ['Non', 'Oui'];
function computeStatut(d) {
  if (d.biopsie === 'Oui' && d.stade) return (d.chirurgie || d.chimio || d.radio || d.hormono) ? 'traitement' : 'confirme';
  if (Number(d.birads) >= 4 || d.examenClinique === 'Anormal') return 'suspect';
  return 'negatif';
}
function stepHtml() {
  const d = draft.data;
  switch (draft.step) {
    case 1: return `<div class="form-grid">${fld('Nom', 'nom', inp('nom', 'text', 'autocomplete="off"'), true)}${fld('Prénoms', 'prenoms', inp('prenoms'), true)}${fld('Sexe', 'sexe', sel('sexe', [['F', 'Féminin'], ['M', 'Masculin']]))}${fld('Date de naissance', 'naissance', inp('naissance', 'date', `max="${iso(TODAY)}"`), true)}${fld('Téléphone', 'tel', inp('tel', 'tel', 'placeholder="70 12 34 56"'), true)}${fld('Région de résidence', 'region', sel('region', REGIONS, false, 'Sélectionner…'), true)}${fld('Localité / adresse', 'localite', inp('localite', 'text', 'placeholder="Secteur, quartier ou village"'), true, 2)}
      <div class="fld" style="grid-column:1/-1"><label>Centre d'enregistrement</label><div class="chip" style="width:fit-content">${ico('building')}${esc(centreName(session.centre))}</div></div></div>
      ${draft.dup ? `<div class="alert warn" style="margin-top:16px" role="alert">${ico('alert')}<div><b>Un dossier existe déjà pour cette personne</b> (${esc(draft.dup.id)}).<div class="row" style="margin-top:8px"><a class="btn sm" href="#/patients/${draft.dup.id}">Ouvrir le dossier existant</a><button class="btn sm ghost" data-act="dup-ok">Continuer quand même</button></div></div></div>` : ''}`;
    case 2: return `<div class="form-grid">${fld('Antécédents familiaux de cancer du sein', 'familial', sel('familial', ['Non', 'Oui', 'Inconnu']))}${fld('Ménopause', 'menopause', sel('menopause', YN))}${fld('Nombre de grossesses', 'grossesses', inp('grossesses', 'number', 'min="0" max="20"'))}${fld('Allaitement', 'allaitement', sel('allaitement', YN))}${fld('Tabac', 'tabac', sel('tabac', ['Non', 'Oui', 'Ancien fumeur']))}${fld('Alcool', 'alcool', sel('alcool', ['Non', 'Occasionnel', 'Régulier']))}</div>`;
    case 3: return `<div class="form-grid">${fld('Type de consultation', 'typeConsult', sel('typeConsult', TYPES_CONSULT))}${fld('Autopalpation', 'autopalpation', sel('autopalpation', ['Oui', 'Non', 'Jamais pratiquée']))}${fld('Examen clinique des seins', 'examenClinique', sel('examenClinique', ['Normal', 'Anormal', 'Non réalisé'], false, 'Sélectionner…'), true)}${fld('Imagerie', 'imagerie', sel('imagerie', ['Aucune', 'Mammographie', 'Échographie', 'Les deux'], true))}${d.imagerie !== 'Aucune' ? fld('Résultat BI-RADS', 'birads', sel('birads', Object.keys(BIRADS).map(k => [k, `${k} — ${BIRADS[k]}`]), false, 'Sélectionner…'), true) : ''}</div>`;
    case 4: return `<div class="form-grid">${fld('Biopsie réalisée', 'biopsie', sel('biopsie', YN, true))}</div>${d.biopsie === 'Oui' ? `<div class="form-grid" style="margin-top:16px">${fld('Type histologique', 'typeHisto', sel('typeHisto', ['Carcinome canalaire infiltrant', 'Carcinome lobulaire infiltrant', 'Carcinome canalaire in situ', 'Autre'], false, 'Sélectionner…'), true)}${fld('Stade', 'stade', sel('stade', Object.keys(TNM).map(k => [k, `Stade ${k} (${TNM[k]})`]), false, 'Sélectionner…'), true)}${fld('Statut hormonal', 'hormonal', sel('hormonal', ['RH+ / HER2−', 'RH+ / HER2+', 'RH− / HER2+', 'Triple négatif', 'Non déterminé'], false, 'Sélectionner…'))}</div>` : `<p class="muted" style="margin-top:16px">Aucune biopsie : cette étape peut être passée si le dépistage est négatif ou si le cas est seulement suspect.</p>`}`;
    case 5: return `<h3 class="sub-title" style="margin-top:0">Traitements engagés</h3><div class="grid g2">${chk('chirurgie', 'Chirurgie')}${chk('chimio', 'Chimiothérapie')}${chk('radio', 'Radiothérapie')}${chk('hormono', 'Hormonothérapie')}</div><div class="form-grid" style="margin-top:18px">${fld('Centre de référence', 'reference', sel('reference', CENTRES.map(c => [c.id, c.nom])))}${fld('Prochain rendez-vous', 'prochainRdv', inp('prochainRdv', 'date', `min="${iso(TODAY)}"`))}</div>`;
    default: {
      const st = d.statut || computeStatut(d);
      return `<div class="grid g2"><div class="card flat"><h3>Identité</h3><dl class="dl"><dt>Nom complet</dt><dd>${esc(d.nom.toUpperCase())} ${esc(d.prenoms)}</dd><dt>Naissance</dt><dd>${fmt(d.naissance)} (${d.naissance ? ageOf(d.naissance) : '—'} ans)</dd><dt>Téléphone</dt><dd>${esc(d.tel)}</dd><dt>Résidence</dt><dd>${esc(d.localite)}, ${esc(d.region)}</dd><dt>Centre</dt><dd>${esc(centreName(session.centre))}</dd></dl></div>
      <div class="card flat"><h3>Examen et diagnostic</h3><dl class="dl"><dt>Consultation</dt><dd>${esc(d.typeConsult)}</dd><dt>Examen clinique</dt><dd>${esc(d.examenClinique)}</dd><dt>Imagerie</dt><dd>${esc(d.imagerie)}${d.birads !== '' ? ` · BI-RADS ${esc(d.birads)}` : ''}</dd><dt>Biopsie</dt><dd>${esc(d.biopsie)}${d.stade ? ` · Stade ${esc(d.stade)}` : ''}</dd><dt>Traitement</dt><dd>${['chirurgie', 'chimio', 'radio', 'hormono'].filter(k => d[k]).map(k => ({ chirurgie: 'Chirurgie', chimio: 'Chimiothérapie', radio: 'Radiothérapie', hormono: 'Hormonothérapie' }[k])).join(', ') || 'Aucun'}</dd></dl></div></div>
      <div class="form-grid" style="margin-top:18px">${fld('Statut du dossier (proposé automatiquement)', 'statut', `<select data-d="statut" data-rr>${optList(Object.keys(STATUTS).map(k => [k, STATUTS[k].label]), st)}</select>`)}<div class="fld"><label>Aperçu</label><div>${badge(st)}</div></div></div>
      <label class="chk" style="margin-top:18px">${'<input type="checkbox" data-d="certif" ' + (d.certif ? 'checked' : '') + '>'} Je certifie l'exactitude des informations saisies.</label>${draft.errors.certif ? `<small class="err" style="color:var(--danger);font-weight:600">${esc(draft.errors.certif)}</small>` : ''}`;
    }
  }
}
function viewNew(v) {
  if (!draft) draft = newDraft();
  v.innerHTML = `${head('Nouveau dossier', 'Enregistrer une patiente et sa première consultation', `<a class="btn ghost" href="#/patients">Annuler</a>`)}<div class="card"><div class="stepper">${STEPS.map((s, i) => `<div class="st ${i + 1 < draft.step ? 'done' : ''} ${i + 1 === draft.step ? 'on' : ''}"><div class="bar"></div><small>Étape ${i + 1}</small><b>${s}</b></div>`).join('')}</div><div id="step-body"></div></div>`;
  renderStep();
}
function renderStep() {
  const errs = Object.keys(draft.errors).length;
  $('#step-body').innerHTML = `<h2 style="margin-bottom:16px">${STEPS[draft.step - 1]}</h2>${errs ? `<div class="alert err" style="margin-bottom:16px" role="alert">${ico('alert')}<span>Veuillez corriger les champs signalés avant de continuer.</span></div>` : ''}${stepHtml()}
  <div class="form-foot"><button class="btn ghost" data-act="step-prev" ${draft.step === 1 ? 'disabled' : ''}>← Précédent</button>${draft.step < 6 ? `<button class="btn" data-act="step-next">Suivant →</button>` : `<button class="btn accent" data-act="save-patient">${ico('check')} Enregistrer le dossier</button>`}</div>`;
}
function validateStep() {
  const d = draft.data, e = {}; const need = (k, m = 'Champ obligatoire') => { if (!String(d[k]).trim()) e[k] = m; };
  if (draft.step === 1) {
    need('nom'); need('prenoms'); need('naissance'); need('tel'); need('region'); need('localite');
    if (d.naissance && (new Date(d.naissance) > TODAY || ageOf(d.naissance) > 110)) e.naissance = 'Date de naissance invalide';
    if (d.tel && !/^[0-9 +]{8,}$/.test(d.tel.trim())) e.tel = 'Numéro invalide (8 chiffres minimum)';
  }
  if (draft.step === 3) { need('examenClinique', 'Sélectionnez le résultat de l\'examen'); if (d.imagerie !== 'Aucune' && d.birads === '') e.birads = 'Renseignez la classification BI-RADS'; }
  if (draft.step === 4 && d.biopsie === 'Oui') { need('typeHisto'); need('stade'); }
  if (draft.step === 6 && !d.certif) e.certif = 'Veuillez certifier les informations.';
  draft.errors = e; return !Object.keys(e).length;
}
function savePatient() {
  if (!validateStep()) return renderStep();
  const d = draft.data; let n = DB.patients.length + 1, id; do { id = `MD-${TODAY.getFullYear()}-${String(n++).padStart(4, '0')}`; } while (DB.patients.some(p => p.id === id));
  const dx = d.biopsie === 'Oui' && d.stade ? { biopsie: true, type: d.typeHisto, stade: d.stade, tnm: TNM[d.stade], hormonal: d.hormonal || 'Non déterminé' } : null;
  const tr = (d.chirurgie || d.chimio || d.radio || d.hormono) ? { chirurgie: d.chirurgie, chimio: d.chimio, radio: d.radio, hormono: d.hormono, reference: d.reference } : null;
  const p = { id, nom: d.nom.trim(), prenoms: d.prenoms.trim(), sexe: d.sexe, naissance: d.naissance, tel: d.tel.trim(), localite: d.localite.trim(), region: d.region, centre: session.centre, statut: d.statut || computeStatut(d),
    antecedents: { familial: d.familial, menopause: d.menopause, grossesses: Number(d.grossesses) || 0, allaitement: d.allaitement, tabac: d.tabac, alcool: d.alcool },
    depistage: { autopalpation: d.autopalpation, examenClinique: d.examenClinique, imagerie: d.imagerie, birads: d.birads === '' ? null : Number(d.birads) }, diagnostic: dx, traitement: tr,
    consultations: [{ date: iso(TODAY), type: d.typeConsult, centre: session.centre, note: 'Dossier créé lors de cette consultation.' }], prochainRdv: d.prochainRdv || null, documents: [] };
  DB.patients.unshift(p); saveDB(); audit('Création de dossier', id); draft = null; toast('Dossier enregistré avec succès.'); location.hash = `#/patients/${id}`;
}

/* ---------- Fiche patiente ---------- */
function viewFiche(id, v) {
  const p = DB.patients.find(x => x.id === id);
  if (!p) { v.innerHTML = `<div class="card">${emptyState('file', 'Dossier introuvable', `Aucun dossier ne porte le numéro « ${esc(id)} ».`, '<a class="btn" href="#/patients">Retour à la liste</a>')}</div>`; return; }
  if (state.fiche.last !== id) { audit('Consultation de dossier', id); state.fiche.last = id; state.fiche.tab = 'resume'; }
  const tab = state.fiche.tab, a = p.antecedents, dp = p.depistage, dg = p.diagnostic, tr = p.traitement;
  const rdv = p.prochainRdv ? `${fmt(p.prochainRdv)} <span class="muted small">(${daysBetween(TODAY, p.prochainRdv) >= 0 ? 'dans ' + daysBetween(TODAY, p.prochainRdv) + ' j' : 'dépassé de ' + -daysBetween(TODAY, p.prochainRdv) + ' j'})</span>` : 'Non planifié';
  const tabs = [['resume', 'Résumé'], ['depistage', 'Dépistage'], ['diagnostic', 'Diagnostic'], ['traitement', 'Traitement'], ['suivi', 'Suivi'], ['documents', 'Documents']];
  const body = {
    resume: `<div class="grid g2" style="margin-bottom:16px"><div class="mini"><span>Dernier résultat</span><b>${dp.birads !== null ? `BI-RADS ${dp.birads} · ${BIRADS[dp.birads]}` : esc(dp.examenClinique)}</b></div><div class="mini"><span>Prochain rendez-vous</span><b style="font-size:15px">${rdv}</b></div></div>
      <h3>Identité</h3><dl class="dl"><dt>Date de naissance</dt><dd>${fmt(p.naissance)} (${ageOf(p.naissance)} ans)</dd><dt>Téléphone</dt><dd>${esc(p.tel)}</dd><dt>Résidence</dt><dd>${esc(p.localite)}, ${esc(p.region)}</dd></dl>
      <h3 style="margin-top:20px">Facteurs de risque</h3><dl class="dl"><dt>Antécédents familiaux</dt><dd>${a.familial}</dd><dt>Ménopause</dt><dd>${a.menopause}</dd><dt>Grossesses</dt><dd>${a.grossesses}</dd><dt>Allaitement</dt><dd>${a.allaitement}</dd><dt>Tabac / alcool</dt><dd>${a.tabac} / ${a.alcool}</dd></dl>`,
    depistage: `<dl class="dl"><dt>Autopalpation</dt><dd>${esc(dp.autopalpation)}</dd><dt>Examen clinique</dt><dd>${esc(dp.examenClinique)}</dd><dt>Imagerie</dt><dd>${esc(dp.imagerie)}</dd><dt>Classification BI-RADS</dt><dd>${dp.birads !== null ? `${dp.birads} — ${BIRADS[dp.birads]}` : 'Non réalisée'}</dd></dl>`,
    diagnostic: dg ? `<dl class="dl"><dt>Biopsie</dt><dd>Réalisée</dd><dt>Type histologique</dt><dd>${esc(dg.type)}</dd><dt>Stade</dt><dd>${dg.stade} (${dg.tnm})</dd><dt>Statut hormonal</dt><dd>${esc(dg.hormonal)}</dd></dl>` : emptyState('file', 'Aucun diagnostic', 'Aucune biopsie ni diagnostic confirmé n\'est enregistré pour cette patiente.'),
    traitement: tr ? `<dl class="dl"><dt>Chirurgie</dt><dd>${tr.chirurgie ? 'Oui' : 'Non'}</dd><dt>Chimiothérapie</dt><dd>${tr.chimio ? 'Oui' : 'Non'}</dd><dt>Radiothérapie</dt><dd>${tr.radio ? 'Oui' : 'Non'}</dd><dt>Hormonothérapie</dt><dd>${tr.hormono ? 'Oui' : 'Non'}</dd><dt>Centre de référence</dt><dd>${esc(centreName(tr.reference))}</dd></dl>` : emptyState('activity', 'Aucun traitement', 'Aucune prise en charge thérapeutique n\'est enregistrée.'),
    suivi: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Type</th><th>Centre</th><th>Note</th></tr></thead><tbody>${p.consultations.slice().reverse().map(c => `<tr><td>${fmt(c.date)}</td><td>${esc(c.type)}</td><td>${esc(centreName(c.centre))}</td><td>${esc(c.note)}</td></tr>`).join('')}</tbody></table></div><p style="margin-top:14px"><b>Prochain rendez-vous :</b> ${rdv}</p>`,
    documents: `${p.documents.length ? `<ul style="padding-left:18px">${p.documents.map(d => `<li>${esc(d.nom)} <span class="muted small">— ajouté le ${fmt(d.date)}</span></li>`).join('')}</ul>` : emptyState('file', 'Aucun document', 'Ajoutez les comptes rendus, résultats d\'imagerie ou d\'anatomopathologie.')}<div style="margin-top:12px"><label class="btn ghost" style="cursor:pointer">${ico('plus')} Ajouter un document<input type="file" data-doc style="display:none"></label></div>`
  }[tab];
  v.innerHTML = `<a href="#/patients" class="muted small">← Retour à la liste</a>
  <div class="card" style="margin:12px 0 18px"><div class="fiche-head"><div class="avatar lg">${esc(initials(p.prenoms + ' ' + p.nom))}</div><div class="info"><h1>${esc(p.prenoms)} ${esc(p.nom.toUpperCase())} ${badge(p.statut)}</h1><div class="meta"><span>${p.id}</span><span>${ageOf(p.naissance)} ans</span><span>${ico('building')} ${esc(centreName(p.centre))}</span><span>${esc(p.region)}</span></div></div>
    <div class="row no-print">${role().create ? `<button class="btn accent" data-act="add-cons" data-id="${p.id}">${ico('plus')} Ajouter une consultation</button>` : ''}<button class="btn ghost" data-act="print">${ico('print')} Imprimer</button></div></div></div>
  <div class="grid g-12" style="grid-template-columns:minmax(240px,1fr) 2.2fr;align-items:start"><div class="card"><h3>Chronologie des consultations</h3><ul class="timeline">${p.consultations.slice().reverse().map(c => `<li><b>${esc(c.type)}</b><small>${fmt(c.date)} · ${esc(centreName(c.centre))}</small></li>`).join('')}</ul></div>
  <div class="card"><div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-act="tab" data-t="${k}" role="tab">${l}${k === 'suivi' ? `<span class="cnt">${p.consultations.length}</span>` : ''}${k === 'documents' && p.documents.length ? `<span class="cnt">${p.documents.length}</span>` : ''}</button>`).join('')}</div>${body}</div></div>`;
}
function consModal(id) {
  const p = DB.patients.find(x => x.id === id);
  openModal('Ajouter une consultation', `<div class="form-grid"><div class="fld"><label>Date</label><input id="cm-date" type="date" value="${iso(TODAY)}" max="${iso(TODAY)}"></div><div class="fld"><label>Médecin / agent consultant</label><input id="cm-med" type="text" value="${esc(session.name)}"></div><div class="fld"><label>Type de consultation</label><select id="cm-type">${optList(TYPES_CONSULT, 'Suivi')}</select></div>
    <div class="fld"><label>Statut après consultation</label><select id="cm-st">${optList(Object.keys(STATUTS).map(k => [k, STATUTS[k].label]), p.statut)}</select></div><div class="fld"><label>Prochain rendez-vous</label><input id="cm-rdv" type="date" min="${iso(TODAY)}" value="${p.prochainRdv && p.prochainRdv >= iso(TODAY) ? p.prochainRdv : ''}"></div>
    <div class="fld" style="grid-column:1/-1"><label>Note clinique</label><textarea id="cm-note" rows="3" placeholder="Observations, décisions, orientation…"></textarea></div></div>`,
    `<button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn accent" data-act="save-cons" data-id="${id}">Enregistrer</button>`);
}
function saveCons(id) {
  const p = DB.patients.find(x => x.id === id), date = $('#cm-date').value; if (!date) return toast('Indiquez la date de la consultation.', 'err');
  p.consultations.push({ date, type: $('#cm-type').value, centre: session.centre, medecin: ($('#cm-med').value.trim() || session.name), note: $('#cm-note').value.trim() || NOTES[$('#cm-type').value] });
  p.consultations.sort((a, b) => a.date.localeCompare(b.date)); p.statut = $('#cm-st').value; p.prochainRdv = $('#cm-rdv').value || null;
  saveDB(); audit('Modification de dossier', `${id} : consultation ajoutée`); closeModal(); toast('Consultation ajoutée au dossier.'); refresh();
}

/* ---------- Suivi : historique des consultations ---------- */
VIEWS.suivi = (r, v) => {
  const f = state.sv, t = iso(TODAY), q = (f.q || '').trim().toLowerCase();
  const base = scoped();
  const rel = p => { if (!p.prochainRdv) return '—'; const n = daysBetween(TODAY, p.prochainRdv); return `${fmt(p.prochainRdv)} (${n >= 0 ? (n === 0 ? 'aujourd\'hui' : `dans ${n} j`) : `en retard de ${-n} j`})`; };
  const list = base.filter(p => (!q || `${p.nom} ${p.prenoms} ${p.id} ${p.tel}`.toLowerCase().includes(q)) && (!f.statut || p.statut === f.statut) && (!f.centre || p.consultations.some(c => c.centre === f.centre)))
    .sort((a, b) => lastCons(b).date.localeCompare(lastCons(a).date));
  const nCons = list.reduce((s, p) => s + p.consultations.length, 0);
  const aVenir = list.filter(p => p.prochainRdv && p.prochainRdv >= t).length;
  const relancer = list.filter(p => p.statut === 'perdue' || (p.prochainRdv && p.prochainRdv < t && ['suspect', 'confirme', 'traitement'].includes(p.statut))).length;
  const cs = role().scope === 'all' ? CENTRES : CENTRES.filter(c => base.some(p => p.consultations.some(x => x.centre === c.id)));
  const shown = list.slice(0, f.n || 15);
  const consRow = (c, i, p) => {
    const ce = centreOf(c.centre);
    return `<li class="hist-item"><div class="hist-dot"></div><div class="hist-body">
      <div class="row spread"><b>${esc(c.type)}</b><span class="muted small">Consultation n°${i + 1} · ${fmt(c.date)}</span></div>
      <dl class="dl" style="margin:6px 0"><dt>Lieu</dt><dd>${esc(ce.nom)} — ${esc(ce.ville || '')}, région ${esc(ce.region)}</dd>
      <dt>Médecin</dt><dd>${esc(c.medecin || 'Non renseigné')}</dd>
      <dt>Observations</dt><dd>${esc(c.note || '—')}</dd></dl></div></li>`;
  };
  const card = p => {
    const dp = p.depistage || {}, last = lastCons(p);
    return `<details class="card hist-card" style="margin-bottom:12px"><summary style="cursor:pointer;list-style:none">
      <div class="row spread"><div class="who"><b>${esc(p.nom.toUpperCase())} ${esc(p.prenoms)}</b><span>${p.id} · ${ageOf(p.naissance)} ans · ${maskTel(p.tel)} · ${esc(p.region)}</span></div>
      <div class="row" style="gap:10px">${badge(p.statut)}<span class="tag indigo">${p.consultations.length} consultation(s)</span></div></div>
      <p class="muted small" style="margin:6px 0 0">Dernière consultation : ${fmt(last.date)} — ${esc(centreName(last.centre))}${last.medecin ? ' — ' + esc(last.medecin) : ''}</p></summary>
      <div style="margin-top:14px"><dl class="dl"><dt>Prochain rendez-vous</dt><dd>${rel(p)}</dd>
      <dt>Imagerie / BI-RADS</dt><dd>${esc(dp.imagerie || '—')}${dp.birads != null ? ` · BI-RADS ${dp.birads} (${BIRADS[dp.birads]})` : ''}</dd>
      <dt>Diagnostic</dt><dd>${p.diagnostic ? `${esc(p.diagnostic.type)} · stade ${esc(p.diagnostic.stade)} (${esc(p.diagnostic.tnm)}) · ${esc(p.diagnostic.hormonal)}` : 'Aucun'}</dd>
      <dt>Traitement</dt><dd>${p.traitement ? ['chirurgie', 'chimio', 'radio', 'hormono'].filter(k => p.traitement[k]).join(', ') || '—' : 'Aucun'}</dd></dl>
      <h4 class="sub-title">Historique des consultations</h4>
      <ul class="hist">${p.consultations.slice().reverse().map((c, i, a) => consRow(c, a.length - 1 - i, p)).join('')}</ul>
      <button class="btn ghost" data-act="open" data-id="${p.id}">Ouvrir le dossier complet</button></div></details>`;
  };
  v.innerHTML = `${head('Suivi & historique', 'Historique complet des consultations de chaque patiente : lieu, date, médecin et observations')}
  <div class="grid g3" style="margin-bottom:18px"><div class="card kpi"><div class="ic info">${ico('calendar')}</div><div><b>${nf(nCons)}</b><span>Consultations (${list.length} patiente(s))</span></div></div><div class="card kpi"><div class="ic grey">${ico('clock')}</div><div><b>${aVenir}</b><span>RDV à venir</span></div></div><div class="card kpi"><div class="ic warn">${ico('alert')}</div><div><b>${relancer}</b><span>À relancer</span></div></div></div>
  <div class="card filters flat"><input type="search" data-f="sv.q" value="${esc(f.q || '')}" placeholder="Rechercher (nom, n° dossier, téléphone)" aria-label="Recherche">
  <select data-f="sv.statut" aria-label="Statut">${optList(Object.keys(STATUTS).map(k => [k, STATUTS[k].label]), f.statut, 'Tous les statuts')}</select>
  <select data-f="sv.centre" aria-label="Lieu">${optList(cs.map(c => [c.id, c.nom]), f.centre, 'Tous les lieux')}</select></div>
  ${list.length === 0 ? `<div class="card">${emptyState('check', 'Aucun résultat', 'Aucune patiente ne correspond à ces filtres.')}</div>` : shown.map(card).join('')}
  ${list.length > shown.length ? `<p style="text-align:center"><button class="btn ghost" data-act="sv-more">Afficher plus (${list.length - shown.length} restantes)</button></p>` : ''}`;
};

/* ---------- Statistiques et cartographie ---------- */
function centreStats(list) {
  return CENTRES.map(c => { const l = list.filter(p => p.centre === c.id), k = kpis(l); return { c, ...k }; }).filter(x => x.dep > 0).sort((a, b) => b.dep - a.dep);
}
VIEWS.stats = (r, v) => {
  const f = state.st, all = role().scope === 'all', list = filterByPeriod(scoped(), f.period, all ? f.region : ''), k = kpis(list);
  const metric = { dep: ['Dépistages', p => true, n => n], cas: ['Cas confirmés', isCase, n => n], pos: ['Taux de positivité (%)', null, n => n + ' %'] }[f.metric];
  const natList = filterByPeriod(DB.patients, f.period, all ? f.region : '');
  let vals; if (f.metric === 'pos') { const d = byRegion(natList, () => true), c = byRegion(natList, isCase); vals = {}; REGIONS.forEach(x => vals[x] = d[x] ? Math.round(c[x] / d[x] * 100) : 0); } else vals = byRegion(natList, metric[1]);
  const maxV = Math.max(1, ...Object.values(vals)); const rows = centreStats(list);
  v.innerHTML = `${head('Statistiques & cartographie', 'Comparaison par région et par centre', `<button class="btn ghost" data-act="export-csv">${ico('download')} Exporter en CSV</button><button class="btn" data-act="print">${ico('print')} Exporter en PDF</button>`)}
  <div class="card filters flat"><select data-f="st.period" data-num>${optList([[3, '3 derniers mois'], [6, '6 derniers mois'], [12, '12 derniers mois']], f.period)}</select>${all ? `<select data-f="st.region">${optList(REGIONS, f.region, 'Toutes les régions')}</select>` : ''}
    <select data-f="st.metric"><option value="dep" ${f.metric === 'dep' ? 'selected' : ''}>Indicateur : dépistages</option><option value="cas" ${f.metric === 'cas' ? 'selected' : ''}>Indicateur : cas confirmés</option><option value="pos" ${f.metric === 'pos' ? 'selected' : ''}>Indicateur : taux de positivité</option></select></div>
  ${list.length === 0 ? `<div class="card">${emptyState('chart', 'Aucune donnée', 'Aucun dossier ne correspond à ces filtres.')}</div>` : `
  <div class="grid g4" style="margin-bottom:18px"><div class="card mini"><span>Dépistées</span><b>${nf(k.dep)}</b></div><div class="card mini"><span>Cas confirmés</span><b>${nf(k.cas)}</b></div><div class="card mini"><span>Positivité</span><b>${k.pos}</b></div><div class="card mini"><span>En traitement</span><b>${nf(k.trt)}</b></div></div>
  <div class="grid g2" style="margin-bottom:18px"><div class="card"><h3>Carte — ${metric[0]}</h3>${bfMap(vals, metric[2], metric[0])}</div>
  <div class="card"><h3>Classement des régions — ${metric[0]}</h3>${Object.entries(vals).sort((a, b) => b[1] - a[1]).map(([rg, n]) => `<div class="bar-row rose"><span>${rg}</span><div class="tr"><i style="width:${n / maxV * 100}%"></i></div><span class="v">${metric[2](n)}</span></div>`).join('')}</div></div>
  <div class="card"><h3>Détail par centre</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Centre</th><th>Région</th><th class="num">Dépistées</th><th class="num">Suspects</th><th class="num">Confirmés</th><th class="num">Positivité</th><th class="num">En traitement</th></tr></thead><tbody>${rows.map(x => `<tr><td>${esc(x.c.nom)}</td><td>${esc(x.c.region)}</td><td class="num">${x.dep}</td><td class="num">${x.sus}</td><td class="num">${x.cas}</td><td class="num">${x.pos}</td><td class="num">${x.trt}</td></tr>`).join('')}</tbody></table></div></div>`}`;
};
function exportCSV() {
  const f = state.st, list = filterByPeriod(scoped(), f.period, role().scope === 'all' ? f.region : '');
  const rows = [['Centre', 'Région', 'Dépistées', 'Suspects', 'Confirmés', 'Positivité', 'En traitement']].concat(centreStats(list).map(x => [x.c.nom, x.c.region, x.dep, x.sus, x.cas, x.pos, x.trt]));
  const csv = '\ufeff' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = `mammodata-statistiques-${iso(TODAY)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  audit('Export CSV', 'Statistiques par centre'); toast('Export CSV généré.');
}

/* ---------- Centres de santé ---------- */
VIEWS.centres = (r, v) => {
  const list = role().scope === 'all' ? CENTRES : CENTRES.filter(c => c.id === session.centre);
  const rows = list.map(c => { const l = DB.patients.filter(p => p.centre === c.id), k = kpis(l); return { c, k, agents: DB.users.filter(u => u.centre === c.id).length }; });
  v.innerHTML = `${head('Centres de santé', `${rows.length} centre(s)`)}<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Centre</th><th>Type</th><th>Région</th><th class="num">Agents</th><th class="num">Dossiers</th><th class="num">Cas confirmés</th><th></th></tr></thead><tbody>${rows.map(x => `<tr data-act="centre" data-id="${x.c.id}"><td><b>${esc(x.c.nom)}</b></td><td><span class="tag indigo">${x.c.type}</span></td><td>${esc(x.c.region)}</td><td class="num">${x.agents}</td><td class="num">${x.k.dep}</td><td class="num">${x.k.cas}</td><td>${ico('chev')}</td></tr>`).join('')}</tbody></table></div></div>`;
};
function centreModal(id) {
  const c = centreOf(id), l = DB.patients.filter(p => p.centre === id), k = kpis(l), ag = DB.users.filter(u => u.centre === id), ms = monthsBack(6);
  openModal(c.nom, `<div class="grid g3" style="margin-bottom:16px"><div class="mini"><span>Dossiers</span><b>${k.dep}</b></div><div class="mini"><span>Cas confirmés</span><b>${k.cas}</b></div><div class="mini"><span>Positivité</span><b>${k.pos}</b></div></div>
  <p class="muted">${c.type} · ${esc(c.ville)} · Région ${esc(c.region)}</p><h3 class="sub-title">Activité des 6 derniers mois</h3>${lineChart(ms.map(m => m.label), [{ name: 'Dépistages', color: '#2E2A78', values: ms.map(m => l.filter(p => p.consultations[0].date.startsWith(m.key)).length) }])}
  <h3 class="sub-title">Agents rattachés</h3>${ag.length ? ag.map(u => `<div class="row spread" style="padding:8px 0;border-bottom:1px solid var(--line)"><span>${esc(u.nom)}</span><span class="tag indigo">${ROLES[u.role].label}</span></div>`).join('') : '<p class="muted">Aucun agent rattaché.</p>'}`, '<button class="btn" data-act="close-modal">Fermer</button>');
}

/* ---------- Utilisateurs et journal d'audit ---------- */
VIEWS.utilisateurs = (r, v) => {
  const fa = state.au.filter, log = DB.audit.filter(a => !fa || a.action === fa).slice(0, 40), acts = [...new Set(DB.audit.map(a => a.action))];
  v.innerHTML = `${head('Utilisateurs & audit', 'Gestion des comptes et traçabilité des accès', `<button class="btn accent" data-act="new-user">${ico('plus')} Nouvel utilisateur</button>`)}
  <div class="card" style="margin-bottom:18px"><h3>Comptes (${DB.users.length})</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Utilisateur</th><th>Rôle</th><th>Centre</th><th>État</th><th></th></tr></thead><tbody>${DB.users.map(u => `<tr><td class="who"><b>${esc(u.nom)}</b><span>${esc(u.email)}</span></td><td><span class="tag indigo">${ROLES[u.role].label}</span></td><td>${esc(centreName(u.centre))}</td><td>${u.actif ? '<span class="badge neg"><i>✓</i>Actif</span>' : '<span class="badge clo"><i>–</i>Désactivé</span>'}</td><td><button class="btn sm ghost" data-act="toggle-user" data-id="${u.id}">${u.actif ? 'Désactiver' : 'Réactiver'}</button></td></tr>`).join('')}</tbody></table></div></div>
  <div class="card"><div class="row spread" style="margin-bottom:12px"><h3 style="margin:0">Journal d'audit</h3><select data-f="au.filter" style="padding:8px 12px;border:1.5px solid var(--line);border-radius:10px">${optList(acts, fa, 'Toutes les actions')}</select></div>
  ${log.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date et heure</th><th>Utilisateur</th><th>Action</th><th>Détail</th></tr></thead><tbody>${log.map(a => { const d = new Date(a.ts); return `<tr><td>${fmt(iso(d))} ${pad(d.getHours())}:${pad(d.getMinutes())}</td><td>${esc(a.user)}</td><td><span class="tag">${esc(a.action)}</span></td><td class="muted">${esc(a.detail)}</td></tr>`; }).join('')}</tbody></table></div>` : emptyState('shield', 'Aucune entrée', 'Aucune action ne correspond à ce filtre.')}</div>`;
};
function userModal() {
  openModal('Nouvel utilisateur', `<div class="form-grid"><div class="fld"><label>Nom complet<b class="req">*</b></label><input id="nu-nom"></div><div class="fld"><label>E-mail professionnel<b class="req">*</b></label><input id="nu-mail" type="email" placeholder="prenom.nom@sante.gov.bf"></div><div class="fld"><label>Rôle</label><select id="nu-role">${optList(Object.keys(ROLES).map(k => [k, ROLES[k].label]), 'agent')}</select></div><div class="fld"><label>Centre de rattachement</label><select id="nu-centre">${optList(CENTRES.map(c => [c.id, c.nom]), 'c-yalgado')}</select></div></div><div id="nu-err"></div>`,
    '<button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn accent" data-act="save-user">Créer le compte</button>');
}

/* =====================================================================
   ÉVÉNEMENTS
   ===================================================================== */
const ACT = {
  'close-modal': () => closeModal(), logout, 'open-side': openSide, 'close-side': closeSide,
  goto: t => { location.hash = t.dataset.to; },
  profile: () => { const m = $('#pmenu'); m.hidden = !m.hidden; },
  expire: () => { $('#pmenu').hidden = true; sessionExpired(); },
  reset: () => { $('#pmenu').hidden = true; resetDB(); draft = null; toast('Données de démonstration réinitialisées.'); location.hash = '#/dashboard'; render(); },
  open: t => { location.hash = `#/patients/${t.dataset.id}`; },
  page: t => { state.pl.page = Number(t.dataset.p); drawPatients(); },
  'reset-filters': () => { state.pl = { q: '', statut: '', centre: '', periode: '', page: 1 }; refresh(); },
  'step-prev': () => { draft.errors = {}; draft.step = Math.max(1, draft.step - 1); viewNew($('#view')); },
  'step-next': () => {
    if (!validateStep()) return renderStep();
    if (draft.step === 1 && !draft.dupOk) { const d = draft.data, dup = DB.patients.find(p => p.nom.toLowerCase() === d.nom.trim().toLowerCase() && p.prenoms.toLowerCase() === d.prenoms.trim().toLowerCase() && p.naissance === d.naissance); if (dup) { draft.dup = dup; return renderStep(); } }
    draft.step = Math.min(6, draft.step + 1); viewNew($('#view'));
  },
  'dup-ok': () => { draft.dupOk = true; draft.dup = null; draft.step = 2; viewNew($('#view')); },
  'save-patient': savePatient,
  tab: t => { state.fiche.tab = t.dataset.t; refresh(); },
  'add-cons': t => consModal(t.dataset.id), 'save-cons': t => saveCons(t.dataset.id),
  print: () => window.print(),
  'sv-more': () => { state.sv.n += 15; refresh(); },
  'export-csv': exportCSV, centre: t => centreModal(t.dataset.id),
  'new-user': userModal,
  'save-user': () => {
    const nom = $('#nu-nom').value.trim(), mail = $('#nu-mail').value.trim();
    if (!nom || !/^\S+@\S+\.\S+$/.test(mail)) { $('#nu-err').innerHTML = `<div class="alert err" style="margin-top:14px">${ico('alert')}<span>Renseignez un nom et une adresse e-mail valide.</span></div>`; return; }
    DB.users.push({ id: 'u' + Date.now(), nom, email: mail, role: $('#nu-role').value, centre: $('#nu-centre').value, actif: true }); saveDB(); audit('Création de compte', nom); closeModal(); toast('Compte créé.'); refresh();
  },
  'toggle-user': t => { const u = DB.users.find(x => x.id === t.dataset.id); if (u.id === session.userId) return toast('Vous ne pouvez pas désactiver votre propre compte.', 'err'); u.actif = !u.actif; saveDB(); audit(u.actif ? 'Réactivation de compte' : 'Désactivation de compte', u.nom); refresh(); }
};
document.addEventListener('click', e => {
  if (e.target.id === 'modal' && $('#modal').dataset.closable) return closeModal();
  const t = e.target.closest('[data-act]'); if (t && ACT[t.dataset.act]) { ACT[t.dataset.act](t, e); }
  if (!e.target.closest('.profile')) { const m = $('#pmenu'); if (m) m.hidden = true; }
  resetIdle();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#modal').hidden && $('#modal').dataset.closable) closeModal();
  if (e.key === 'Enter' && e.target.id === 'g-search') { state.pl = { q: e.target.value, statut: '', centre: '', periode: '', page: 1 }; e.target.value = ''; location.hash = '#/patients'; if (parseRoute().name === 'patients') refresh(); }
  if (e.key === 'Enter' && e.target.matches('tr[data-act]')) ACT.open(e.target);
  resetIdle();
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'pl-q') { state.pl.q = t.value; state.pl.page = 1; drawPatients(); }
  if (t.dataset.d && draft) {
    draft.data[t.dataset.d] = t.type === 'checkbox' ? t.checked : t.value;
    if (draft.errors[t.dataset.d]) { delete draft.errors[t.dataset.d]; const f = t.closest('.fld'); if (f) { f.classList.remove('bad'); f.querySelector('.err')?.remove(); } }
    if (t.dataset.d === 'nom' || t.dataset.d === 'prenoms' || t.dataset.d === 'naissance') { draft.dupOk = false; draft.dup = null; }
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.d && draft) { draft.data[t.dataset.d] = t.type === 'checkbox' ? t.checked : t.value; if (t.dataset.rr) renderStep(); }
  if (t.dataset.f) { const [a, b] = t.dataset.f.split('.'); state[a][b] = t.hasAttribute('data-num') ? Number(t.value) : t.value; if (a === 'pl') state.pl.page = 1; if (a === 'sv') state.sv.n = 15; refresh(); }
  if (t.matches('[data-doc]') && t.files[0]) { const p = DB.patients.find(x => x.id === parseRoute().id); p.documents.push({ nom: t.files[0].name, date: iso(TODAY) }); saveDB(); audit('Ajout de document', p.id); toast('Document ajouté au dossier.'); refresh(); }
});
document.addEventListener('submit', e => { if (e.target.id === 'login-form') submitLogin(e); });
window.addEventListener('hashchange', render);

/* ---------- Démarrage ---------- */
loadDB(); loadSession(); resetIdle(); render();
