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
