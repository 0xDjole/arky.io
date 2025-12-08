import { computed, deepMap } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import { arky } from "@lib/index";
import {
	selectedMarket,
	currency,
	paymentMethods,
	paymentConfig,
	orderBlocks,
	businessActions,
} from "./business";
import type { EshopCartItem, EshopStoreState, Block, Price, Payment, Quote, Location } from "../types";
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
	shippingLocation: null,
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
		let amountMinor = 0;
		if ("amount" in item.price) {
			amountMinor = item.price.amount || 0;
		}
		return sum + amountMinor * item.quantity;
	}, 0);

	if (!market?.id || !curr) {
		throw new Error("Market and currency must be configured");
	}

	return arky.utils.createPaymentForCheckout(
		subtotalMinor,
		market.id,
		curr,
		PaymentMethodType.Cash,
	);
});

export const cartItemCount = computed(cartItems, (items) => {
	return items.reduce((sum, item) => sum + item.quantity, 0);
});

export { currency, paymentConfig, orderBlocks };

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
			if (!variant.prices || !Array.isArray(variant.prices)) {
				throw new Error("Product variant has no prices configured");
			}

			if (!market?.id) {
				throw new Error("No market selected");
			}

			const marketAmount = arky.utils.getPriceAmount(variant.prices, market.id);
			if (marketAmount === null || marketAmount === undefined) {
				throw new Error(`No price configured for market: ${market.id}`);
			}

			const cartPrice: Price = {
				amount: marketAmount,
				market: market.id,
			};

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
				price: cartPrice,
				quantity,
				addedAt: Date.now(),
			};

			cartItems.set([...items, newItem]);
		}
	},

	updateQuantity(itemId: string, newQuantity: number) {
		const items = cartItems.get();
		const updatedItems = items.map((item) =>
			item.id === itemId ? { ...item, quantity: Math.max(1, newQuantity) } : item,
		);
		cartItems.set(updatedItems);
	},

	removeItem(itemId: string) {
		const items = cartItems.get();
		const updatedItems = items.filter((item) => item.id !== itemId);
		cartItems.set(updatedItems);
	},

	clearCart() {
		cartItems.set([]);
	},

	prepareOrderItems() {
		const items = cartItems.get();
		return items.map((item) => ({
			productId: item.productId,
			variantId: item.variantId,
			quantity: item.quantity,
		}));
	},

	getOrderInfoBlocks(): Block[] {
		return orderBlocks.get() || [];
	},

	async checkout(
		paymentMethod: string = PaymentMethodType.Cash,
		location: Location,
		orderInfoBlocks?: Block[],
		promoCode?: string | null,
	) {
		const items = cartItems.get();
		if (!items.length) {
			return { success: false, error: "Cart is empty" };
		}

		try {
			store.setKey("processingCheckout", true);
			store.setKey("error", null);

			const orderItems = this.prepareOrderItems();
			const blocks = orderInfoBlocks || this.getOrderInfoBlocks();
			const state = store.get();

			const market = selectedMarket.get();
			if (!market) {
				throw new Error("No market selected");
			}

			if (!location?.countryCode) {
				throw new Error("Location with country code is required for checkout");
			}

			const quote = quoteAtom.get();
			const availableShippingMethods = quote?.shippingMethods || [];

			if (!availableShippingMethods || availableShippingMethods.length === 0) {
				throw new Error(`No shipping methods available. Please enter your address first.`);
			}

			const shippingMethodId = state.selectedShippingMethodId;
			const shippingMethod =
				availableShippingMethods.find((sm) => sm.id === shippingMethodId) ||
				availableShippingMethods[0];

			if (!shippingMethod) {
				throw new Error("No shipping method available");
			}

			const promo = promoCode !== undefined ? promoCode : promoCodeAtom.get();

			const response = await arky.eshop.checkout(
				{
					items: orderItems,
					paymentMethod: paymentMethod,
					blocks,
					shippingMethodId: shippingMethod.id,
					promoCode: promo || undefined,
					location,
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
			const errorMessage = `Checkout failed: ${err.message}`;
			store.setKey("error", errorMessage);
			console.error("Checkout error:", err);
			return { success: false, error: errorMessage };
		} finally {
			store.setKey("processingCheckout", false);
		}
	},

	async addPhoneNumber(): Promise<boolean> {
		try {
			const phoneNumber = store.get().phoneNumber;

			await arky.user.addPhoneNumber(
				{ phoneNumber },
				{
					onSuccess: onSuccess("Verification code sent successfully!"),
					onError: onError("Failed to send verification code"),
				},
			);
			store.setKey("phoneError", null);
			return true;
		} catch (error: any) {
			console.error("Phone update error:", error);
			store.setKey("phoneError", error.message);
			return false;
		}
	},

	async phoneNumberConfirm(): Promise<boolean> {
		try {
			const phoneNumber = store.get().phoneNumber;
			const verificationCode = store.get().verificationCode;

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
			console.error("Phone verification error:", error);
			store.setKey("verifyError", error.message);
			return false;
		}
	},

	formatPrice(priceOrPayment: Price | Payment): string {
		const currencyCode = currency.get();

		if ("total" in (priceOrPayment as any)) {
			return arky.utils.formatPayment(priceOrPayment as Payment, {
				showSymbols: true,
				decimalPlaces: 2,
			});
		}
		return arky.utils.formatMinor((priceOrPayment as Price).amount || 0, currencyCode);
	},

	getCartPayment(): Payment {
		const items = cartItems.get();
		const market = selectedMarket.get();
		const currencyCode = currency.get();

		if (!market?.id || !currencyCode) {
			throw new Error("Market and currency must be configured");
		}

		if (!items || items.length === 0) {
			return arky.utils.createPaymentForCheckout(
				0,
				market.id,
				currencyCode,
				PaymentMethodType.Cash,
			);
		}

		const subtotalMinor = items.reduce((sum, item) => {
			let amountMinor = 0;
			if ("amount" in item.price) {
				amountMinor = item.price.amount || 0;
			}
			return sum + amountMinor * item.quantity;
		}, 0);

		return arky.utils.createPaymentForCheckout(
			subtotalMinor,
			market.id,
			currencyCode,
			PaymentMethodType.Cash,
		);
	},

	getAvailablePaymentMethods(): string[] {
		const methods = paymentMethods.get();
		if (!methods || methods.length === 0) {
			throw new Error("No payment methods configured for selected market");
		}
		return methods;
	},

	getShippingMethods() {
		const quote = quoteAtom.get();
		return quote?.shippingMethods || [];
	},

	getPaymentMethods() {
		const quote = quoteAtom.get();
		return quote?.paymentMethods || [];
	},

	async fetchQuote(location: Location, promoCode?: string | null): Promise<void> {
		const items = cartItems.get();
		const market = selectedMarket.get();
		const state = store.get();
		const promo = promoCode !== undefined ? promoCode : promoCodeAtom.get();

		if (!items || items.length === 0) {
			quoteAtom.set(null);
			return;
		}

		if (!market) {
			console.error("No market selected for quote");
			return;
		}

		if (!location?.countryCode) {
			store.setKey("quoteError", "Location with country code is required for quote");
			return;
		}

		try {
			store.setKey("fetchingQuote", true);
			store.setKey("quoteError", null);

			const shippingMethodId = state.selectedShippingMethodId || undefined;

			const response = await arky.eshop.getQuote({
				items: items.map((item) => ({
					productId: item.productId,
					variantId: item.variantId,
					quantity: item.quantity,
				})),
				paymentMethod: PaymentMethodType.Cash,
				shippingMethodId,
				promoCode: promo || undefined,
				location,
			});

			if (response) {
				quoteAtom.set(response);
			} else {
				const friendly = mapQuoteError(response.code, response.error);
				store.setKey("quoteError", friendly);
				quoteAtom.set(null);
			}
		} catch (error: any) {
			console.error("Quote fetch error:", error);
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
