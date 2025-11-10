<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { showToast } from '@lib/toast.js';
	import { cartItems, cartTotal, cartItemCount, store, actions, initEshopStore, currency, allowedPaymentMethods, orderBlocks as businessOrderBlocks, paymentConfig, quoteAtom } from '@lib/core/stores/eshop';
	import { getShippingMethodsForCountry, getPaymentMethodsForCountry, selectedMarket } from '@lib/core/stores/business';
	import { arky } from '@lib/index';
	import QuantitySelector from '@lib/EShop/QuantitySelector/index.svelte';
	import AttributeBlocks from '@lib/EShop/AttributeBlocks/index.svelte';
	import DynamicForm from '@lib/DynamicForm/index.svelte';
	import Icon from '@iconify/svelte';
	import PaymentForm from '@lib/shared/PaymentForm/index.svelte';
	import QuoteSummary from '@lib/shared/QuoteSummary/index.svelte';
	import PromoCode from '@lib/shared/PromoCode/index.svelte';

	let appliedPromoCode = $state<string | null>(null);

	let showCheckoutSection = $state(false);
	let checkoutFormData = $state({});
	let selectedPaymentMethod = $state('CASH');
	let paymentProcessing = $state(false);
	let paymentError = $state(null);
	let orderBlocks = $state([]);
	let confirmPayment = null;
	let formValid = $state(false);
	let formErrors = $state([]);
	let paymentFormValid = $state(false);
	let selectedShippingMethodId = $derived($store.selectedShippingMethodId);

    const locationBlock = $derived(orderBlocks.find((b) => b.key === 'location' && b.type === 'GEO_LOCATION'));
    const countryCode = $derived(locationBlock?.value?.[0]?.countryCode);

    const availableShippingMethods = $derived.by(() => {
        if (!countryCode) return [];
        return getShippingMethodsForCountry(countryCode) || [];
    });

    const availablePaymentMethods = $derived.by(() => {
        if (!countryCode) return [];
        return getPaymentMethodsForCountry(countryCode);
    });

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

	const isCompletelyValid = $derived(formValid && (selectedPaymentMethod === 'CASH' || paymentFormValid));

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
    if (!candidate) return;

    const prevPromo = appliedPromoCode;
    appliedPromoCode = candidate;
    await actions.fetchQuote(candidate, orderBlocks);

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
		refreshQuote();
		showToast('Promo code removed', 'success', 2000);
	}

	function refreshQuote() {
		if ($cartItems.length > 0 && orderBlocks.length > 0) {
			actions.fetchQuote(appliedPromoCode, orderBlocks);
		}
	}

	async function handleCheckoutComplete() {
		if (!isCompletelyValid) {
			if (!formValid) {
				showToast('Please fix the form errors before placing order', 'error', 4000);
			} else if (selectedPaymentMethod === 'CREDIT_CARD' && !paymentFormValid) {
				showToast('Please complete payment information before placing order', 'error', 4000);
			}
			return;
		}

		paymentProcessing = true;
		paymentError = null;

		try {
			const checkoutResponse = await actions.checkout(selectedPaymentMethod, orderBlocks, appliedPromoCode);

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
			orderBlocks = blocks.map(block => ({
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
						<DynamicForm
							blocks={orderBlocks}
							onUpdate={(idx, value) => {
								const updatedBlocks = [...orderBlocks];
								const block = updatedBlocks[idx];
								updatedBlocks[idx] = { ...block, value: Array.isArray(value) ? value : [value] };
								orderBlocks = updatedBlocks;

								// Refresh quote if location (country) changed
								if (block.key === 'location' && block.type === 'GEO_LOCATION') {
									refreshQuote();
								}
							}}
							onPhoneSendCode={handlePhoneSendCode}
							onPhoneVerifyCode={handlePhoneVerifyCode}
							onValidationChange={handleValidationChange}
						/>

						{#if availableShippingMethods && availableShippingMethods.length > 0}
							<div>
								<h4 class="text-lg font-semibold mb-3">Shipping</h4>
								<div class="grid gap-3">
								{#each availableShippingMethods as method}
										{@const rate = method.zoneAmount || 0}
										<label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer">
											<input type="radio" name="shipping" value={method.id}
												checked={selectedShippingMethodId === method.id}
												on:change={() => {
													store.setKey('selectedShippingMethodId', method.id);
													refreshQuote();
												}} />
											<span class="flex-1">
												{(method.type || 'SHIPPING') + ' · ' + (method.id?.toUpperCase?.() || method.id)}
												{#if method.etaText}
													<span class="block text-xs text-muted-foreground">{method.etaText}</span>
												{/if}
												{#if method.type === 'PICKUP' && method.location}
													<span class="block text-xs text-muted-foreground mt-1">
														Pickup at: {method.location.address || ''}{method.location.city ? `, ${method.location.city}` : ''}
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

						{#if countryCode && availablePaymentMethods.length > 0}
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

	/* Loading and error states */
	.loading-container {
		@apply flex justify-center items-center py-8;
	}

	.loading-icon {
		@apply w-8 h-8 animate-spin text-primary;
	}

	.error-container {
		@apply bg-red-50 border border-red-200 rounded-lg p-4 text-center;
	}

	.error-title {
		@apply text-red-600 text-lg mb-2;
	}

	.error-message {
		@apply text-red-500 mb-4;
	}

	/* Empty cart state */
	.empty-cart {
		@apply bg-muted rounded-lg p-6 text-center;
	}

	.empty-cart-icon {
		@apply text-muted-foreground bg-card mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full;
	}

	.empty-cart-text {
		@apply text-muted-foreground mb-4;
	}

	.empty-cart-link {
		@apply text-primary font-medium;
	}

	/* Cart items */
	.cart-items {
		@apply space-y-3;
	}

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

	.cart-item-price {
		@apply mt-2 text-sm font-semibold text-primary-foreground;
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

	/* Desktop layout */
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

	/* Cart total */
	.cart-total-section {
		@apply border-t pt-4;
	}

	.cart-total-row {
		@apply flex justify-between items-center mb-4;
	}

	.cart-total-label {
		@apply text-xl font-semibold text-card-foreground;
	}

	.cart-total-amount {
		@apply text-2xl font-bold text-primary;
	}

	/* Checkout section */
	.checkout-section {
		@apply border-t pt-6 mt-4;
	}

	.checkout-header {
		@apply mb-6 flex items-center justify-between;
	}

	.checkout-title {
		@apply text-xl font-semibold text-card-foreground;
	}

	.checkout-close {
		@apply text-muted-foreground hover:text-card-foreground transition-colors p-2 md:p-0;
	}

	.checkout-form {
		@apply space-y-6;
	}

	/* Form elements */
	.form-group {
		@apply space-y-2;
	}

	.form-label {
		@apply block text-sm font-medium text-card-foreground;
	}

	.form-input {
		@apply w-full p-4 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground placeholder-gray-500 text-base md:p-3 md:text-sm;
	}

	/* Payment methods */
	.payment-methods {
		@apply grid gap-3 grid-cols-1 md:grid-cols-2;
	}

	.payment-method {
		@apply relative flex items-center p-4 rounded-lg cursor-pointer transition-all border-2;
	}

	.payment-method.selected {
		@apply border-primary bg-primary shadow-sm;
	}

	.payment-method.unselected {
		@apply border-transparent bg-muted hover:bg-muted;
	}

	.payment-method-check {
		@apply absolute top-2 right-2;
	}

	.payment-method-content {
		@apply flex items-center gap-3 w-full;
	}

	.payment-method-icon {
		@apply flex items-center justify-center w-12 h-12 rounded-full bg-background;
	}

	.payment-method-text {
		@apply text-left flex-1;
	}

	.payment-method-title {
		@apply font-semibold;
	}

	.payment-method-subtitle {
		@apply text-sm;
	}

	/* Credit card form */
	.card-details {
		@apply bg-muted rounded-lg border p-6;
	}

	.card-details-header {
		@apply flex items-center gap-2 mb-4;
	}

	.card-details-title {
		@apply font-medium text-card-foreground;
	}

	.card-form {
		@apply space-y-4;
	}

	.card-input-group {
		@apply grid grid-cols-1 gap-4 md:grid-cols-2;
	}

	.card-input {
		@apply p-4 border border-border rounded-lg min-h-[56px] md:p-3 md:min-h-[48px];
		background-color: var(--bg-background);
		color: var(--text-foreground);
	}

	.security-notice {
		@apply flex items-center gap-2 text-sm text-muted-foreground;
	}

	/* Error message */
	.error-box {
		@apply p-4 bg-destructive/10 border border-destructive/20 rounded-lg;
	}

	.error-header {
		@apply flex items-center gap-2 text-destructive;
	}

	.error-content {
		@apply text-destructive/80 mt-1;
	}

	/* Action buttons */
	.action-buttons {
		@apply flex flex-col gap-3 pt-4 md:flex-row;
	}

	.cancel-button {
		@apply w-full px-4 py-3 text-base bg-muted text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground transition-colors md:flex-1 md:py-2 md:text-sm;
	}

	.submit-button {
		@apply w-full px-4 py-3 text-base bg-primary text-primary-foreground rounded-lg hover:bg-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 md:flex-2 md:py-2 md:text-sm;
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.payment-methods {
			@apply grid-cols-1;
		}

		.card-input-group {
			@apply grid-cols-1;
		}
	}
</style>
