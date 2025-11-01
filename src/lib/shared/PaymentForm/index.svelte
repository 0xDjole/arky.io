<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { loadStripe } from '@stripe/stripe-js';
	import Icon from '@iconify/svelte';

	let {
		allowedMethods = ['CASH'],
		paymentProvider = null,
		selectedPaymentMethod = 'CASH',
		onPaymentMethodChange = null,
		onStripeReady = null,
		onValidationChange = null,
		error = null,
		variant = 'default'
	} = $props();

	let stripePublicKey = $derived(paymentProvider?.type === 'STRIPE' ? paymentProvider.publicKey : null);


	let stripe = $state(null);
	let elements = $state(null);
	let cardNumberElement = $state(null);
	let cardExpiryElement = $state(null);
	let cardCvcElement = $state(null);
	let elementsReady = $state(false);
	let cardNumberValid = $state(false);
	let cardExpiryValid = $state(false);
	let cardCvcValid = $state(false);

	$effect(() => {
		if (stripePublicKey && !stripe) {
			loadStripe(stripePublicKey).then(s => {
				stripe = s;
			}).catch(err => {
				// Silently fail, error will be shown in UI
			});
		}
	});

	$effect(() => {
		if (selectedPaymentMethod === 'CREDIT_CARD' && stripe && !elementsReady) {
			setupStripeElements();
		} else if (selectedPaymentMethod !== 'CREDIT_CARD' && elementsReady) {
			destroyStripeElements();
		}
	});

	async function setupStripeElements() {
		if (!stripe || elementsReady) return;

		await tick();

		const prefix = variant === 'reservation' ? 'reservation-' : '';
		const cardNumberContainer = document.getElementById(`${prefix}card-number-element`);
		const cardExpiryContainer = document.getElementById(`${prefix}card-expiry-element`);
		const cardCvcContainer = document.getElementById(`${prefix}card-cvc-element`);

		if (!cardNumberContainer || !cardExpiryContainer || !cardCvcContainer) {
			return;
		}

		cardNumberContainer.innerHTML = '';
		cardExpiryContainer.innerHTML = '';
		cardCvcContainer.innerHTML = '';

		elements = stripe.elements();

		const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

		const style = {
			base: {
				color: isDark ? '#ffffff' : '#000000',
				fontFamily: 'Inter, system-ui, sans-serif',
				fontSmoothing: 'antialiased',
				fontSize: '16px',
				'::placeholder': {
					color: isDark ? '#6b7280' : '#9ca3af'
				}
			},
			invalid: {
				color: '#ef4444',
				iconColor: '#ef4444'
			}
		};

		cardNumberElement = elements.create('cardNumber', { style });
		cardExpiryElement = elements.create('cardExpiry', { style });
		cardCvcElement = elements.create('cardCvc', { style });

		try {
			cardNumberElement.mount(`#${prefix}card-number-element`);
			cardExpiryElement.mount(`#${prefix}card-expiry-element`);
			cardCvcElement.mount(`#${prefix}card-cvc-element`);

			cardNumberElement.on('change', (event) => {
				cardNumberValid = event.complete;
				updateValidationState();
			});

			cardExpiryElement.on('change', (event) => {
				cardExpiryValid = event.complete;
				updateValidationState();
			});

			cardCvcElement.on('change', (event) => {
				cardCvcValid = event.complete;
				updateValidationState();
			});

			elementsReady = true;

			if (onStripeReady) {
				onStripeReady((clientSecret) =>
					stripe.confirmCardPayment(clientSecret, {
						payment_method: {
							card: cardNumberElement,
							billing_details: { name: '' }
						}
					})
				);
			}
		} catch (error) {
			// Silently fail, error will be shown in UI
		}
	}

	function updateValidationState() {
		const isValid = cardNumberValid && cardExpiryValid && cardCvcValid;
		if (onValidationChange) {
			onValidationChange(isValid);
		}
	}

	function destroyStripeElements() {
		if (cardNumberElement) cardNumberElement.destroy();
		if (cardExpiryElement) cardExpiryElement.destroy();
		if (cardCvcElement) cardCvcElement.destroy();
		cardNumberElement = null;
		cardExpiryElement = null;
		cardCvcElement = null;
		elementsReady = false;
		cardNumberValid = false;
		cardExpiryValid = false;
		cardCvcValid = false;
		updateValidationState();
	}

	onDestroy(() => {
		destroyStripeElements();
	});

	const getVariantClasses = () => {
		const base = {
			label: variant === 'reservation' ? 'text-primary' : 'text-card-foreground',
			cardDetails: variant === 'reservation' ? 'bg-secondary' : 'bg-muted',
			cardDetailsTitle: variant === 'reservation' ? 'text-primary' : 'text-card-foreground',
			cardInput: variant === 'reservation' ? 'bg-background' : '',
			errorBg: variant === 'reservation' ? 'bg-red-50 border-red-200' : 'bg-destructive/10 border-destructive/20',
			errorText: variant === 'reservation' ? 'text-red-600' : 'text-destructive',
			errorContent: variant === 'reservation' ? 'text-red-500' : 'text-destructive/80',
			securityText: variant === 'reservation' ? 'text-secondary' : 'text-muted-foreground'
		};
		return base;
	};

	let variantClasses = $derived(getVariantClasses());
	let prefix = $derived(variant === 'reservation' ? 'reservation-' : '');

	$effect(() => {
		if (selectedPaymentMethod === 'CASH' && onValidationChange) {
			onValidationChange(true);
		} else if (selectedPaymentMethod === 'CREDIT_CARD' && onValidationChange) {
			onValidationChange(false);
		}
	});

	$effect(() => {
		if (allowedMethods.length === 1 && selectedPaymentMethod !== allowedMethods[0]) {
			onPaymentMethodChange?.(allowedMethods[0]);
		}
	});
</script>

<div class="space-y-4">
	<div>
		<label class="block text-sm font-medium mb-3 {variantClasses.label}">
			Payment Method <span class="text-red-500">*</span>
		</label>
		<div class="grid gap-3" class:grid-cols-2={allowedMethods.length > 1} class:grid-cols-1={allowedMethods.length === 1}>
			{#if allowedMethods.includes('CASH')}
				<button
					type="button"
					class="relative flex items-center p-4 rounded-lg cursor-pointer transition-all border-2"
					class:border-primary={selectedPaymentMethod === 'CASH'}
					class:bg-primary={selectedPaymentMethod === 'CASH'}
					class:shadow-sm={selectedPaymentMethod === 'CASH'}
					class:border-transparent={selectedPaymentMethod !== 'CASH'}
					class:bg-muted={selectedPaymentMethod !== 'CASH' && variant !== 'reservation'}
					class:bg-secondary={selectedPaymentMethod !== 'CASH' && variant === 'reservation'}
					class:hover:bg-muted={selectedPaymentMethod !== 'CASH' && variant !== 'reservation'}
					class:hover:bg-tertiary={selectedPaymentMethod !== 'CASH' && variant === 'reservation'}
					onclick={() => onPaymentMethodChange?.('CASH')}
				>
					{#if selectedPaymentMethod === 'CASH'}
						<div class="absolute top-2 right-2">
							<Icon icon="mdi:check-circle" class="w-5 h-5 text-primary" />
						</div>
					{/if}
					<div class="flex items-center gap-3">
						<div class="flex items-center justify-center w-12 h-12 rounded-full bg-background">
							<Icon icon="mdi:cash" class="w-6 h-6 text-primary" />
						</div>
						<div class="text-left">
							<div class="font-semibold"
								class:text-primary-foreground={selectedPaymentMethod === 'CASH'}
								class:text-card-foreground={selectedPaymentMethod !== 'CASH' && variant !== 'reservation'}
								class:text-primary={selectedPaymentMethod !== 'CASH' && variant === 'reservation'}
							>Cash Payment</div>
							<div class="text-sm"
								class:text-primary-foreground={selectedPaymentMethod === 'CASH'}
								class:text-muted-foreground={selectedPaymentMethod !== 'CASH' && variant !== 'reservation'}
								class:text-secondary={selectedPaymentMethod !== 'CASH' && variant === 'reservation'}
							>
								{variant === 'reservation' ? 'Pay at appointment' : 'Pay on delivery'}
							</div>
						</div>
					</div>
				</button>
			{/if}

			{#if allowedMethods.includes('CREDIT_CARD') && stripePublicKey}
				<button
					type="button"
					class="relative flex items-center p-4 rounded-lg cursor-pointer transition-all border-2"
					class:border-primary={selectedPaymentMethod === 'CREDIT_CARD'}
					class:bg-primary={selectedPaymentMethod === 'CREDIT_CARD'}
					class:shadow-sm={selectedPaymentMethod === 'CREDIT_CARD'}
					class:border-transparent={selectedPaymentMethod !== 'CREDIT_CARD'}
					class:bg-muted={selectedPaymentMethod !== 'CREDIT_CARD' && variant !== 'reservation'}
					class:bg-secondary={selectedPaymentMethod !== 'CREDIT_CARD' && variant === 'reservation'}
					class:hover:bg-muted={selectedPaymentMethod !== 'CREDIT_CARD' && variant !== 'reservation'}
					class:hover:bg-tertiary={selectedPaymentMethod !== 'CREDIT_CARD' && variant === 'reservation'}
					onclick={() => onPaymentMethodChange?.('CREDIT_CARD')}
				>
					{#if selectedPaymentMethod === 'CREDIT_CARD'}
						<div class="absolute top-2 right-2">
							<Icon icon="mdi:check-circle" class="w-5 h-5 text-primary" />
						</div>
					{/if}
					<div class="flex items-center gap-3">
						<div class="flex items-center justify-center w-12 h-12 rounded-full bg-background">
							<Icon icon="mdi:credit-card" class="w-6 h-6 text-primary" />
						</div>
						<div class="text-left">
							<div class="font-semibold"
								class:text-primary-foreground={selectedPaymentMethod === 'CREDIT_CARD'}
								class:text-card-foreground={selectedPaymentMethod !== 'CREDIT_CARD' && variant !== 'reservation'}
								class:text-primary={selectedPaymentMethod !== 'CREDIT_CARD' && variant === 'reservation'}
							>Card Payment</div>
							<div class="text-sm"
								class:text-primary-foreground={selectedPaymentMethod === 'CREDIT_CARD'}
								class:text-muted-foreground={selectedPaymentMethod !== 'CREDIT_CARD' && variant !== 'reservation'}
								class:text-secondary={selectedPaymentMethod !== 'CREDIT_CARD' && variant === 'reservation'}
							>Secure online payment</div>
						</div>
					</div>
				</button>
			{/if}
		</div>
	</div>

	{#if selectedPaymentMethod === 'CREDIT_CARD'}
		<div class="rounded-lg border p-6 {variantClasses.cardDetails}">
			<div class="flex items-center gap-2 mb-4">
				<Icon icon="mdi:credit-card" class="w-5 h-5 text-primary" />
				<h4 class="font-medium {variantClasses.cardDetailsTitle}">Card Details</h4>
			</div>

			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium mb-2 {variantClasses.label}">
						Card Number
					</label>
					<div
						id="{prefix}card-number-element"
						class="p-4 border border-border rounded-lg min-h-[56px] {variantClasses.cardInput}"
						style="background-color: var(--bg-background); color: var(--text-foreground);"
					>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-2 {variantClasses.label}">
							Expiry Date
						</label>
						<div
							id="{prefix}card-expiry-element"
							class="p-4 border border-border rounded-lg min-h-[56px] {variantClasses.cardInput}"
							style="background-color: var(--bg-background); color: var(--text-foreground);"
						>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium mb-2 {variantClasses.label}">
							CVC
						</label>
						<div
							id="{prefix}card-cvc-element"
							class="p-4 border border-border rounded-lg min-h-[56px] {variantClasses.cardInput}"
							style="background-color: var(--bg-background); color: var(--text-foreground);"
						>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-2 text-sm {variantClasses.securityText}">
					<Icon icon="mdi:shield-check" class="w-4 h-4 text-green-600" />
					<span>Your payment information is encrypted and secure</span>
				</div>
			</div>
		</div>
	{/if}

	{#if error}
		<div class="p-4 border rounded-lg {variantClasses.errorBg}">
			<div class="flex items-center gap-2 {variantClasses.errorText}">
				<Icon icon="mdi:alert-circle" class="w-5 h-5" />
				<span class="font-medium">Payment Error</span>
			</div>
			<p class="mt-1 {variantClasses.errorContent}">{error}</p>
		</div>
	{/if}
</div>
