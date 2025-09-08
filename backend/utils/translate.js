const translatte = require('translatte');

// In-memory cache (optional, remove if not needed)
const translationCache = new Map();

async function translateText(text, targetLang, sourceLang = 'en') {
  if (!text || targetLang === sourceLang) return text;

  // Check in-memory cache (optional)
  const cacheKey = `${text}:${sourceLang}:${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const { text: translated } = await translatte(text, { from: sourceLang, to: targetLang });
    translationCache.set(cacheKey, translated); // Store in cache (optional)
    return translated;
  } catch (error) {
    console.error('Translation failed:', error.message);
    return text; // Fallback to original
  }
}

module.exports = { translateText };