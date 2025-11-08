import { arky } from '@lib/arky';
import { defaultLocale, locales } from '@lib/i18n';
import appConfig from '../appConfig';

/**
 * Get locales that have website collection with proper SEO slug
 * Only generates routes for locales that are fully supported
 */
export async function getSupportedLocales(): Promise<string[]> {
  try {
    // Fetch website collection to check which locales have slugs
    const res = await fetch(`${appConfig.apiUrl}/v1/businesses/${appConfig.businessId}/collections/website`);
    
    if (!res.ok) {
      console.warn('Failed to fetch website collection, defaulting to en only');
      return [defaultLocale];
    }
    
    const websiteCollection = await res.json();
    const availableSlugs = Object.keys(websiteCollection.seo?.slug || {});
    
    // Only return locales that have slugs in website collection
    return locales.filter(locale => availableSlugs.includes(locale));
  } catch (error) {
    console.error('Error checking supported locales:', error);
    return [defaultLocale]; // Fallback to default locale only
  }
}
