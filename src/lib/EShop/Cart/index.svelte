<script lang="ts">
	import { onMount, } from 'svelte';
	import { showToast } from '@lib/toast.js';
	import { cartItems,  cartItemCount, store, actions, initEshopStore, currency, allowedPaymentMethods, orderBlocks as businessOrderBlocks, orderConfigs, paymentConfig, quoteAtom } from '@lib/core/stores/eshop';
	import { selectedMarket } from '@lib/core/stores/business';
	import { arky } from '@lib/index';
	import QuantitySelector from '@lib/EShop/QuantitySelector/index.svelte';
	import AttributeBlocks from '@lib/EShop/AttributeBlocks/index.svelte';
	import DynamicForm from '@lib/DynamicForm/index.svelte';
	import LocationInput from '@lib/DynamicForm/Location.svelte';
	import Icon from '@iconify/svelte';
	import PaymentForm from '@lib/shared/PaymentForm/index.svelte';
	import QuoteSummary from '@lib/shared/QuoteSummary/index.svelte';
	import PromoCode from '@lib/shared/PromoCode/index.svelte';
	import type { Location } from '@lib/core/types';

	let appliedPromoCode = $state<string | null>(null);

	let showCheckoutSection = $state(false);
	let checkoutFormData = $state({});
	let selectedPaymentMethod: string = $state('CASH');
	let paymentProcessing = $state(false);
	let paymentError = $state(null);
	let orderBlocks = $state([]);
	let confirmPayment = null;
	let formValid = $state(false);
	let formErrors = $state([]);
	let paymentFormValid = $state(false);
	let selectedShippingMethodId = $derived($store.selectedShippingMethodId);

	let locationData = $state<Location>({});
	let email = $state('');
	let phone = $state('');
	let emailError = $state<string | null>(null);
	let phoneError = $state<string | null>(null);

	const emailValid = $derived(() => {
		if (!$orderConfigs?.isEmailRequired) return true;
		if (!email) return false;
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	});

	const phoneValid = $derived(() => {
		if (!$orderConfigs?.isPhoneRequired) return true;
		return phone.length >= 6;
	});

    // Check if all required location fields are filled
    const locationComplete = $derived(
        locationData?.countryCode &&
        locationData?.city &&
        locationData?.postalCode &&
        locationData?.address
    );

    // Get shipping/payment methods from quote response (fetched from backend based on zone)
    const availableShippingMethods = $derived($quoteAtom?.shippingMethods || []);
    const availablePaymentMethods = $derived(($quoteAtom?.paymentMethods || []).map(pm => pm.type));

    $effect(() => {
        if (availableShippingMethods.length > 0 && selectedShippingMethodId) {
            const stillValid = availableShippingMethods.some(m => m.id === selectedShippingMethodId);
            if (!stillValid) {
                store.setKey('selectedShippingMethodId', null);
            }
        }
    });

	function handleValidationChange(isValid, errors) {
		formValid = isValid;
		formErrors = errors;
	}

	function handlePaymentValidationChange(isValid) {
		paymentFormValid = isValid;
	}

	const isCompletelyValid = $derived(formValid && locationComplete && emailValid() && phoneValid() && (selectedPaymentMethod === 'CASH' || paymentFormValid));

	async function handlePhoneSendCode(blockId, phone) {
		store.setKey('phoneNumber', phone);
		return await actions.addPhoneNumber();
	}

	async function handlePhoneVerifyCode(blockId, code) {
		store.setKey('verificationCode', code);
		return await actions.phoneNumberConfirm();
	}

function formatLinePrice(item) {
		const currencyValue = $currency;
		if (item?.price && 'amount' in item.price) {
			const minor = (item.price.amount || 0) * item.quantity;
			return arky.utils.formatMinor(minor, currencyValue);
		}
		return '';
	}

	function handleQuantityUpdate(itemId, newQuantity) {
		actions.updateQuantity(itemId, newQuantity);
		refreshQuote();
	}

	function handleRemoveItem(itemId) {
		actions.removeItem(itemId);
		refreshQuote();
	}

	function handleProceedToCheckout() {
		if ($cartItems.length === 0) {
			showToast('Cart is empty', 'error', 3000);
			return;
		}
		showCheckoutSection = true;
	}

async function handleApplyPromoCode(code: string) {
    const candidate = (code || '').trim();
    if (!candidate || !locationData) return;

    const prevPromo = appliedPromoCode;
    appliedPromoCode = candidate;
    await actions.fetchQuote(locationData, candidate);

    const err = $store.quoteError;
    if (!err) {
        showToast(`Promo code "${candidate}" applied`, 'success', 3000);
    } else {
        appliedPromoCode = prevPromo;
        showToast(err, 'error', 4000);
    }
}

	function handleRemovePromoCode() {
		appliedPromoCode = null;
		if (locationData) {
			actions.fetchQuote(locationData, null);
		}
		showToast('Promo code removed', 'success', 2000);
	}

	function refreshQuote() {
		if ($cartItems.length > 0 && locationData?.countryCode) {
			actions.fetchQuote(locationData, appliedPromoCode);
		}
	}

	async function handleCheckoutComplete() {
		if (!isCompletelyValid) {
			if (!formValid) {
				showToast('Please fix the form errors before placing order', 'error', 4000);
			} else if (!emailValid()) {
				showToast('Please enter a valid email address', 'error', 4000);
			} else if (!phoneValid()) {
				showToast('Please enter a valid phone number', 'error', 4000);
			} else if (selectedPaymentMethod === 'CREDIT_CARD' && !paymentFormValid) {
				showToast('Please complete payment information before placing order', 'error', 4000);
			}
			return;
		}

		paymentProcessing = true;
		paymentError = null;

		try {
			const checkoutResponse = await actions.checkout(selectedPaymentMethod, locationData, orderBlocks, email || undefined, phone || undefined);

			if (!checkoutResponse.success) {
				throw new Error(checkoutResponse.error || 'Failed to create order');
			}

			const { orderId, clientSecret } = checkoutResponse.data;

			if (selectedPaymentMethod === 'CASH') {
				showToast('Order placed successfully! Pay on delivery.', 'success', 6000);
				showCheckoutSection = false;
				actions.clearCart();
				return;
			}

			if (selectedPaymentMethod === 'CREDIT_CARD') {
				if (!confirmPayment) {
					throw new Error('Payment system not ready');
				}

				if (!clientSecret) {
					throw new Error('No payment client secret received');
				}

				const { error, paymentIntent } = await confirmPayment(clientSecret);

				if (error) {
					throw new Error(`Payment failed: ${error.message}`);
				}

				if (paymentIntent.status === 'succeeded') {
					showToast('Payment successful! Order confirmed.', 'success', 6000);
				} else {
					throw new Error('Payment was not completed successfully');
				}
			}

			showCheckoutSection = false;
			checkoutFormData = {};
			selectedPaymentMethod = 'CASH';
			actions.clearCart();

		} catch (error) {
			let errorMessage = 'Checkout failed. Please try again.';

			if (error.message) {
				try {
					const parsed = JSON.parse(error.message);
					errorMessage = parsed.reason || parsed.error || error.message;
				} catch {
					errorMessage = error.message;
				}
			}

			paymentError = errorMessage;
			showToast(errorMessage, 'error', 5000);
		} finally {
			paymentProcessing = false;
		}
	}

	onMount(() => {
		initEshopStore();
	});

	$effect(() => {
		const blocks = $businessOrderBlocks;
		if (blocks && blocks.length > 0 && orderBlocks.length === 0) {
			orderBlocks = blocks
				.filter(block => block.type !== 'GEO_LOCATION')
				.map(block => ({
					...block,
					value: block.value && block.value.length > 0 ? block.value :
						(block.type === 'TEXT' ? [{ en: '' }] :
						 block.type === 'BOOLEAN' ? [false] :
						 block.type === 'NUMBER' ? [0] : [''])
				}));
		}
	});

</script>

{#if $store.loading}
	<div class="flex justify-center items-center py-8">
		<Icon icon="mdi:loading" class="w-8 h-8 animate-spin text-primary" />
	</div>
{:else if $store.error}
	<div class="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
		<div class="text-destructive text-lg mb-2">Error</div>
		<div class="text-destructive/80 mb-4">{$store.error}</div>
	</div>
{:else if $cartItems.length === 0}
	<div class="bg-muted rounded-lg p-6 text-center">
		<div class="text-muted-foreground bg-card mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
			<Icon icon="mdi:shopping-outline" class="h-8 w-8" />
		</div>
		<p class="text-muted-foreground mb-4">No products in cart</p>
		<a href="/products" class="text-primary hover:text-primary/80 font-medium">
			Browse Products →
		</a>
	</div>
{:else}
	<div class="space-y-3">
		{#each $cartItems as item (item.id)}
			<div class="cart-item">
				<div class="cart-item-content">
					<div class="cart-item-info">
						<h3 class="cart-item-title">{item.productName}</h3>
						
						{#if item.variantAttributes && item.variantAttributes.length > 0}
							<div class="mt-1">
								<AttributeBlocks 
									blocks={item.variantAttributes} 
									variant="badges" 
								/>
							</div>
						{/if}
						
					</div>

					<div class="cart-item-actions">
						<div class="cart-item-controls">
							<div class="cart-item-quantity">
								<QuantitySelector 
									quantity={item.quantity}
									min={1}
									max={99}
									on:change={(e) => handleQuantityUpdate(item.id, e.detail)}
								/>
							</div>

							<div class="cart-item-total">
								{formatLinePrice(item)}
							</div>

							<div class="cart-item-remove">
								<button
									class="remove-button"
									on:click={() => handleRemoveItem(item.id)}
									aria-label="Remove item"
								>
									<Icon icon="mdi:delete" class="h-5 w-5" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if $cartItems.length > 0}
		<div class="border-t pt-6 mt-4">
			<h3 class="text-xl font-semibold text-card-foreground mb-6">Checkout</h3>

			<form on:submit|preventDefault={() => {
				handleCheckoutComplete();
			}} class="space-y-6">
						<!-- Email and Phone Fields -->
						<div class="space-y-4">
							{#if $orderConfigs?.isEmailRequired !== false}
								<div>
									<label class="block text-sm font-medium text-foreground mb-1.5">
										Email {#if $orderConfigs?.isEmailRequired}<span class="text-destructive">*</span>{/if}
									</label>
									<input
										type="email"
										class="w-full px-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder="your@email.com"
										bind:value={email}
										required={$orderConfigs?.isEmailRequired}
									/>
									{#if emailError}
										<p class="text-destructive text-sm mt-1">{emailError}</p>
									{/if}
								</div>
							{/if}

							{#if $orderConfigs?.isPhoneRequired !== false || $orderConfigs?.isPhoneRequired}
								<div>
									<label class="block text-sm font-medium text-foreground mb-1.5">
										Phone {#if $orderConfigs?.isPhoneRequired}<span class="text-destructive">*</span>{/if}
									</label>
									<input
										type="tel"
										class="w-full px-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder="+1 234 567 8900"
										bind:value={phone}
										required={$orderConfigs?.isPhoneRequired}
									/>
									{#if phoneError}
										<p class="text-destructive text-sm mt-1">{phoneError}</p>
									{/if}
								</div>
							{/if}
						</div>

						<DynamicForm
							blocks={orderBlocks}
							onUpdate={(idx, value) => {
								const updatedBlocks = [...orderBlocks];
								const block = updatedBlocks[idx];
								updatedBlocks[idx] = { ...block, value: Array.isArray(value) ? value : [value] };
								orderBlocks = updatedBlocks;
							}}
							onPhoneSendCode={handlePhoneSendCode}
							onPhoneVerifyCode={handlePhoneVerifyCode}
							onValidationChange={handleValidationChange}
						/>

						<LocationInput
							value={locationData}
							onUpdate={(location) => {
								locationData = location;
								if (location.countryCode) {
									refreshQuote();
								}
							}}
							required={true}
						/>

						{#if locationComplete && availableShippingMethods && availableShippingMethods.length > 0}
							<div>
								<h4 class="text-lg font-semibold mb-3">Shipping</h4>
								<div class="grid gap-3">
								{#each availableShippingMethods as method}
										{@const rate = method.zoneAmount || 0}
										{@const isPickup = !!method.pickupLocation}
										<label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer">
											<input type="radio" name="shipping" value={method.id}
												checked={selectedShippingMethodId === method.id}
												on:change={() => {
													store.setKey('selectedShippingMethodId', method.id);
													refreshQuote();
												}} />
											<span class="flex-1">
												{(isPickup ? '📍 PICKUP' : '📦 DELIVERY') + ' · ' + (method.name?.en || method.name?.[Object.keys(method.name || {})[0]] || method.id)}
												{#if method.etaText}
													<span class="block text-xs text-muted-foreground">{method.etaText}</span>
												{/if}
												{#if isPickup && method.pickupLocation}
													<span class="block text-xs text-muted-foreground mt-1">
														Pickup at: {method.pickupLocation.address || ''}{method.pickupLocation.city ? `, ${method.pickupLocation.city}` : ''}
													</span>
												{/if}
											</span>
											<span class="text-sm text-muted-foreground text-right">
												{arky.utils.formatMinor(rate, $currency)}
											</span>
										</label>
									{/each}
								</div>
							</div>
						{/if}

						{#if locationComplete && availablePaymentMethods.length > 0}
							<PaymentForm
								allowedMethods={availablePaymentMethods}
								paymentProvider={$paymentConfig?.provider}
								{selectedPaymentMethod}
								onPaymentMethodChange={(method) => selectedPaymentMethod = method}
								onStripeReady={(confirmFn) => confirmPayment = confirmFn}
								onValidationChange={handlePaymentValidationChange}
								error={paymentError}
								variant="eshop"
							/>
						{/if}

						<PromoCode
							{appliedPromoCode}
							onApply={handleApplyPromoCode}
							onRemove={handleRemovePromoCode}
						/>

						<QuoteSummary
							quote={$quoteAtom}
							fetchingQuote={$store.fetchingQuote}
							quoteError={$store.quoteError}
							currency={$currency || 'USD'}
							itemCount={$cartItemCount}
							itemLabel="item"
							title="Order Summary"
							showShipping={true}
						/>

						<div class="flex justify-center pt-4">
							<button
								type="submit"
								disabled={$store.processingCheckout || paymentProcessing || !isCompletelyValid || (selectedPaymentMethod === 'CREDIT_CARD' && !confirmPayment)}
								class="w-full px-6 py-4 text-lg bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
							>
								{#if $store.processingCheckout || paymentProcessing}
									<Icon icon="mdi:loading" class="h-5 w-5 animate-spin" />
									Processing...
								{:else}
									<Icon icon={selectedPaymentMethod === 'CREDIT_CARD' ? 'mdi:credit-card' : 'mdi:cash'} class="h-5 w-5" />
									Place Order
								{/if}
							</button>
						</div>
					</form>
				</div>
	{/if}
{/if}

<style>
	@import "tailwindcss/theme" theme(reference);
	@import "@/styles/tailwind-theme.css" theme(reference);

	.cart-item {
		@apply bg-primary rounded-lg border p-4;
	}

	.cart-item-content {
		@apply flex flex-col gap-4;
	}

	.cart-item-info {
		@apply flex-1 min-w-0;
	}

	.cart-item-title {
		@apply font-medium text-primary-foreground text-base leading-tight;
	}

	.cart-item-actions {
		@apply flex flex-col gap-4 w-full;
	}

	.cart-item-controls {
		@apply flex items-center justify-between gap-3 w-full;
	}

	.cart-item-quantity {
		@apply flex-shrink-0;
	}

	.cart-item-total {
		@apply text-base font-bold text-primary-foreground flex-1 text-right;
	}

	.cart-item-remove {
		@apply flex-shrink-0;
	}

	@media (min-width: 768px) {
		.cart-item-content {
			@apply flex-row items-center justify-between;
		}

		.cart-item-actions {
			@apply flex-row items-center gap-3 w-auto;
		}

		.cart-item-controls {
			@apply w-auto;
		}

		.cart-item-total {
			@apply min-w-[80px] flex-none;
		}
	}

	.remove-button {
		@apply flex h-10 w-10 items-center justify-center rounded-full text-red-500 transition md:h-8 md:w-8;
	}
</style>
