import { computed, deepMap } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import { arky } from "@lib/index";
import {
	selectedMarket,
	currency,
	paymentMethods,
	paymentConfig,
	orderBlocks,
	orderConfigs,
	businessActions,
} from "./business";
import type { EshopCartItem, Block, Quote, Location } from "../types";
import { onSuccess, onError } from "@lib/utils/notify";
import { PaymentMethodType } from "../types";
import { getLocale, getLocalizedString } from "@lib/i18n";

export const cartItems = persistentAtom<EshopCartItem[]>("eshopCart", [], {
	encode: JSON.stringify,
	decode: JSON.parse,
});

export const promoCodeAtom = deepMap<string | null>(null);

export const quoteAtom = deepMap<Quote | null>(null);

export const store = deepMap({
	selectedShippingMethodId: null,
	userToken: null,
	processingCheckout: false,
	loading: false,
	error: null,
	phoneNumber: "",
	phoneError: null,
	verificationCode: "",
	verifyError: null,
	fetchingQuote: false,
	quoteError: null,
});

export const cartTotal = computed([cartItems, selectedMarket, currency], (items, market, curr) => {
	const subtotalMinor = (items || []).reduce((sum, item) => {
		const amountMinor = "amount" in item.price ? item.price.amount || 0 : 0;
		return sum + amountMinor * item.quantity;
	}, 0);

	return arky.utils.createPaymentForCheckout(
		subtotalMinor,
		market?.id || "us",
		curr || "USD",
		PaymentMethodType.Cash,
	);
});

export const cartItemCount = computed(cartItems, (items) => {
	return items.reduce((sum, item) => sum + item.quantity, 0);
});

export { currency, paymentConfig, orderBlocks, orderConfigs };

export const allowedPaymentMethods = paymentMethods;

export const actions = {
	addItem(product: any, variant: any, quantity: number = 1) {
		const items = cartItems.get();
		const market = selectedMarket.get();

		const existingItemIndex = items.findIndex(
			(item) => item.productId === product.id && item.variantId === variant.id,
		);

		if (existingItemIndex !== -1) {
			const updatedItems = [...items];
			updatedItems[existingItemIndex].quantity += quantity;
			cartItems.set(updatedItems);
		} else {
			const newItem: EshopCartItem = {
				id: crypto.randomUUID(),
				productId: product.id,
				variantId: variant.id,
				productName: getLocalizedString(product.name, getLocale()),
				productSlug:
					product.seo?.slug?.en ||
					product.seo?.slug?.[Object.keys(product.seo?.slug || {})[0]] ||
					product.id,
				variantAttributes: variant.attributes || {},
				price: {
					amount: arky.utils.getPriceAmount(variant.prices, market?.id || "us") || 0,
					market: market?.id || "us",
				},
				quantity,
				addedAt: Date.now(),
			};
			cartItems.set([...items, newItem]);
		}
	},

	updateQuantity(itemId: string, newQuantity: number) {
		const items = cartItems.get();
		cartItems.set(
			items.map((item) =>
				item.id === itemId ? { ...item, quantity: Math.max(1, newQuantity) } : item,
			),
		);
	},

	removeItem(itemId: string) {
		cartItems.set(cartItems.get().filter((item) => item.id !== itemId));
	},

	clearCart() {
		cartItems.set([]);
	},

	async checkout(
		paymentMethod: string = PaymentMethodType.Cash,
		location: Location,
		orderInfoBlocks?: Block[],
		email?: string,
		phone?: string,
	) {
		const items = cartItems.get();
		if (!items.length) {
			return { success: false, error: "Cart is empty" };
		}

		try {
			store.setKey("processingCheckout", true);
			store.setKey("error", null);

			const quote = quoteAtom.get();
			const availableShippingMethods = quote?.shippingMethods || [];

			if (!availableShippingMethods.length) {
				throw new Error("No shipping methods available. Please enter your address first.");
			}

			const state = store.get();
			const shippingMethod =
				availableShippingMethods.find((sm) => sm.id === state.selectedShippingMethodId) ||
				availableShippingMethods[0];

			// Get promo code ID from quote response (validated during quote)
			const promoCodeId = quote?.payment?.promoCode?.id || undefined;

			const response = await arky.eshop.checkout(
				{
					items: items.map((item) => ({
						productId: item.productId,
						variantId: item.variantId,
						quantity: item.quantity,
					})),
					paymentMethod,
					blocks: orderInfoBlocks || orderBlocks.get() || [],
					shippingMethodId: shippingMethod.id,
					promoCodeId,
					address: location,
					email: email || undefined,
					phone: phone || undefined,
				},
				{
					onSuccess: onSuccess("Order placed successfully!"),
					onError: onError("Failed to place order"),
				},
			);

			return {
				success: true,
				data: {
					orderId: response.orderId,
					number: response.number,
					clientSecret: response.clientSecret,
				},
			};
		} catch (err: any) {
			store.setKey("error", err.message);
			return { success: false, error: err.message };
		} finally {
			store.setKey("processingCheckout", false);
		}
	},

	async addPhoneNumber(): Promise<boolean> {
		try {
			await arky.user.addPhoneNumber(
				{ phoneNumber: store.get().phoneNumber },
				{
					onSuccess: onSuccess("Verification code sent successfully!"),
					onError: onError("Failed to send verification code"),
				},
			);
			store.setKey("phoneError", null);
			return true;
		} catch (error: any) {
			store.setKey("phoneError", error.message);
			return false;
		}
	},

	async phoneNumberConfirm(): Promise<boolean> {
		try {
			const { phoneNumber, verificationCode } = store.get();
			await arky.user.phoneNumberConfirm(
				{ phoneNumber, code: verificationCode },
				{
					onSuccess: onSuccess("Phone verified successfully!"),
					onError: onError("Failed to verify phone"),
				},
			);
			store.setKey("verifyError", null);
			return true;
		} catch (error: any) {
			store.setKey("verifyError", error.message);
			return false;
		}
	},

	async fetchQuote(location: Location, promoCode?: string | null): Promise<void> {
		const items = cartItems.get();

		if (!items?.length) {
			quoteAtom.set(null);
			return;
		}

		if (!location?.countryCode) {
			store.setKey("quoteError", "Location with country code is required for quote");
			return;
		}

		try {
			store.setKey("fetchingQuote", true);
			store.setKey("quoteError", null);

			const response = await arky.eshop.getQuote({
				items: items.map((item) => ({
					productId: item.productId,
					variantId: item.variantId,
					quantity: item.quantity,
				})),
				paymentMethod: PaymentMethodType.Cash,
				shippingMethodId: store.get().selectedShippingMethodId || undefined,
				promoCode: (promoCode !== undefined ? promoCode : promoCodeAtom.get()) || undefined,
				location,
			});

			if (response) {
				quoteAtom.set(response);
			} else {
				store.setKey("quoteError", mapQuoteError(response.code, response.error));
				quoteAtom.set(null);
			}
		} catch (error: any) {
			store.setKey("quoteError", error.message);
			quoteAtom.set(null);
		} finally {
			store.setKey("fetchingQuote", false);
		}
	},

	async applyPromoCode(code: string, location: Location): Promise<void> {
		promoCodeAtom.set(code);
		await this.fetchQuote(location, code);
	},

	async removePromoCode(location: Location): Promise<void> {
		promoCodeAtom.set(null);
		await this.fetchQuote(location, null);
	},
};

function mapQuoteError(code?: string, fallback?: string): string {
	switch (code) {
		case "PROMO.MIN_ORDER":
			return fallback || "Promo requires a higher minimum order.";
		case "PROMO.NOT_ACTIVE":
			return "Promo code is not active.";
		case "PROMO.NOT_YET_VALID":
			return "Promo code is not yet valid.";
		case "PROMO.EXPIRED":
			return "Promo code has expired.";
		case "PROMO.MAX_USES":
			return "Promo code usage limit exceeded.";
		case "PROMO.MAX_USES_PER_USER":
			return "You have already used this promo code.";
		case "PROMO.NOT_FOUND":
			return "Promo code not found.";
		default:
			return fallback || "Failed to fetch quote.";
	}
}

export function initEshopStore() {
	businessActions.init();
}

export default {
	store,
	actions,
	cartItems,
	cartTotal,
	cartItemCount,
	currency,
	allowedPaymentMethods,
	initEshopStore,
};
