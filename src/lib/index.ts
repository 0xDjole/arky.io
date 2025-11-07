import { arky } from "./arky";
import appConfig from "../appConfig";
import type { Block, ApiResponse } from "arky-sdk";

export type { Block, ApiResponse };

// Re-export arky instance for easy access
export { arky };

// Re-export all utilities from arky instance
export const getBlockLabel = arky.utils.getBlockLabel;
export const getBlockTextValue = arky.utils.getBlockTextValue;
export const getBlockValue = arky.utils.getBlockValue;
export const getBlockValues = arky.utils.getBlockValues;
export const getBlockObjectValues = arky.utils.getBlockObjectValues;
export const getBlockFromArray = arky.utils.getBlockFromArray;
export const formatBlockValue = arky.utils.formatBlockValue;
export const prepareBlocksForSubmission = arky.utils.prepareBlocksForSubmission;
export const extractBlockValues = arky.utils.extractBlockValues;
export const getImageUrl = arky.utils.getImageUrl;

// arky.io-specific utilities
export { getGalleryThumbnail, getFirstGalleryMedia } from "./utils/gallery";

/**
 * Helper function to format collection query with business ID and locale
 * Converts "website" to "business_id:locale:website" format for slug queries
 * @param slug - The collection slug (e.g., "website")
 * @param locale - The locale code (e.g., "en", "sr-latn")
 * @returns Formatted query string "business_id:locale:slug"
 */
export function formatCollectionQuery(slug: string, locale: string = "en"): string {
	return `${appConfig.businessId}:${locale}:${slug}`;
}
