// Main export file for the arky website core library

// Configuration
export * from './config';

// Types
export * from './types';
export type { 
    ApiResponse, 
    EshopCartItem, 
    EshopStoreState, 
    ReservationStoreState, 
    ReservationCartItem, 
    Business, 
    Block, 
    Price 
} from './types';

// Stores
export * from './stores/cart';
export * from './stores/eshop';
export * from './stores/reservation';
export * from './stores/business';

// Note: Utilities are now accessed via the arky SDK instance, not exported directly

// Default configuration values
export const CORE_VERSION = '1.0.0';
export const SUPPORTED_FRAMEWORKS = ['astro', 'react', 'vue', 'svelte', 'vanilla'] as const;

// Core initialization function
export function initArkyCore(config?: {
    businessId?: string;
    apiUrl?: string;
}) {
}