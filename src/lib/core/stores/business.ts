// Unified Business Store - Single Source of Truth
import { computed, deepMap } from "nanostores";
import { BUSINESS_ID } from "../config";
import { arky } from "@lib/index";
import type {
	Business,
	Market,
	ShippingMethod,
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

// Get market by country code (supports wildcard "*" for global zones)
export const getMarketByCountry = (countryCode: string): Market | null => {
	const allMarkets = markets.get();
	const upperCode = countryCode.toUpperCase();
	
	return (
		allMarkets.find(
			(market) =>
				(market.zones || []).some(z => z.code === '*' || z.code.toUpperCase() === upperCode)
		) || null
	);
};

// Get shipping methods for a specific country (from market's shipping methods filtered by zone)
export const getShippingMethodsForCountry = (countryCode: string): ShippingMethod[] => {
	const market = getMarketByCountry(countryCode);
	if (!market) return [];
	
	// Find the zone for this country
	const upperCode = countryCode.toUpperCase();
	const zone = market.zones?.find(z => z.code === upperCode || z.code === '*');
	if (!zone) return [];
	
	// Return shipping methods from market that are enabled in this zone
	const availableMethodIds = zone.shippingMethodIds || [];
	return (market.shippingMethods || []).filter(sm => availableMethodIds.includes(sm.id));
};

export const paymentMethods = computed(selectedMarket, (market) => {
	if (!market) return [];
	// Get unique payment method types from all payment method configs
	const methods = market.paymentMethods || [];
	return methods.map((pm: any) => pm.method);
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
