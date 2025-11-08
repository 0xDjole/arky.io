import { defaultLocale } from '@lib/i18n';
import appConfig from '../appConfig';

/**
 * Generate static paths for all locales that have SEO slugs
 * This checks the website collection to see which locales are supported
 */
export async function getStaticPathsForLocales() {
  try {
    const res = await fetch(`${appConfig.apiUrl}/v1/businesses/${appConfig.businessId}/collections/website`);
    
    if (!res.ok) {
      console.warn('Failed to fetch website collection, generating only default locale');
      return [{ params: { locale: undefined }, props: { locale: defaultLocale } }];
    }
    
    const websiteCollection = await res.json();
    const seoSlugs = websiteCollection.seo?.slug || {};
    
    // Generate paths for each locale that has a slug
    return Object.keys(seoSlugs).map(locale => ({
      params: {
        locale: locale === defaultLocale ? undefined : locale,
      },
      props: { locale },
    }));
  } catch (error) {
    console.error('Error generating locale paths:', error);
    return [{ params: { locale: undefined }, props: { locale: defaultLocale } }];
  }
}
