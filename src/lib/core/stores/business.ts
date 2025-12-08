import { computed, deepMap } from "nanostores";
import { BUSINESS_ID } from "../config";
import { arky } from "@lib/index";
import type { Business, Zone } from "../types";

export const businessStore = deepMap({
	data: null as Business | null,
	loading: false,
	error: null as string | null,
	initialized: false,
});

export const selectedMarket = computed(businessStore, (state) => {
	if (!state.data?.configs?.markets) return null;
	const markets = state.data.configs.markets;
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

export const zones = computed(businessStore, (state) => {
	if (!state.data?.configs?.zones) return [];
	return state.data.configs.zones;
});

export const getZonesForMarket = (marketId: string): Zone[] => {
	const allZones = zones.get();
	return allZones.filter(z => z.marketId === marketId);
};

export const paymentMethods = computed(selectedMarket, (market) => {
	if (!market) return [];

	const marketZones = getZonesForMarket(market.id);
	if (marketZones.length === 0) return [];

	const allMethodTypes = new Set<string>();
	marketZones.forEach(zone => {
		(zone.paymentMethods || []).forEach(pm => allMethodTypes.add(pm.type));
	});

	return Array.from(allMethodTypes);
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

export const businessActions = {
	async init(): Promise<void> {
		const state = businessStore.get();
		if (state.initialized && state.data) {
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

	reset(): void {
		businessStore.setKey("data", null);
		businessStore.setKey("loading", false);
		businessStore.setKey("error", null);
		businessStore.setKey("initialized", false);
	},

	async getBusiness(): Promise<Business | null> {
		const state = businessStore.get();
		if (!state.initialized || !state.data) {
			await this.init();
		}
		return businessStore.get().data;
	},
};

export { businessStore as store, businessActions as actions };
