<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { getLocale, getLocaleFromUrl, t } from '@lib/i18n/index.js';
	import { getBlockLabel } from '@lib/index.ts';
	import PhoneInput from '@lib/shared/PhoneInput/index.svelte';
	import TextInput from './TextInput.svelte';
	import TextAreaInput from './TextAreaInput.svelte';
	import SelectInput from './SelectInput.svelte';
	import CheckboxInput from './CheckboxInput.svelte';
import RangeInput from './RangeInput.svelte';
import { countries } from 'countries-list';
import { selectedMarket, zoneDefinitions } from '../core/stores/business';

const ALL_COUNTRIES = Object.entries(countries)
    .map(([iso, data]) => ({
        iso: iso,
        name: data.name
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

let availableCountries = $derived.by(() => {
    const market = $selectedMarket;
    const zones = $zoneDefinitions;

    if (!market || !market.zones || market.zones.length === 0) {
        return [];
    }

    const relevantZoneIds = market.zones.map(mz => mz.zoneId);
    const relevantZones = zones.filter(z => relevantZoneIds.includes(z.id));

    const hasGlobalZone = relevantZones.some(z => z.countries.length === 0);
    if (hasGlobalZone) {
        return ALL_COUNTRIES;
    }

    const uniqueCountryCodes = new Set<string>();
    relevantZones.forEach(zone => {
        zone.countries.forEach(countryCode => uniqueCountryCodes.add(countryCode));
    });

    // Map ISO codes to full country objects
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

	function getAvailableStates(selectedCountry: string) {
		const market = $selectedMarket;
		const zones = $zoneDefinitions;

		if (!market || !selectedCountry) return [];

		const relevantZoneIds = market.zones.map(mz => mz.zoneId);
		const relevantZones = zones.filter(z => relevantZoneIds.includes(z.id));

		const matchingZones = relevantZones.filter(z =>
			z.countries.length === 0 || z.countries.includes(selectedCountry)
		);

		const uniqueStates = new Set<string>();
		matchingZones.forEach(zone => {
			zone.states.forEach(state => uniqueStates.add(state));
		});

		return Array.from(uniqueStates).sort();
	}

	function getAvailableCities(selectedCountry: string, selectedState: string | null) {
		const market = $selectedMarket;
		const zones = $zoneDefinitions;

		if (!market || !selectedCountry) return [];

		const relevantZoneIds = market.zones.map(mz => mz.zoneId);
		const relevantZones = zones.filter(z => relevantZoneIds.includes(z.id));

		const matchingZones = relevantZones.filter(z => {
			const countryMatch = z.countries.length === 0 || z.countries.includes(selectedCountry);
			const stateMatch = !selectedState || z.states.length === 0 || z.states.includes(selectedState);
			return countryMatch && stateMatch;
		});

		const uniqueCities = new Set<string>();
		matchingZones.forEach(zone => {
			zone.cities.forEach(city => uniqueCities.add(city));
		});

		return Array.from(uniqueCities).sort();
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
						{@const availableCities = getAvailableCities(getGeo(block).countryCode, getGeo(block).state)}

						<input
							type="text"
							class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground placeholder-gray-500 text-base"
							placeholder="Address"
							value={getGeo(block).address || ''}
							oninput={(e) => updateGeo(idx, { address: e.currentTarget.value })}
						/>

						{#if availableStates.length > 0}
							<select
								class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground text-base"
								value={getGeo(block).state || ''}
								onchange={(e) => {
									updateGeo(idx, {
										state: e.currentTarget.value,
										city: null
									});
								}}
							>
								<option value="">Select a state...</option>
								{#each availableStates as state}
									<option value={state}>{state}</option>
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
							{#if availableCities.length > 0}
								<select
									class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground text-base"
									value={getGeo(block).city || ''}
									onchange={(e) => updateGeo(idx, { city: e.currentTarget.value })}
								>
									<option value="">Select a city...</option>
									{#each availableCities as city}
										<option value={city}>{city}</option>
									{/each}
								</select>
							{:else}
								<input
									type="text"
									class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground placeholder-gray-500 text-base"
									placeholder="City"
									value={getGeo(block).city || ''}
									oninput={(e) => updateGeo(idx, { city: e.currentTarget.value })}
								/>
							{/if}

							<input
								type="text"
								class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground placeholder-gray-500 text-base"
								placeholder="Postal Code"
								value={getGeo(block).postalCode || ''}
								oninput={(e) => updateGeo(idx, { postalCode: e.currentTarget.value })}
							/>
						</div>
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
