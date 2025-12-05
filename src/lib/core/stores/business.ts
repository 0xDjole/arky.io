import { computed, deepMap } from "nanostores";
import { BUSINESS_ID } from "../config";
import { arky } from "@lib/index";
import type {
	Business,
	Market,
	ShippingMethod,
	ZoneResolvedShippingMethod,
	Zone,
	PaymentMethod,
	PaymentProviderConfig,
} from "../types";
import { PaymentMethodType } from "../types";

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

export const shippingMethodDefinitions = computed(businessStore, (state) => {
	if (!state.data?.configs?.shippingMethods) return [];
	return state.data.configs.shippingMethods;
});

export const paymentMethodDefinitions = computed(businessStore, (state) => {
	if (!state.data?.configs?.paymentMethods) return [];
	return state.data.configs.paymentMethods;
});

export const getZonesForMarket = (marketId: string): Zone[] => {
	const allZones = zones.get();
	return allZones.filter(z => z.marketId === marketId);
};

export const getZoneForCountry = (countryCode: string): Zone | null => {
	const market = selectedMarket.get();
	if (!market) return null;

	const marketZones = getZonesForMarket(market.id);
	if (marketZones.length === 0) return null;

	const upperCode = countryCode?.toUpperCase();

	const countryZone = marketZones.find(z =>
		z.countries.some(c => c.toUpperCase() === upperCode)
	);
	if (countryZone) return countryZone;

	const globalZone = marketZones.find(z => z.countries.length === 0);
	return globalZone || null;
};

export const getZoneIdForCountry = (countryCode: string): string | null => {
	const zone = getZoneForCountry(countryCode);
	return zone?.id || null;
};

export const getShippingMethodsForCountry = (countryCode: string): ZoneResolvedShippingMethod[] => {
	const masterShippingMethods = shippingMethodDefinitions.get();
	if (!masterShippingMethods || masterShippingMethods.length === 0) return [];

	const zone = getZoneForCountry(countryCode);
	if (!zone) return [];

	const zoneShippingMethods = zone.shippingMethods || [];
	return zoneShippingMethods.map(zsm => {
		const baseMethod = masterShippingMethods.find(sm => sm.id === zsm.id);
		if (!baseMethod) return null;

		return {
			...baseMethod,
			zoneAmount: zsm.amount,
		} as ZoneResolvedShippingMethod;
	}).filter((sm): sm is ZoneResolvedShippingMethod => sm !== null);
};

export const getPaymentMethodsForCountry = (countryCode: string): string[] => {
	const zone = getZoneForCountry(countryCode);
	const masterPaymentMethods = paymentMethodDefinitions.get();

	if (!zone || !masterPaymentMethods) return [];

	const paymentMethodIds = zone.paymentMethods || [];
	return masterPaymentMethods
		.filter(pm => paymentMethodIds.includes(pm.id))
		.map(pm => pm.type);
};

export const paymentMethods = computed(selectedMarket, (market) => {
	if (!market) return [];

	const masterPaymentMethods = paymentMethodDefinitions.get();
	if (!masterPaymentMethods) return [];

	const marketZones = getZonesForMarket(market.id);
	if (marketZones.length > 0) {
		const allMethodIds = new Set<string>();
		marketZones.forEach(zone => {
			(zone.paymentMethods || []).forEach(pmId => allMethodIds.add(pmId));
		});

		return masterPaymentMethods
			.filter(pm => allMethodIds.has(pm.id))
			.map(pm => pm.type);
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
