// Unified Business Store - Single Source of Truth
import { computed, deepMap } from "nanostores";
import { BUSINESS_ID } from "../config";
import { arky } from "@lib/index";
import type {
	Business,
	Market,
	ShippingMethod,
	ZoneResolvedShippingMethod,
	MarketZone,
	BusinessPaymentMethod,
	PaymentProviderConfig,
} from "../types";
import { PaymentMethod } from "../types";

// Core business state
export const businessStore = deepMap({
	data: null as Business | null,
	loading: false,
	error: null as string | null,
	initialized: false,
});

// Computed values derived from business data
export const selectedMarket = computed(businessStore, (state) => {
	if (!state.data?.configs?.markets) return null;

	const markets = state.data.configs.markets;
	// For arky website, always use 'us' market
	return markets.find((m) => m.id === "us") || null;
});

export const currency = computed(selectedMarket, (market) => {
	return market?.currency || "USD";
});

export const currencySymbol = computed(selectedMarket, (market) => {
	return arky.utils.getCurrencySymbol(market?.currency || "USD");
});

export const markets = computed(businessStore, (state) => {
	if (!state.data?.configs?.markets) return [];
	return state.data.configs.markets;
});

export const zoneDefinitions = computed(businessStore, (state) => {
	if (!state.data?.configs?.zones) return [];
	return state.data.configs.zones;
});

export const shippingMethodDefinitions = computed(businessStore, (state) => {
	if (!state.data?.configs?.shippingMethods) return [];
	return state.data.configs.shippingMethods;
});

export const paymentMethodDefinitions = computed(businessStore, (state) => {
	if (!state.data?.configs?.paymentMethods) return [];
	return state.data.configs.paymentMethods;
});

// Get market by country code (supports wildcard "*" for global zones)
export const getMarketByCountry = (countryCode: string): Market | null => {
	const allMarkets = markets.get();
	const upperCode = countryCode.toUpperCase();

	return (
		allMarkets.find(
			(market) =>
				(market.zones || []).some(z => z.zoneId === '*' || z.zoneId.toUpperCase() === upperCode)
		) || null
	);
};

// Get zone for a specific country (arky.io custom logic)
// If country-specific zone exists, use it. Otherwise fallback to "global"
export const getZoneForCountry = (countryCode: string): MarketZone | null => {
	const market = selectedMarket.get();
	if (!market || !market.zones || market.zones.length === 0) return null;

	const upperCode = countryCode?.toUpperCase();

	// Try to find country-specific zone
	const countryZone = market.zones.find(z => z.zoneId.toUpperCase() === upperCode);
	if (countryZone) return countryZone;

	// Fallback to global zone
	const globalZone = market.zones.find(z => z.zoneId === 'global');
	return globalZone || null;
};

// Get zone ID for a specific country
export const getZoneIdForCountry = (countryCode: string): string | null => {
	const zone = getZoneForCountry(countryCode);
	return zone?.zoneId || null;
};

// Get shipping methods for a specific country (from market's shipping methods filtered by zone)
// Returns shipping methods enriched with zone-specific pricing
export const getShippingMethodsForCountry = (countryCode: string): ZoneResolvedShippingMethod[] => {
	const market = selectedMarket.get();
	const masterShippingMethods = shippingMethodDefinitions.get();

	if (!market || !market.zones || market.zones.length === 0) return [];
	if (!masterShippingMethods || masterShippingMethods.length === 0) return [];

	// Get zone for this country (with global fallback)
	const zone = getZoneForCountry(countryCode);
	if (!zone) return [];

	// Map zone shipping methods to full shipping method objects with zone-specific pricing
	const zoneShippingMethods = zone.shippingMethods || [];
	return zoneShippingMethods.map(zsm => {
		const baseMethod = masterShippingMethods.find(sm => sm.id === zsm.id);
		if (!baseMethod) return null;

		// Return shipping method with zone-specific pricing
		return {
			...baseMethod,
			zoneAmount: zsm.amount, // Zone-specific price in minor units
		} as ZoneResolvedShippingMethod;
	}).filter((sm): sm is ZoneResolvedShippingMethod => sm !== null);
};

// Get payment methods for a specific country (from zone)
export const getPaymentMethodsForCountry = (countryCode: string): string[] => {
	const zone = getZoneForCountry(countryCode);
	const masterPaymentMethods = paymentMethodDefinitions.get();

	if (!zone || !masterPaymentMethods) return [];

	// Get payment method IDs from zone and map to actual method types
	const paymentMethodIds = (zone.paymentMethods || []).map(pm => pm.id);
	return masterPaymentMethods
		.filter(pm => paymentMethodIds.includes(pm.id))
		.map(pm => pm.method);
};

export const paymentMethods = computed(selectedMarket, (market) => {
	if (!market) return [];

	const masterPaymentMethods = paymentMethodDefinitions.get();
	if (!masterPaymentMethods) return [];

	// Aggregate all unique payment method IDs from all zones
	if (market.zones && market.zones.length > 0) {
		const allMethodIds = new Set<string>();
		market.zones.forEach(zone => {
			(zone.paymentMethods || []).forEach(pm => allMethodIds.add(pm.id));
		});

		// Map IDs to actual method types
		return masterPaymentMethods
			.filter(pm => allMethodIds.has(pm.id))
			.map(pm => pm.method);
	}

	return [];
});

export const paymentConfig = computed(businessStore, (state) => {
	if (!state.data?.configs) return { provider: null, enabled: false };

	const provider = state.data.configs.paymentProvider || null;
	const hasCreditCard = paymentMethods.get().includes("CREDIT_CARD");

	return {
		provider,
		enabled: hasCreditCard && !!provider,
	};
});

export const orderBlocks = computed(businessStore, (state) => {
	return state.data?.configs?.orderBlocks || [];
});

export const reservationBlocks = computed(businessStore, (state) => {
	return state.data?.configs?.reservationBlocks || [];
});

// Actions
export const businessActions = {
	// Initialize business data - SINGLE API CALL for entire app
	async init(): Promise<void> {
		const state = businessStore.get();
		if (state.initialized && state.data) {
			// Already loaded, skip
			return;
		}

		try {
			businessStore.setKey("loading", true);
			businessStore.setKey("error", null);

		const data = await arky.business.getBusiness({});

			businessStore.setKey("data", data);
			businessStore.setKey("initialized", true);
		} catch (error: any) {
			businessStore.setKey("error", error.message);
			console.error("Business store initialization failed:", error);
		} finally {
			businessStore.setKey("loading", false);
		}
	},

	// Reset store (useful for testing)
	reset(): void {
		businessStore.setKey("data", null);
		businessStore.setKey("loading", false);
		businessStore.setKey("error", null);
		businessStore.setKey("initialized", false);
	},

	// Get business data (with auto-init)
	async getBusiness(): Promise<Business | null> {
		const state = businessStore.get();
		if (!state.initialized || !state.data) {
			await this.init();
		}
		return businessStore.get().data;
	},
};

// Export everything for easy access
export { businessStore as store, businessActions as actions };

// NOTE: Business store is initialized on-demand by calling businessActions.init()
// It's called automatically by initEshopStore() and initReservationStore()
