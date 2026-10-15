'use strict';
/* =====================================================================
   MammoData — utilitaires, référentiels et données fictives
   (prototype front-end : les données sont simulées et stockées dans le
   navigateur ; à remplacer par une API sécurisée en production)
   ===================================================================== */

/* ---------- Utilitaires ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmt = s => { if (!s) return '—'; const [y, m, d] = String(s).slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + Math.round(n)); return x; };
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const ageOf = s => { const b = new Date(s); let a = TODAY.getFullYear() - b.getFullYear(); if (TODAY < new Date(TODAY.getFullYear(), b.getMonth(), b.getDate())) a--; return a; };
const nf = n => Number(n).toLocaleString('fr-FR');
const pct = (a, b) => b ? (a / b * 100).toFixed(1).replace('.', ',') + ' %' : '—';
const maskTel = t => { const p = String(t).split(' '); return p.length === 4 ? `${p[0]} •• •• ${p[3]}` : '•• •• ••'; };
const initials = n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- Référentiels ---------- */
const REGIONS = ['Boucle du Mouhoun', 'Cascades', 'Centre', 'Centre-Est', 'Centre-Nord', 'Centre-Ouest', 'Centre-Sud', 'Est', 'Hauts-Bassins', 'Nord', 'Plateau-Central', 'Sahel', 'Sud-Ouest'];

const CENTRES = [
  { id: 'c-yalgado', nom: 'CHU Yalgado Ouédraogo', region: 'Centre', ville: 'Ouagadougou', type: 'CHU' },
  { id: 'c-souro', nom: 'CHU Souro Sanou', region: 'Hauts-Bassins', ville: 'Bobo-Dioulasso', type: 'CHU' },
  { id: 'c-kaya', nom: 'CMA de Kaya', region: 'Centre-Nord', ville: 'Kaya', type: 'CMA' },
  { id: 'c-tengandogo', nom: 'CHU de Tengandogo', region: 'Centre', ville: 'Ouagadougou', type: 'CHU' },
  { id: 'c-bogodogo', nom: 'CHU de Bogodogo', region: 'Centre', ville: 'Ouagadougou', type: 'CHU' },
  { id: 'c-ouahigouya', nom: 'CHR de Ouahigouya', region: 'Nord', ville: 'Ouahigouya', type: 'CHR' },
  { id: 'c-koudougou', nom: 'CHR de Koudougou', region: 'Centre-Ouest', ville: 'Koudougou', type: 'CHR' },
  { id: 'c-fada', nom: "CHR de Fada N'Gourma", region: 'Est', ville: "Fada N'Gourma", type: 'CHR' },
  { id: 'c-dedougou', nom: 'CHR de Dédougou', region: 'Boucle du Mouhoun', ville: 'Dédougou', type: 'CHR' },
  { id: 'c-banfora', nom: 'CHR de Banfora', region: 'Cascades', ville: 'Banfora', type: 'CHR' },
  { id: 'c-tenkodogo', nom: 'CHR de Tenkodogo', region: 'Centre-Est', ville: 'Tenkodogo', type: 'CHR' },
  { id: 'c-manga', nom: 'CHR de Manga', region: 'Centre-Sud', ville: 'Manga', type: 'CHR' },
  { id: 'c-ziniare', nom: 'CMA de Ziniaré', region: 'Plateau-Central', ville: 'Ziniaré', type: 'CMA' },
  { id: 'c-dori', nom: 'CMA de Dori', region: 'Sahel', ville: 'Dori', type: 'CMA' },
  { id: 'c-gaoua', nom: 'CHR de Gaoua', region: 'Sud-Ouest', ville: 'Gaoua', type: 'CHR' }
];
const centreOf = id => CENTRES.find(c => c.id === id) || { nom: id, region: '—' };
const centreName = id => centreOf(id).nom;

const STATUTS = {
  negatif: { label: 'Dépistage négatif', cls: 'neg', icon: '✓' },
  suspect: { label: 'Cas suspect', cls: 'sus', icon: '!' },
  confirme: { label: 'Cas confirmé', cls: 'conf', icon: '●' },
  traitement: { label: 'En traitement', cls: 'trt', icon: '✚' },
  perdue: { label: 'Perdue de vue', cls: 'lost', icon: '?' },
  cloture: { label: 'Dossier clôturé', cls: 'clo', icon: '–' }
};
const badge = st => { const s = STATUTS[st] || STATUTS.negatif; return `<span class="badge ${s.cls}"><i>${s.icon}</i>${s.label}</span>`; };
const TNM = { I: 'T1 N0 M0', II: 'T2 N1 M0', III: 'T3 N2 M0', IV: 'T4 N3 M1' };
const BIRADS = { 0: 'Incomplet', 1: 'Négatif', 2: 'Bénin', 3: 'Probablement bénin', 4: 'Suspect', 5: 'Hautement suspect', 6: 'Malignité prouvée' };
const TYPES_CONSULT = ['Sensibilisation', 'Dépistage', 'Examen complémentaire', 'Diagnostic', 'Traitement', 'Suivi'];
const NOTES = {
  'Sensibilisation': 'Séance de sensibilisation et enseignement de l\'autopalpation.',
  'Dépistage': 'Examen clinique des seins et orientation vers l\'imagerie.',
  'Examen complémentaire': 'Imagerie et examens complémentaires réalisés.',
  'Diagnostic': 'Résultats d\'anatomopathologie communiqués à la patiente.',
  'Traitement': 'Séance de traitement et surveillance de la tolérance.',
  'Suivi': 'Consultation de contrôle, bonne observance.'
};

/* ---------- Stockage local ---------- */
const KEY = 'mammodata.v1';
let DB = null;
let session = null;

function saveDB() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { /* stockage indisponible */ } }
function loadDB() {
  try { const raw = localStorage.getItem(KEY); if (raw) { DB = JSON.parse(raw); return; } } catch (e) { /* ignore */ }
  DB = seedData(); saveDB();
}
function resetDB() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } DB = seedData(); saveDB(); }
function audit(action, detail) {
  DB.audit.unshift({ ts: new Date().toISOString(), user: session ? session.name : '—', role: session ? session.role : '', action, detail: detail || '' });
  DB.audit = DB.audit.slice(0, 300); saveDB();
}
const lastCons = p => p.consultations[p.consultations.length - 1];
const isCase = p => !!p.diagnostic;

/* ---------- Données fictives ---------- */
function seedData() {
  const r = mulberry32(2026);
  const pick = a => a[Math.floor(r() * a.length)];
  const rnd = (a, b) => a + Math.floor(r() * (b - a + 1));
  const yn = p => r() < p;
  const NOMS = ['Ouédraogo', 'Sawadogo', 'Compaoré', 'Kaboré', 'Traoré', 'Zongo', 'Ilboudo', 'Nikiéma', 'Tiendrébéogo', 'Ouattara', 'Sanou', 'Bationo', 'Zoungrana', 'Kiemdé', 'Konaté', 'Belem', 'Yaméogo', 'Savadogo', 'Diallo', 'Barry', 'Coulibaly', 'Kéré'];
  const PRENOMS = ['Aminata', 'Fatimata', 'Awa', 'Salimata', 'Mariam', 'Rasmata', 'Azéta', 'Alimata', 'Pauline', 'Honorine', 'Nathalie', 'Clarisse', 'Habibou', 'Edwige', 'Solange', 'Adjara', 'Kadidia', 'Odette', 'Brigitte', 'Sali', 'Ramata', 'Juliette'];
  const dist = [['negatif', .54], ['suspect', .14], ['confirme', .07], ['traitement', .14], ['perdue', .06], ['cloture', .05]];
  const NCONS = { negatif: 1, suspect: 2, confirme: 3, traitement: 4, perdue: 2, cloture: 4 };
  const TYPES = {
    negatif: ['Dépistage'], suspect: ['Dépistage', 'Examen complémentaire'],
    confirme: ['Dépistage', 'Examen complémentaire', 'Diagnostic'],
    traitement: ['Dépistage', 'Examen complémentaire', 'Diagnostic', 'Traitement'],
    perdue: ['Dépistage', 'Diagnostic'], cloture: ['Dépistage', 'Diagnostic', 'Traitement', 'Suivi']
  };
  const patients = [];
  for (let i = 1; i <= 190; i++) {
    let x = r(), st = 'negatif', acc = 0;
    for (const [k, p] of dist) { acc += p; if (x <= acc) { st = k; break; } }
    const centre = CENTRES[Math.floor(r() * r() * CENTRES.length)];
    const back = st === 'perdue' ? rnd(170, 360) : (st === 'traitement' || st === 'cloture') ? rnd(90, 360) : rnd(4, 360);
    let d = addDays(TODAY, -back);
    const cons = [];
    for (let k = 0; k < NCONS[st]; k++) {
      if (k > 0) d = addDays(d, rnd(8, 45));
      if (d > TODAY) d = addDays(TODAY, -rnd(0, 6));
      const t = TYPES[st][k];
      cons.push({ date: iso(d), type: t, centre: k > 0 && yn(.25) ? 'c-yalgado' : centre.id, note: NOTES[t] });
    }
    const hasDx = st === 'confirme' || st === 'traitement' || ((st === 'perdue' || st === 'cloture') && yn(.6));
    const stade = hasDx ? pick(['I', 'II', 'II', 'III', 'III', 'IV']) : null;
    let imagerie = pick(['Aucune', 'Échographie', 'Mammographie']);
    let birads = null;
    if (st === 'suspect') { imagerie = pick(['Mammographie', 'Les deux']); birads = pick([3, 4, 4, 5]); }
    else if (hasDx) { imagerie = pick(['Mammographie', 'Les deux']); birads = pick([4, 5, 5, 6]); }
    else if (imagerie !== 'Aucune') birads = (st === 'negatif') ? pick([1, 2, 2]) : pick([2, 3]);
    const tr = st === 'traitement' || st === 'cloture';
    const lc = cons[cons.length - 1].date;
    const rdv = { negatif: null, suspect: iso(addDays(TODAY, rnd(-20, 25))), confirme: iso(addDays(TODAY, rnd(-10, 20))), traitement: iso(addDays(TODAY, rnd(-5, 40))), perdue: iso(addDays(new Date(lc), 60)), cloture: null }[st];
    const age = rnd(24, 74);
    const ville = centre.ville;
    patients.push({
      id: `MD-${TODAY.getFullYear()}-${String(i).padStart(4, '0')}`,
      nom: pick(NOMS), prenoms: pick(PRENOMS), sexe: r() < .985 ? 'F' : 'M',
      naissance: iso(new Date(TODAY.getFullYear() - age, rnd(0, 11), rnd(1, 28))),
      tel: `7${rnd(0, 9)} ${pad(rnd(10, 99))} ${pad(rnd(10, 99))} ${pad(rnd(10, 99))}`,
      localite: yn(.7) ? `Secteur ${rnd(1, 30)}, ${ville}` : ville, region: centre.region, centre: centre.id,
      statut: st,
      antecedents: { familial: yn(.18) ? 'Oui' : 'Non', menopause: age > 50 ? 'Oui' : 'Non', grossesses: rnd(0, 7), allaitement: yn(.75) ? 'Oui' : 'Non', tabac: yn(.04) ? 'Oui' : 'Non', alcool: pick(['Non', 'Non', 'Occasionnel', 'Régulier']) },
      depistage: { autopalpation: pick(['Oui', 'Non', 'Jamais pratiquée']), examenClinique: (st === 'negatif') ? 'Normal' : 'Anormal', imagerie, birads },
      diagnostic: hasDx ? { biopsie: true, type: pick(['Carcinome canalaire infiltrant', 'Carcinome canalaire infiltrant', 'Carcinome lobulaire infiltrant', 'Carcinome canalaire in situ']), stade, tnm: TNM[stade], hormonal: pick(['RH+ / HER2−', 'RH+ / HER2+', 'RH− / HER2+', 'Triple négatif']) } : null,
      traitement: tr ? { chirurgie: yn(.6), chimio: yn(.7), radio: yn(.4), hormono: yn(.5), reference: 'c-yalgado' } : null,
      consultations: cons, prochainRdv: rdv, documents: []
    });
  }
  patients.forEach(p => { if (p.traitement && !(p.traitement.chirurgie || p.traitement.chimio || p.traitement.radio || p.traitement.hormono)) p.traitement.chimio = true; });
  patients.sort((a, b) => b.consultations[0].date.localeCompare(a.consultations[0].date));

  const users = [
    { id: 'u1', nom: 'Aminata Sawadogo', email: 'a.sawadogo@sante.gov.bf', role: 'agent', centre: 'c-kaya', actif: true },
    { id: 'u2', nom: 'Dr Issouf Compaoré', email: 'i.compaore@sante.gov.bf', role: 'responsable', centre: 'c-kaya', actif: true },
    { id: 'u3', nom: 'Dr Mariam Zongo', email: 'm.zongo@sante.gov.bf', role: 'regional', centre: 'c-yalgado', actif: true },
    { id: 'u4', nom: 'Boukary Ilboudo', email: 'b.ilboudo@sante.gov.bf', role: 'admin', centre: 'c-yalgado', actif: true },
    { id: 'u5', nom: 'Salimata Kaboré', email: 's.kabore@sante.gov.bf', role: 'agent', centre: 'c-yalgado', actif: true },
    { id: 'u6', nom: 'Edwige Traoré', email: 'e.traore@sante.gov.bf', role: 'agent', centre: 'c-souro', actif: true },
    { id: 'u7', nom: 'Dr Habibou Ouattara', email: 'h.ouattara@sante.gov.bf', role: 'responsable', centre: 'c-souro', actif: true },
    { id: 'u8', nom: 'Rasmata Zoungrana', email: 'r.zoungrana@sante.gov.bf', role: 'agent', centre: 'c-ouahigouya', actif: false }
  ];
  const acts = [['Connexion', ''], ['Création de dossier', 'Nouveau dossier enregistré'], ['Consultation de dossier', 'Ouverture d\'une fiche'], ['Export CSV', 'Statistiques par centre'], ['Modification de dossier', 'Nouvelle consultation ajoutée']];
  const log = [];
  for (let i = 0; i < 18; i++) {
    const u = pick(users), a = pick(acts);
    log.push({ ts: new Date(TODAY.getTime() - i * 5.3 * 3600e3 - rnd(0, 3000) * 1000).toISOString(), user: u.nom, role: u.role, action: a[0], detail: a[1] });
  }
  return { patients, users, audit: log };
}
