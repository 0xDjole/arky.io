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
export { getGalleryThumbnail, getFirstGalleryMedia } from './utils/gallery';
