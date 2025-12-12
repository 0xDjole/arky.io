<script lang="ts">
	import Icon from '@iconify/svelte';
	import DynamicForm from '@lib/DynamicForm/index.svelte';
	import PhoneInput from '@lib/shared/PhoneInput/index.svelte';
	import { store, actions, initReservationStore, cartParts } from '@lib/core/stores/reservation';
	import { reservationBlocks, reservationConfigs, paymentMethods as businessPaymentMethods, paymentConfig, currency } from '@lib/core/stores/business';
	import { onMount } from 'svelte';
	import { t } from '../../../lib/i18n/index';
	import { showToast } from '@lib/toast.js';
	import PaymentForm from '@lib/shared/PaymentForm/index.svelte';
	import QuoteSummary from '@lib/shared/QuoteSummary/index.svelte';
	import PromoCode from '@lib/shared/PromoCode/index.svelte';

	let appliedPromoCode = $state<string | null>(null);
	let selectedPaymentMethodType: string = $state('CASH');

	const availablePaymentMethodObjects = $derived(() => {
		const fromQuote = $store.availablePaymentMethods || [];
		if (fromQuote.length > 0) {
			return fromQuote;
		}
		return [];
	});

	const availablePaymentMethods = $derived(() => {
		return availablePaymentMethodObjects().map((m: any) => m.type);
	});

	const selectedPaymentMethodId = $derived(() => {
		const methods = availablePaymentMethodObjects();
		const selected = methods.find((m: any) => m.type === selectedPaymentMethodType);
		return selected?.id || null;
	});
	let paymentProcessing = $state(false);
	let paymentError = $state(null);
	let confirmPayment = null;
	let formValid = $state(true);
	let formErrors = $state([]);
	let paymentFormValid = $state(false);
	let localReservationBlocks = $state([]);
	let email = $state('');
	let phone = $state('');
	let phoneVerified = $state(false);

	const emailValid = $derived(() => {
		if (!$reservationConfigs?.isEmailRequired) return true;
		if (!email) return false;
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	});

	const phoneValid = $derived(() => {
		if (!$reservationConfigs?.isPhoneRequired) return true;
		if (!phone || phone.length < 6) return false;
		return phoneVerified;
	});

	const isCompletelyValid = $derived(formValid && emailValid() && phoneValid() && (selectedPaymentMethodType === 'CASH' || selectedPaymentMethodType === 'FREE' || paymentFormValid));

	onMount(() => {
		initReservationStore();
		refreshQuote();
	});

	$effect(() => {
		if ($reservationBlocks && $reservationBlocks.length > 0) {
			localReservationBlocks = $reservationBlocks.map(block => ({
				...block,
				value: block.value && block.value.length > 0 ? block.value :
					(block.type === 'TEXT' ? [{ en: '' }] :
					 block.type === 'BOOLEAN' ? [false] :
					 block.type === 'NUMBER' ? [0] : [''])
			}));
		}
	});

	$effect(() => {
		if (paymentProcessing) return;
		const allowedMethods = availablePaymentMethods();
		if (allowedMethods.length > 0 && !allowedMethods.includes(selectedPaymentMethodType)) {
			selectedPaymentMethodType = allowedMethods[0];
		}
	});

	function refreshQuote() {
		if ($store.cart && $store.cart.length > 0) {
			actions.fetchQuote(selectedPaymentMethodId(), appliedPromoCode);
		}
	}

async function handleApplyPromoCode(code: string) {
    const candidate = (code || '').trim();
    if (!candidate) return;
    await actions.fetchQuote(selectedPaymentMethodId(), candidate);
    if (!$store.quoteError) {
        appliedPromoCode = candidate;
        showToast(`Promo code "${candidate}" applied`, 'success', 3000);
    } else {
        showToast($store.quoteError, 'error', 4000);
    }
}

	function handleRemovePromoCode() {
		appliedPromoCode = null;
		refreshQuote();
		showToast('Promo code removed', 'success', 2000);
	}

	function update(idx, v) {
		const blocks = [...localReservationBlocks];
		blocks[idx] = { ...blocks[idx], value: Array.isArray(v) ? v : [v] };
		localReservationBlocks = blocks;
	}

	function handleValidationChange(isValid, errors) {
		formValid = isValid;
		formErrors = errors;
	}

	function handlePaymentValidationChange(isValid) {
		paymentFormValid = isValid;
	}

	async function handlePhoneSendCode(blockId, phone) {
		store.setKey('phoneNumber', phone);
		return await actions.addPhoneNumber();
	}

	async function handlePhoneVerifyCode(blockId, code) {
		store.setKey('verificationCode', code);
		return await actions.phoneNumberConfirm();
	}


	async function handleCheckout() {
		// Block submission if form is invalid
		if (!isCompletelyValid) {
			if (!formValid) {
				showToast('Please fix the form errors before submitting', 'error', 4000);
			} else if (!emailValid()) {
				showToast('Please enter a valid email address', 'error', 4000);
			} else if (!phoneValid()) {
				showToast('Please verify your phone number', 'error', 4000);
			} else if (selectedPaymentMethodType === 'CREDIT_CARD' && !paymentFormValid) {
				showToast('Please complete payment information before submitting', 'error', 4000);
			}
			return;
		}

		paymentProcessing = true;
		paymentError = null;

		try {
			const checkoutResponse = await actions.checkout(selectedPaymentMethodId(), localReservationBlocks, email || undefined, phone || undefined);

			if (!checkoutResponse.success) {
				throw new Error(checkoutResponse.error || 'Failed to create reservation');
			}

			const { reservationId, clientSecret } = checkoutResponse.data;

			if (selectedPaymentMethodType === 'CASH' || selectedPaymentMethodType === 'FREE') {
				const message = selectedPaymentMethodType === 'FREE' ? 'Inquiry submitted successfully!' : 'Reservation created successfully!';
				showToast(message, 'success', 6000);

				// Clear cart and promo code
				actions.clearCart();
				cartParts.set([]);
				appliedPromoCode = null;
				return;
			}

			if (selectedPaymentMethodType === 'CREDIT_CARD') {
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
					showToast('Payment successful! Reservation confirmed.', 'success', 6000);
				} else {
					throw new Error('Payment was not completed successfully');
				}
			}

			// Clear cart and promo code on success
			actions.clearCart();
			cartParts.set([]);
			appliedPromoCode = null;

		} catch (error) {
			console.error('Reservation checkout error:', error);
			paymentError = error.message || 'Checkout failed. Please try again.';
		} finally {
			paymentProcessing = false;
		}
	}

</script>

<div class="bg-tertiary mx-auto mt-20 max-w-xl space-y-4 rounded-xl p-4 shadow-lg">
	<h2 class="text-2xl font-bold text-primary">{t('cart.title')}</h2>

	<!-- Email and Phone Fields -->
	<div class="space-y-4">
		{#if $reservationConfigs?.isEmailRequired !== false}
			<div>
				<label class="block text-sm font-medium text-primary mb-1.5">
					Email {#if $reservationConfigs?.isEmailRequired}<span class="text-red-500">*</span>{/if}
				</label>
				<input
					type="email"
					class="w-full px-4 py-3 rounded-lg border bg-secondary text-primary focus:outline-none focus:ring-2 focus:ring-primary"
					placeholder="your@email.com"
					bind:value={email}
					required={$reservationConfigs?.isEmailRequired}
				/>
			</div>
		{/if}

		{#if $reservationConfigs?.isPhoneRequired}
			<PhoneInput
				blockId="cart-phone"
				value={phone}
				onChange={(value) => phone = value}
				onSendCode={handlePhoneSendCode}
				onVerifyCode={handlePhoneVerifyCode}
				onValidationChange={(isVerified) => phoneVerified = isVerified}
			/>
		{/if}
	</div>

	{#if localReservationBlocks?.length > 0}
		<DynamicForm
			blocks={localReservationBlocks}
			onUpdate={update}
			onPhoneSendCode={handlePhoneSendCode}
			onPhoneVerifyCode={handlePhoneVerifyCode}
			onValidationChange={handleValidationChange}
		/>
	{/if}

	{#if !$store.cart?.length}
		<div class="bg-secondary rounded-lg p-6 text-center">
			<div class="text-muted bg-tertiary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
				<Icon icon="mdi:cart-outline" class="h-8 w-8" />
			</div>
			<p class="text-muted">{t('cart.empty')}</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each $store.cart || [] as part (part.id)}
				<div class="bg-secondary border-secondary rounded-lg border p-4">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="font-medium text-primary">{part.serviceName}</h3>

							{#if part.isMultiDay}
								<div class="mt-1 flex items-center gap-1.5">
									<Icon icon="mdi:calendar-range" class="text-secondary h-4 w-4" />
									<div class="text-secondary text-sm">{part.date}</div>
								</div>
							{:else}
								<div class="mt-1 flex items-center gap-1.5">
									<Icon icon="mdi:calendar" class="text-secondary h-4 w-4" />
									<div class="text-secondary text-sm">{part.date}</div>
								</div>
							{/if}

							<div class="mt-1 flex items-center gap-1.5">
								<Icon icon="mdi:clock-outline" class="text-secondary h-4 w-4" />
								<div class="text-secondary text-sm">{part.timeText}</div>
							</div>

							{#if part.providerId}
								<div class="mt-1 flex items-center gap-1.5">
									<Icon icon="mdi:account" class="text-secondary h-4 w-4" />
									<div class="text-secondary text-sm">{t('reservation.specificProvider')}</div>
								</div>
							{/if}
						</div>

						<button
							class="hover:bg-tertiary flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:text-red-600 transition"
							onclick={() => actions.removeFromCart(part.id)}
							aria-label={t('cart.remove')}>
							<Icon icon="mdi:trash-can-outline" class="h-5 w-5" />
						</button>
					</div>
				</div>
			{/each}
		</div>

		<!-- Promo Code -->
		<PromoCode
			{appliedPromoCode}
			onApply={handleApplyPromoCode}
			onRemove={handleRemovePromoCode}
		/>

		<!-- Quote Summary -->
		<QuoteSummary
			quote={$store.quote}
			fetchingQuote={$store.fetchingQuote}
			quoteError={$store.quoteError}
			currency={$currency || 'USD'}
			itemCount={$store.cart?.length || 0}
			itemLabel="service"
			title="Reservation Summary"
			showShipping={false}
		/>

		{#if availablePaymentMethods().length > 0}
			<PaymentForm
				allowedMethods={availablePaymentMethods()}
				paymentProvider={$paymentConfig?.provider}
				selectedPaymentMethod={selectedPaymentMethodType}
				onPaymentMethodChange={(method) => selectedPaymentMethodType = method}
				onStripeReady={(confirmFn) => confirmPayment = confirmFn}
				onValidationChange={handlePaymentValidationChange}
				error={paymentError}
				variant="reservation"
			/>
		{/if}

		<!-- Form validation errors summary removed -->

		<button
			class="bg-primary-600 hover:bg-primary-500 mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
			disabled={$store?.loading || paymentProcessing || !isCompletelyValid || (selectedPaymentMethodType === 'CREDIT_CARD' && !confirmPayment)}
			onclick={handleCheckout}>
			{#if !$store?.loading && !paymentProcessing}
				<Icon icon={selectedPaymentMethodType === 'CREDIT_CARD' ? 'mdi:credit-card' : (selectedPaymentMethodType === 'FREE' ? 'mdi:send' : 'mdi:check-circle')} class="h-5 w-5" />
				{#if selectedPaymentMethodType === 'FREE'}
					Submit Inquiry
				{:else if selectedPaymentMethodType === 'CREDIT_CARD'}
					Pay & Confirm
				{:else}
					{t('reservation.confirm')}
				{/if}
			{:else}
				<Icon icon="mdi:loading" class="h-5 w-5 animate-spin" />
				{paymentProcessing ? 'Processing...' : t('cart.processing')}
			{/if}
		</button>

	{/if}
</div>
