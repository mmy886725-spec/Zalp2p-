/*
 * ZALP2P central language manager
 * تم إصلاحه ليتوافق مع جدول profiles
 */
(function () {
  'use strict';

  const LANGUAGES = {
    ar: { label: 'العربية', dir: 'rtl' },
    en: { label: 'English', dir: 'ltr' },
    es: { label: 'Español', dir: 'ltr' },
    tr: { label: 'Türkçe', dir: 'ltr' },
    fr: { label: 'Français', dir: 'ltr' }
  };
  const DEFAULT_LANGUAGE = 'ar';
  const TRANSLATION_FILES = {
    ar: 'ar.js',
    en: 'en.js',
    es: 'es.js',
    tr: 'tr.js',
    fr: 'fr.js'
  };

  let activeLanguage = DEFAULT_LANGUAGE;
  let translationsLoaded = false;

  function getSupabaseClient() {
    if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
      return window.supabaseClient;
    }
    if (window.sb && typeof window.sb.from === 'function') return window.sb;
    try {
      if (typeof supabase !== 'undefined' && supabase && typeof supabase.from === 'function') {
        return supabase;
      }
    } catch (_) {}
    return null;
  }

  function getNestedValue(object, key) {
    if (!object || !key) return undefined;
    if (Object.prototype.hasOwnProperty.call(object, key)) return object[key];
    return key.split('.').reduce((value, part) => value && value[part] !== undefined ? value[part] : undefined, object);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-zal-language-file="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === 'true') return resolve();
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.zalLanguageFile = src;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error('Could not load translation file: ' + src));
      document.head.appendChild(script);
    });
  }

  async function loadAllTranslations() {
    if (translationsLoaded) return;
    const results = await Promise.allSettled(
      Object.values(TRANSLATION_FILES).map(loadScript)
    );
    const missing = results.filter(result => result.status === 'rejected');
    if (missing.length) {
      console.error('[ZAL language] Some translation files could not be loaded.', missing);
    }
    window.ZAL_TRANSLATIONS = window.ZAL_TRANSLATIONS || {};
    translationsLoaded = true;
  }

  function translateElementText(element, value) {
    const textNodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    const lastTextNode = textNodes[textNodes.length - 1];
    if (lastTextNode) {
      lastTextNode.nodeValue = value;
    } else {
      element.appendChild(document.createTextNode(value));
    }
  }
function translateKey(key) {
  const dictionary =
    window.ZAL_TRANSLATIONS &&
    window.ZAL_TRANSLATIONS[activeLanguage];

  const value = getNestedValue(dictionary, key);

  return typeof value === 'string' ? value : key;
}
  function applyTranslations(language) {
    const dictionary = window.ZAL_TRANSLATIONS && window.ZAL_TRANSLATIONS[language];
    if (!dictionary) {
      console.warn('[ZAL language] No dictionary found for:', language);
      return;
    }

    document.documentElement.lang = language;
    document.documentElement.dir = LANGUAGES[language]?.dir || 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const value = getNestedValue(dictionary, key);
      if (typeof value === 'string') translateElementText(element, value);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const value = getNestedValue(dictionary, element.getAttribute('data-i18n-placeholder'));
      if (typeof value === 'string') element.setAttribute('placeholder', value);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const value = getNestedValue(dictionary, element.getAttribute('data-i18n-title'));
      if (typeof value === 'string') element.setAttribute('title', value);
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
      const value = getNestedValue(dictionary, element.getAttribute('data-i18n-aria-label'));
      if (typeof value === 'string') element.setAttribute('aria-label', value);
    });

    activeLanguage = language;
    document.dispatchEvent(new CustomEvent('zal:languageChanged', {
      detail: { language, translations: dictionary }
    }));
  }

  async function getSavedLanguageFromSupabase() {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData?.user) return null;

      // ✅ تم التعديل هنا: profiles بدلاً من users
      const { data, error } = await client
        .from('profiles')
        .select('language')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (error) {
        console.warn('[ZAL language] Could not read profiles.language:', error.message);
        return null;
      }
      const language = String(data?.language || '').toLowerCase();
      return Object.prototype.hasOwnProperty.call(LANGUAGES, language) ? language : null;
    } catch (error) {
      console.warn('[ZAL language] Failed to read saved language:', error);
      return null;
    }
  }

  async function saveLanguageToSupabase(language) {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData?.user) return false;
      
      // ✅ تم التعديل هنا: profiles بدلاً من users
      const { error } = await client
        .from('profiles')
        .update({ language })
        .eq('id', authData.user.id);
        
      if (error) {
        console.warn('[ZAL language] Could not save profiles.language:', error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.warn('[ZAL language] Failed to save language:', error);
      return false;
    }
  }

  async function init() {
    await loadAllTranslations();

    const fromSupabase = await getSavedLanguageFromSupabase();
    let language = fromSupabase;
    if (!language) {
      try {
        const local = localStorage.getItem('zal-language');
        if (local && LANGUAGES[local]) language = local;
      } catch (_) {}
    }
    if (!language) {
      const browser = (navigator.language || 'ar').slice(0, 2).toLowerCase();
      language = LANGUAGES[browser] ? browser : DEFAULT_LANGUAGE;
    }

    applyTranslations(language);
  }

  // Public API for pages/scripts
  window.ZALLanguage = {
    init,
    apply: async (language) => {
      if (!LANGUAGES[language]) return;
      applyTranslations(language);
      try { localStorage.setItem('zal-language', language); } catch (_) {}
      await saveLanguageToSupabase(language);
    },
    getLanguage: () => activeLanguage,
    getTranslations: () => window.ZAL_TRANSLATIONS?.[activeLanguage] || {},
    refresh: () => applyTranslations(activeLanguage)
  };window.translateKey = translateKey;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
