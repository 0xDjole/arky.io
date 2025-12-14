<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	const countries = [
		{ iso: 'BA', name: 'Bosnia and Herzegovina', code: '+387', flag: '🇧🇦' },
		{ iso: 'RS', name: 'Serbia', code: '+381', flag: '🇷🇸' },
		{ iso: 'HR', name: 'Croatia', code: '+385', flag: '🇭🇷' },
		{ iso: 'US', name: 'United States', code: '+1', flag: '🇺🇸' },
		{ iso: 'DE', name: 'Germany', code: '+49', flag: '🇩🇪' },
		{ iso: 'GB', name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
		{ iso: 'FR', name: 'France', code: '+33', flag: '🇫🇷' },
		{ iso: 'IT', name: 'Italy', code: '+39', flag: '🇮🇹' },
		{ iso: 'ES', name: 'Spain', code: '+34', flag: '🇪🇸' },
		{ iso: 'NL', name: 'Netherlands', code: '+31', flag: '🇳🇱' },
		{ iso: 'CH', name: 'Switzerland', code: '+41', flag: '🇨🇭' },
		{ iso: 'AT', name: 'Austria', code: '+43', flag: '🇦🇹' }
	];

	let {
		value = '',
		onChange,
		onSendCode,
		onVerifyCode,
		blockId = null,
		onValidationChange = () => {}
	} = $props();

	let phoneState = $state({
		isLoading: false,
		error: null,
		success: null,
		isVerifying: false,
		verifyError: null,
		isVerified: false,
		verificationCode: ''
	});

	let selectedCountry = $state(countries.find(c => c.iso === 'BA') || countries[0]);
	let nationalNumber = $state('');
	let showDropdown = $state(false);
	let searchTerm = $state('');

	const fullPhoneNumber = $derived(selectedCountry.code + ' ' + nationalNumber);

	const filteredCountries = $derived(countries.filter(c =>
		c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		c.code.includes(searchTerm)
	).slice(0, 50));

	onMount(() => {
		try {
			const locale = navigator.language || 'en-US';
			if (locale.includes('ba') || locale.includes('bs')) {
				selectedCountry = countries.find(c => c.iso === 'BA') || selectedCountry;
			} else if (locale.includes('rs') || locale.includes('sr')) {
				selectedCountry = countries.find(c => c.iso === 'RS') || selectedCountry;
			} else if (locale.includes('hr')) {
				selectedCountry = countries.find(c => c.iso === 'HR') || selectedCountry;
			} else if (locale.includes('us')) {
				selectedCountry = countries.find(c => c.iso === 'US') || selectedCountry;
			} else if (locale.includes('de')) {
				selectedCountry = countries.find(c => c.iso === 'DE') || selectedCountry;
			}
		} catch (e) {
			// Keep default
		}
	});

	function handleInput(e) {
		nationalNumber = e.target.value.replace(/[^\d\s()-]/g, '');
		const phone = selectedCountry.code + ' ' + nationalNumber;
		if (onChange) onChange(phone.trim());
	}

	function selectCountry(country) {
		selectedCountry = country;
		showDropdown = false;
		searchTerm = '';
		const phone = country.code + ' ' + nationalNumber;
		if (onChange) onChange(phone.trim());
	}

	function handleSendCode() {
		if (!onSendCode) return;

		phoneState.isLoading = true;
		phoneState.error = null;

		onSendCode(blockId, fullPhoneNumber.trim()).then(result => {
			phoneState.isLoading = false;
			const success = result === true || result?.success === true;
			if (success) {
				phoneState.success = "Verification code sent successfully!";
				phoneState.error = null;
			} else {
				phoneState.error = "Failed to send verification code";
			}
		}).catch(() => {
			phoneState.isLoading = false;
			phoneState.error = "Failed to send verification code";
		});
	}

	$effect(() => {
		onValidationChange(phoneState.isVerified);
	});

	function handleVerifyCode() {
		if (!onVerifyCode) return;

		phoneState.isVerifying = true;
		phoneState.verifyError = null;

		onVerifyCode(blockId, phoneState.verificationCode).then(result => {
			phoneState.isVerifying = false;
			const success = result === true || result?.success === true;
			if (success) {
				phoneState.isVerified = true;
				phoneState.verifyError = null;
			} else {
				phoneState.verifyError = "Invalid verification code";
			}
		}).catch(() => {
			phoneState.isVerifying = false;
			phoneState.verifyError = "Invalid verification code";
		});
	}

	function handleCodeInput(e) {
		const cleaned = e.target.value.replace(/\D/g, '');
		phoneState.verificationCode = cleaned;
		if (cleaned.length === 4) handleVerifyCode();
	}

</script>

<div class="bg-secondary border-secondary mt-4 overflow-visible rounded-2xl border shadow-lg">
	<div class="border-secondary bg-card border-b px-6 py-4">
		<h2 class="text-primary text-xl font-bold">Phone Verification</h2>
		<p class="text-muted mt-1 text-sm">Enter your phone number to verify</p>
	</div>

	<div class="space-y-6 p-6">
		<div class="space-y-3">
			<label class="text-secondary mb-1 block font-medium">Phone Number</label>

			<div class="flex gap-3 items-start">
				<div class="relative flex-shrink-0">
					<button
						type="button"
						on:click={() => showDropdown = !showDropdown}
						class="form__input w-36 flex items-center justify-between px-4 h-12"
						disabled={phoneState.isVerified}
					>
						<span class="flex items-center gap-2">
							<span class="text-lg">{selectedCountry.flag}</span>
							<span class="font-mono text-sm">{selectedCountry.code}</span>
						</span>
						<Icon icon="mdi:chevron-down" class="h-4 w-4 text-muted"/>
					</button>

					{#if showDropdown}
						<div class="absolute top-full left-0 w-96 z-[9999] bg-popover border-secondary border rounded-xl shadow-lg mt-2 overflow-visible">
							<div class="p-4 border-secondary border-b bg-muted">
								<input
									type="text"
									placeholder="Search countries..."
									bind:value={searchTerm}
									class="form__input w-full text-sm"
								/>
							</div>
							<div class="overflow-y-auto bg-popover max-h-80">
								{#each filteredCountries as country}
									<button
										type="button"
										on:click={() => selectCountry(country)}
										class="w-full p-4 text-left hover:bg-accent text-popover flex items-center gap-3 transition-colors border-b border-secondary last:border-b-0"
									>
										<span class="text-xl">{country.flag}</span>
										<span class="font-mono text-sm text-muted w-16">{country.code}</span>
										<span class="truncate text-sm">{country.name}</span>
									</button>
								{/each}
								{#if filteredCountries.length === 0}
									<div class="p-4 text-center text-muted text-sm">
										No countries found
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<div class="relative flex-1">
					<input
						type="tel"
						placeholder="61 234 567"
						value={nationalNumber}
						on:input={handleInput}
						class="form__input w-full pr-12 h-12"
						disabled={phoneState.isVerified}
					/>
					<Icon icon="mdi:phone" class="text-muted pointer-events-none absolute inset-y-0 right-0 my-auto mr-4 h-5 w-5"/>
				</div>
			</div>

			<p class="text-muted text-xs">
				Full number: <span class="font-mono">{selectedCountry.code + ' ' + nationalNumber || selectedCountry.code + ' ...'}</span>
			</p>

			{#if phoneState.error}
				<p class="text-error text-sm">{phoneState.error}</p>
			{/if}

			{#if phoneState.success}
				<p class="text-success text-sm">{phoneState.success}</p>
			{/if}

			{#if !phoneState.isVerified}
				<button
					type="button"
					on:click={handleSendCode}
					disabled={phoneState.isLoading || nationalNumber.trim() === ''}
					class="bg-primary-600 hover:bg-primary-700 mt-2 w-full rounded-xl px-4 py-3 font-medium text-white flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition">
					{#if phoneState.isLoading}
						<Icon icon="mdi:loading" class="h-5 w-5 animate-spin" />
						Processing...
					{:else}
						Send Verification Code
					{/if}
				</button>
			{/if}
		</div>

		{#if phoneState.success && !phoneState.isVerified}
			<div class="border-secondary space-y-3 border-t pt-6">
				<label class="text-secondary mb-1 block font-medium">Verification Code</label>
				<input
					type="text"
					maxlength="4"
					placeholder="1234"
					value={phoneState.verificationCode}
					on:input={handleCodeInput}
					class="form__input text-center font-mono text-2xl tracking-wider w-full py-4"
				/>

				{#if phoneState.verifyError}
					<p class="text-error text-sm">{phoneState.verifyError}</p>
				{/if}

				<button
					type="button"
					on:click={handleVerifyCode}
					disabled={phoneState.isVerifying || phoneState.verificationCode.length !== 4}
					class="mt-2 w-full rounded-xl bg-green-600 px-4 py-3 font-medium text-white flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed transition">
					{#if phoneState.isVerifying}
						<Icon icon="mdi:loading" class="h-5 w-5 animate-spin" />
						Verifying...
					{:else}
						Verify Code
					{/if}
				</button>
			</div>
		{/if}

		{#if phoneState.isVerified}
			<div class="bg-success border-success mt-4 flex items-center gap-3 rounded-xl border p-4">
				<Icon icon="mdi:check" class="h-5 w-5 text-white bg-green-500 rounded-full p-1"/>
				<div>
					<p class="text-success font-medium">Phone Verified</p>
					<p class="text-success text-sm opacity-80">{fullPhoneNumber}</p>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if showDropdown}
	<div class="fixed inset-0 z-40" on:click={() => showDropdown = false}></div>
{/if}
