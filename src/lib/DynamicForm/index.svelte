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
import { zones } from '../core/stores/business';

// Minimal ISO country list for the Location block
const COUNTRIES = [
    { iso: 'BA', name: 'Bosnia and Herzegovina' },
    { iso: 'RS', name: 'Serbia' },
    { iso: 'HR', name: 'Croatia' },
    { iso: 'US', name: 'United States' },
    { iso: 'DE', name: 'Germany' },
    { iso: 'GB', name: 'United Kingdom' },
    { iso: 'FR', name: 'France' },
    { iso: 'IT', name: 'Italy' },
    { iso: 'ES', name: 'Spain' },
    { iso: 'NL', name: 'Netherlands' },
    { iso: 'CH', name: 'Switzerland' },
    { iso: 'AT', name: 'Austria' }
];

function countryNameFor(iso: string): string {
    const c = COUNTRIES.find((c) => c.iso.toUpperCase() === (iso || '').toUpperCase());
    return c ? c.name : (iso || '');
}

// Reactive list of available country codes based on zones (empty zones = all)
let countryCodes = $derived.by(() => {
    const z = $zones || [];
    const set = new Set<string>();
    let hasEmpty = false;
    for (const zone of z) {
        if (!zone.countries || zone.countries.length === 0) { hasEmpty = true; break; }
        zone.countries.forEach(c => set.add((c || '').toUpperCase()));
    }
    const list = hasEmpty || set.size === 0 ? COUNTRIES.map(c => c.iso) : Array.from(set);
    list.sort();
    return list;
});

	// Props
	let { 
		blocks = [], 
		onUpdate = (idx: number, value: unknown) => {},
		onPhoneSendCode = null,
		onPhoneVerifyCode = null,
		onValidationChange = (isValid: boolean, errors: any[]) => {}
	} = $props();

	// Get the current locale from the URL
	let currLocale;
	
	// Initialize the locale when component mounts
	onMount(() => {
		const url = new URL(window.location.href);
		currLocale = getLocaleFromUrl(url);
	});

	function update(idx: number, v: unknown) {
		onUpdate(idx, v);
		// Trigger validation check after any update
		setTimeout(validateAllFields, 0);
	}

	// Validation state
	let validationErrors = $state([]);
	let isFormValid = $state(false);
	let phoneVerified = $state({}); // Track if phone is verified by blockId

	// Validate all fields and notify parent
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
		
		// Notify parent component
		onValidationChange(isFormValid, errors);
		
		// Note: Removed automatic focus to prevent interference with PhoneInput component
	}

	// Run validation on mount and when blocks change
	$effect(() => {
		if (blocks.length > 0) {
			validateAllFields();
		}
	});

	// Helper function to get the string value from a block value
	function getBlockValue(block: any): string {
		if (!block.value || !block.value[0]) return '';
		const val = block.value[0];
		if (typeof val === 'string') return val;
		if (typeof val === 'object' && val.en !== undefined) return val.en || '';
		return '';
	}

	// Geo helpers
	function getGeo(block: any) {
		return (block?.value?.[0]) || {
			country: null,
			address: null,
			city: null,
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

	// Helper function to update block value properly - always use { en: value } format
	function updateBlockValue(idx: number, value: string) {
		update(idx, { en: value });
	}

	// Helper function to check if field is required based on pattern
	function isFieldRequired(block: any): boolean {
		const pattern = block.properties?.pattern;
		// All patterns make fields required except empty pattern
		return !!pattern || block.properties?.isRequired;
	}

	// Helper function to validate pattern
	function validatePattern(block: any, value: string): boolean {
		if (!block.properties?.pattern) return true;
		
		const trimmedValue = value?.trim() || '';
		if (!trimmedValue) return false; // Empty value fails validation if pattern exists
		
		try {
			const regex = new RegExp(block.properties.pattern);
			return regex.test(trimmedValue);
		} catch (e) {
			console.warn('Invalid regex pattern:', block.properties.pattern);
			return true;
		}
	}

	// Helper function to get validation error message
	function getValidationError(block: any, value: string): string {
		const trimmedValue = value?.trim() || '';
		
		if (isFieldRequired(block) && !trimmedValue) {
			return 'This field is required';
		}
		
		// Phone validation - must be verified
		if (block.properties?.variant === 'PHONE_NUMBER' && trimmedValue) {
			if (!phoneVerified[block.id]) {
				return 'Please verify your phone number';
			}
		}
		
		if (trimmedValue && !validatePattern(block, trimmedValue)) {
			// Return specific error messages based on pattern
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

	// Helper function to check if field has validation error
	function hasValidationError(block: any, value: string): boolean {
		return getValidationError(block, value) !== '';
	}

	// Handle phone verification status update
	function handlePhoneValidation(blockId: string, isVerified: boolean) {
		phoneVerified[blockId] = isVerified;
		validateAllFields();
	}

	// Parse range from options array like [">=10", "<=200"]
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

			{#if block.type === 'TEXT'}
				{#if block.properties?.variant === 'PHONE_NUMBER'}
					<PhoneInput
						blockId={block.id}
						value={getBlockValue(block)}
						onChange={(value) => updateBlockValue(idx, value)}
						onSendCode={onPhoneSendCode}
						onVerifyCode={onPhoneVerifyCode}
						onValidationChange={(isVerified) => handlePhoneValidation(block.id, isVerified)}
					/>
				{:else if block.properties?.variant === 'NOTE'}
					<!-- Textarea for notes -->
					<TextAreaInput
						value={getBlockValue(block)}
						placeholder={block.properties?.placeholder || ''}
						required={isFieldRequired(block)}
						onChange={(value) => updateBlockValue(idx, value)}
						onBlur={() => validateAllFields()}
					/>
				{:else if block.properties?.options && block.properties.options.length > 0}
					<!-- Dropdown for fields with options -->
					<SelectInput
						value={getBlockValue(block)}
						options={block.properties.options}
						required={isFieldRequired(block)}
						locale={currLocale}
						onChange={(value) => updateBlockValue(idx, value)}
						onBlur={() => validateAllFields()}
					/>
				{:else}
					<TextInput
						value={getBlockValue(block)}
						placeholder={block.properties?.placeholder || ''}
						required={isFieldRequired(block)}
						onChange={(value) => updateBlockValue(idx, value)}
						onBlur={() => validateAllFields()}
					/>
				{/if}
				{#if getValidationError(block, getBlockValue(block))}
					<div class="mt-1 text-xs text-error font-medium">
						<Icon icon="mdi:alert-circle" class="w-3 h-3 inline mr-1" />
						{getValidationError(block, getBlockValue(block))}
					</div>
				{/if}

            {:else if block.type === 'GEO_LOCATION'}
				<!-- Country selector -->
				<div class="space-y-3">
					<select
						class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground text-base"
						value={getGeo(block).countryCode || ''}
						onchange={(e) => {
							const code = e.currentTarget.value;
							updateGeo(idx, {
								countryCode: code,
								country: countryNameFor(code)
							});
						}}
					>
						<option value="">Select a country...</option>
						{#each countryCodes as code}
							<option value={code}>{countryNameFor(code)}</option>
						{/each}
					</select>

					{#if getGeo(block).countryCode}
						<!-- Optional address fields (shown after country selection) -->
						<input
							type="text"
							class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground placeholder-gray-500 text-base"
							placeholder="Address"
							value={getGeo(block).address || ''}
							oninput={(e) => updateGeo(idx, { address: e.currentTarget.value })}
						/>
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
				{#if block.properties?.variant === 'RANGE' && block.properties?.options?.length >= 2}
					{@const { min, max } = parseRangeOptions(block.properties.options)}
					<RangeInput
						value={block.value?.[0] ?? min}
						{min}
						{max}
						onChange={(value) => update(idx, value)}
					/>
				{:else}
					<RangeInput
						value={block.value?.[0] ?? block.properties.min ?? 0}
						min={block.properties.min ?? 0}
						max={block.properties.max ?? 100}
						onChange={(value) => update(idx, value)}
					/>
				{/if}
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
