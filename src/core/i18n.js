/**
 * Tiny i18n: every element with [data-i18n] gets its innerHTML swapped from the
 * dictionary. Spanish is the default; ENG/ESP in the navbar toggles. The choice
 * persists in localStorage.
 */
const DICT = {
  es: {
    nav_archivo: 'ARCHIVO',
    nav_experiencias: 'EXPERIENCIAS',
    nav_manifiesto: 'MANIFIESTO',
    banner_kicker: 'SISTEMA DE ARCHIVO DOCUMENTAL',
    intro_lead: 'UN RECORRIDO INMERSIVO POR LOS RÍOS DE LA ESPAÑA VACÍA.<br>TRUTTA EXPLORA LA TENSIÓN ENTRE EL RIGOR CIENTÍFICO Y LA<br>NATURALEZA INDOMABLE, DEJANDO UN RASTRO AZUL SOBRE LO<br>QUE ESTAMOS A PUNTO DE PERDER.',
    archivos_title: 'ARCHIVOS VIVOS',
    archivos_sub: 'Registro documental de ecosistemas bajo vigilancia institucional.',
    bitacoras_title: 'EXPERIENCIAS',
    bitacoras_sub: 'Registro documental de ecosistemas bajo auditoría institucional.<br>y como se relacionan con los pueblos.',
    share: 'COMPARTE TU EXPERIENCIA',
    expo_cta: 'INICIAR RECORRIDO',
    footer_claim: 'DISEÑO PARA<br>CONSERVAR LO QUE FLUYE',
    fotografia: 'FOTOGRAFÍA',
    form_name: 'NOMBRE',
    form_loc: 'LOCALIZACIÓN',
    form_msg: 'AÑADIR MENSAJE',
    form_send: 'ENVIAR',
    form_add: 'AÑADIR FOTOGRAFÍAS',
    form_back: 'VOLVER A LA PÁGINA PRINCIPAL',
  },
  en: {
    nav_archivo: 'ARCHIVE',
    nav_experiencias: 'EXPERIENCES',
    nav_manifiesto: 'MANIFESTO',
    banner_kicker: 'DOCUMENTARY ARCHIVE SYSTEM',
    intro_lead: 'AN IMMERSIVE JOURNEY THROUGH THE RIVERS OF EMPTIED SPAIN.<br>TRUTTA EXPLORES THE TENSION BETWEEN SCIENTIFIC RIGOUR AND<br>UNTAMED NATURE, LEAVING A BLUE TRACE OVER<br>WHAT WE ARE ABOUT TO LOSE.',
    archivos_title: 'LIVING ARCHIVES',
    archivos_sub: 'Documentary record of ecosystems under institutional surveillance.',
    bitacoras_title: 'EXPERIENCES',
    bitacoras_sub: 'Documentary record of ecosystems under institutional audit.<br>and how they relate to the villages.',
    share: 'SHARE YOUR EXPERIENCE',
    expo_cta: 'START THE JOURNEY',
    footer_claim: 'DESIGNED TO<br>PRESERVE WHAT FLOWS',
    fotografia: 'PHOTOGRAPH',
    form_name: 'NAME',
    form_loc: 'LOCATION',
    form_msg: 'ADD MESSAGE',
    form_send: 'SEND',
    form_add: 'ADD PHOTOS',
    form_back: 'BACK TO HOME',
  },
};

let lang = (typeof localStorage !== 'undefined' && localStorage.getItem('trutta-lang')) || 'es';

export function getLang() { return lang; }

export function applyLang(l = lang) {
  lang = l === 'en' ? 'en' : 'es';
  try { localStorage.setItem('trutta-lang', lang); } catch { /* ignore */ }
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = DICT[lang][el.dataset.i18n] ?? DICT.es[el.dataset.i18n];
    if (v != null) el.innerHTML = v;
  });
  // reflect state on the toggle (active language emphasised)
  document.querySelectorAll('.site-header__lang').forEach((b) => {
    b.innerHTML = lang === 'es'
      ? '<b>ESP</b> / ENG' : 'ESP / <b>ENG</b>';
  });
}

export function toggleLang() { applyLang(lang === 'es' ? 'en' : 'es'); }
