<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { getLocale, getLocaleFromUrl, t } from '@lib/i18n/index.js';
	import { getBlockLabel, arky } from '@lib/index.ts';
	import PhoneInput from '@lib/shared/PhoneInput/index.svelte';
	import TextInput from './TextInput.svelte';
	import TextAreaInput from './TextAreaInput.svelte';
	import SelectInput from './SelectInput.svelte';
	import CheckboxInput from './CheckboxInput.svelte';
	import RangeInput from './RangeInput.svelte';
	import { selectedMarket, zones, getZonesForMarket } from '../core/stores/business';

	// Location data from SDK
	let countriesData = $state<Array<{ code: string; name: string; states: Array<{ code: string; name: string }> }>>([]);
	let loadingCountries = $state(true);

	onMount(async () => {
		try {
			const response = await arky.location.getCountries();
			countriesData = response.items || [];
		} catch (error) {
			console.error('Failed to load countries:', error);
		} finally {
			loadingCountries = false;
		}
	});

	const ALL_COUNTRIES = $derived(
		countriesData.map(c => ({ iso: c.code, name: c.name }))
			.sort((a, b) => a.name.localeCompare(b.name))
	);

	let availableCountries = $derived.by(() => {
		const market = $selectedMarket;
		if (!market || countriesData.length === 0) return [];

		const marketZones = getZonesForMarket(market.id);
		if (marketZones.length === 0) return [];

		const hasGlobalZone = marketZones.some(z => z.countries.length === 0);
		if (hasGlobalZone) {
			return ALL_COUNTRIES;
		}

		const uniqueCountryCodes = new Set<string>();
		marketZones.forEach(zone => {
			zone.countries.forEach(countryCode => uniqueCountryCodes.add(countryCode));
		});

		return Array.from(uniqueCountryCodes)
			.map(iso => ALL_COUNTRIES.find(c => c.iso === iso))
			.filter(c => c !== undefined)
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	// Props
	let {
		blocks = [],
		onUpdate = (idx: number, value: unknown) => {},
		onPhoneSendCode = null,
		onPhoneVerifyCode = null,
		onValidationChange = (isValid: boolean, errors: any[]) => {}
	} = $props();

	let currLocale;

	onMount(() => {
		const url = new URL(window.location.href);
		currLocale = getLocaleFromUrl(url);
	});

	function update(idx: number, v: unknown) {
		onUpdate(idx, v);
		setTimeout(validateAllFields, 0);
	}

	let validationErrors = $state([]);
	let isFormValid = $state(false);
	let phoneVerified = $state({});

	function validateAllFields() {
		const errors = [];

		blocks.forEach((block, idx) => {
			const value = getBlockValue(block);
			const error = getValidationError(block, value);

			if (error) {
				const fieldLabel = getBlockLabel(block, currLocale) || block.key;
				errors.push({
					index: idx,
					blockKey: fieldLabel,
					message: error,
					value: value,
					pattern: block.properties?.pattern
				});
			}
		});

		validationErrors = errors;
		isFormValid = errors.length === 0;

		onValidationChange(isFormValid, errors);
	}

	$effect(() => {
		if (blocks.length > 0) {
			validateAllFields();
		}
	});

	function getBlockValue(block: any): string {
		if (!block.value || !block.value[0]) return '';
		const val = block.value[0];
		if (typeof val === 'string') return val;
		if (typeof val === 'object' && val.en !== undefined) return val.en || '';
		return '';
	}

	function getGeo(block: any) {
		return (block?.value?.[0]) || {
			country: null,
			address: null,
			city: null,
			state: null,
			postalCode: null,
			countryCode: null,
			coordinates: null
		};
	}

	function updateGeo(idx: number, patch: any) {
		const current = getGeo(blocks[idx]);
		const next = { ...current, ...patch };
		update(idx, next);
		setTimeout(validateAllFields, 0);
	}

	function getAvailableStates(selectedCountry: string): Array<{ code: string; name: string }> {
		const market = $selectedMarket;
		if (!market || !selectedCountry) return [];

		const marketZones = getZonesForMarket(market.id);
		const matchingZones = marketZones.filter(z =>
			z.countries.length === 0 || z.countries.includes(selectedCountry)
		);

		// If ANY matching zone has empty states array, show all states from SDK
		// This means that zone accepts all states for this country
		const hasZoneWithAllStates = matchingZones.some(z => !z.states || z.states.length === 0);

		if (hasZoneWithAllStates) {
			// Show all states from SDK for this country
			const countryData = countriesData.find(c => c.code === selectedCountry);
			if (!countryData || !countryData.states) return [];
			// Copy array before sorting to avoid mutating state
			return [...countryData.states].sort((a, b) => a.name.localeCompare(b.name));
		}

		// All matching zones have specific states - collect and show only those
		const zoneStates = new Set<string>();
		matchingZones.forEach(zone => {
			(zone.states || []).forEach(state => zoneStates.add(state));
		});

		if (zoneStates.size === 0) {
			// No states defined in any zone - country doesn't use states
			return [];
		}

		const countryData = countriesData.find(c => c.code === selectedCountry);
		if (!countryData) {
			// No SDK data for country, return zone states as-is
			return Array.from(zoneStates).map(s => ({ code: s, name: s })).sort((a, b) => a.name.localeCompare(b.name));
		}
		// Return only states that are in both zone config AND SDK data
		// filter() already creates a new array so sort() is safe here
		return countryData.states
			.filter(s => zoneStates.has(s.code))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	function updateBlockValue(idx: number, value: string) {
		const block = blocks[idx];
		if (block.type === 'PHONE_NUMBER' || block.type === 'EMAIL') {
			update(idx, value);
		} else {
			update(idx, { en: value });
		}
	}

	function isFieldRequired(block: any): boolean {
		const pattern = block.properties?.pattern;
		return !!pattern || block.properties?.isRequired;
	}

	function validatePattern(block: any, value: string): boolean {
		if (!block.properties?.pattern) return true;

		const trimmedValue = value?.trim() || '';
		if (!trimmedValue) return false;

		try {
			const regex = new RegExp(block.properties.pattern);
			return regex.test(trimmedValue);
		} catch (e) {
			console.warn('Invalid regex pattern:', block.properties.pattern);
			return true;
		}
	}

	function getValidationError(block: any, value: string): string {
		const trimmedValue = value?.trim() || '';

		if (isFieldRequired(block) && !trimmedValue) {
			return 'This field is required';
		}

		if (block.type === 'PHONE_NUMBER' && trimmedValue) {
			if (!phoneVerified[block.id]) {
				return 'Please verify your phone number';
			}
		}

		if (trimmedValue && !validatePattern(block, trimmedValue)) {
			const pattern = block.properties?.pattern;
			if (pattern === '^.+@.+\\..+$') {
				return 'Please enter a valid email address';
			} else if (pattern === '^.{6,20}$') {
				return 'Phone number must be 6-20 characters';
			} else if (pattern === '^https?:\\/\\/.+$') {
				return 'Please enter a valid URL';
			} else {
				return 'Invalid format';
			}
		}

		return '';
	}

	function hasValidationError(block: any, value: string): boolean {
		return getValidationError(block, value) !== '';
	}

	function handlePhoneValidation(blockId: string, isVerified: boolean) {
		phoneVerified[blockId] = isVerified;
		validateAllFields();
	}

	function parseRangeOptions(options: string[]): { min: number; max: number } {
		const parseOperationNumber = (str: string) => {
			const trimmed = str.trim();
			if (trimmed.startsWith('>=')) return parseFloat(trimmed.slice(2)) || 0;
			if (trimmed.startsWith('<=')) return parseFloat(trimmed.slice(2)) || 0;
			if (trimmed.startsWith('>')) return parseFloat(trimmed.slice(1)) || 0;
			if (trimmed.startsWith('<')) return parseFloat(trimmed.slice(1)) || 0;
			return parseFloat(trimmed) || 0;
		};
		const min = parseOperationNumber(options[0]);
		const max = parseOperationNumber(options[1]);
		return { min, max };
	}

</script>

{#if blocks?.length > 0}
	{#each blocks as block, idx (block.id)}
		<div class="space-y-2 mb-4">
			{#if getBlockLabel(block, currLocale)}
				<label class="mb-1 block font-medium text-foreground">
					{getBlockLabel(block, currLocale)}
					{#if isFieldRequired(block)}
						<span class="text-error ml-1">*</span>
					{/if}
				</label>
			{/if}

			{#if block.type === 'PHONE_NUMBER'}
				<PhoneInput
					blockId={block.id}
					value={getBlockValue(block)}
					onChange={(value) => updateBlockValue(idx, value)}
					onSendCode={onPhoneSendCode}
					onVerifyCode={onPhoneVerifyCode}
					onValidationChange={(isVerified) => handlePhoneValidation(block.id, isVerified)}
				/>
			{:else if block.type === 'EMAIL'}
				<TextInput
					value={getBlockValue(block)}
					placeholder={block.properties?.placeholder || 'Email'}
					required={isFieldRequired(block)}
					onChange={(value) => updateBlockValue(idx, value)}
					onBlur={() => validateAllFields()}
				/>
				{#if getValidationError(block, getBlockValue(block))}
					<div class="mt-1 text-xs text-error font-medium">
						<Icon icon="mdi:alert-circle" class="w-3 h-3 inline mr-1" />
						{getValidationError(block, getBlockValue(block))}
					</div>
				{/if}
			{:else if block.type === 'TEXT_NOTE'}
				<TextAreaInput
					value={getBlockValue(block)}
					placeholder={block.properties?.placeholder || ''}
					required={isFieldRequired(block)}
					onChange={(value) => updateBlockValue(idx, value)}
					onBlur={() => validateAllFields()}
				/>
			{:else if block.type === 'TEXT'}
				<TextInput
					value={getBlockValue(block)}
					placeholder={block.properties?.placeholder || ''}
					required={isFieldRequired(block)}
					onChange={(value) => updateBlockValue(idx, value)}
					onBlur={() => validateAllFields()}
				/>
				{#if getValidationError(block, getBlockValue(block))}
					<div class="mt-1 text-xs text-error font-medium">
						<Icon icon="mdi:alert-circle" class="w-3 h-3 inline mr-1" />
						{getValidationError(block, getBlockValue(block))}
					</div>
				{/if}

            {:else if block.type === 'GEO_LOCATION'}
				<div class="space-y-3">
					<select
						class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground text-base"
						value={getGeo(block).countryCode || ''}
						onchange={(e) => {
							const countryIso = e.currentTarget.value;
							const countryObj = ALL_COUNTRIES.find(c => c.iso === countryIso);
							updateGeo(idx, {
								country: countryObj?.name || null,
								countryCode: countryIso,
								state: null,
								city: null
							});
						}}
					>
						<option value="">Select a country...</option>
						{#each availableCountries as country}
							<option value={country.iso}>{country.name}</option>
						{/each}
					</select>

					{#if getGeo(block).countryCode}
						{@const availableStates = getAvailableStates(getGeo(block).countryCode)}

						{#if availableStates.length > 0}
							<select
								class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground text-base"
								value={getGeo(block).state || ''}
								onchange={(e) => updateGeo(idx, { state: e.currentTarget.value })}
							>
								<option value="">Select a state...</option>
								{#each availableStates as state}
									<option value={state.code}>{state.name}</option>
								{/each}
							</select>
						{:else}
							<input
								type="text"
								class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground placeholder-gray-500 text-base"
								placeholder="State/Province (optional)"
								value={getGeo(block).state || ''}
								oninput={(e) => updateGeo(idx, { state: e.currentTarget.value })}
							/>
						{/if}

						<div class="grid grid-cols-2 gap-3">
							<input
								type="text"
								class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground placeholder-gray-500 text-base"
								placeholder="City"
								value={getGeo(block).city || ''}
								oninput={(e) => updateGeo(idx, { city: e.currentTarget.value })}
							/>

							<input
								type="text"
								class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground placeholder-gray-500 text-base"
								placeholder="Postal Code"
								value={getGeo(block).postalCode || ''}
								oninput={(e) => updateGeo(idx, { postalCode: e.currentTarget.value })}
							/>
						</div>

						<input
							type="text"
							class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground placeholder-gray-500 text-base"
							placeholder="Address"
							value={getGeo(block).address || ''}
							oninput={(e) => updateGeo(idx, { address: e.currentTarget.value })}
						/>
					{/if}
				</div>

				{#if isFieldRequired(block) && !(getGeo(block).countryCode)}
					<div class="mt-1 text-xs text-error font-medium">
						<Icon icon="mdi:alert-circle" class="w-3 h-3 inline mr-1" />
						Country is required.
					</div>
				{/if}

			{:else if block.type === 'BOOLEAN'}
				<CheckboxInput
					value={block.value?.[0] ?? false}
					label={getBlockLabel(block, currLocale)}
					onChange={(value) => update(idx, value)}
				/>

			{:else if block.type === 'NUMBER'}
				<RangeInput
					value={block.value?.[0] ?? block.properties.min ?? 0}
					min={block.properties.min ?? 0}
					max={block.properties.max ?? 100}
					onChange={(value) => update(idx, value)}
				/>
			{/if}

			{#if block.properties?.description}
				<p class="mt-1 text-sm italic text-muted-foreground">
					{typeof block.properties.description === 'object'
						? block.properties.description[currLocale] || block.properties.description.en
						: block.properties.description}
				</p>
			{/if}
		</div>
	{/each}
{/if}
