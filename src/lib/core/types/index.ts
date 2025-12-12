// Re-export all types from SDK - single source of truth
export {
	type Payment,
	type PaymentMethod,
	type PaymentProviderConfig,
	PaymentMethodType,
	type Quote,
	type PromoCodeValidation,
	type Price,
	type Location,
	type EshopCartItem,
	type ReservationCartItem,
	type ShippingWeightTier,
	type ShippingMethod,
	type Zone,
	type Market,
	type BusinessConfig,
	type Business,
	type EshopStoreState,
	type Block,
	type ApiResponse,
	type PaginatedResponse,
	type ReservationStoreState,
} from "arky-sdk";

// arky.io-specific types (not in SDK)
export interface Newsletter {
	id: string;
	businessId: string;
	name: string;
	description: string;
	newsletterType: "FREE" | "PAID";
	statuses: any[];
	prices: import("arky-sdk").Price[];
	paymentProduct?: {
		priceId: string;
	};
	unsubscribeRedirectUrl: string;
	createdAt: number;
	updatedAt: number;
}
