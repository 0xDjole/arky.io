<script lang="ts">
	import Icon from '@iconify/svelte';
	import { t } from '@lib/i18n/index.js';

	let { 
		value = '',
		options = [],
		required = false,
		locale = 'en',
		onChange = (value: string) => {},
		onBlur = () => {}
	} = $props();

	function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		onChange(target.value);
	}
</script>

<div class="relative">
	<select
		class="w-full appearance-none rounded-lg border-0 bg-muted px-3 py-2 pr-10 text-foreground focus:bg-background"
		{value}
		{required}
		on:change={handleChange}
		on:blur={onBlur}
	>
		<option value="" disabled>{t('form.select', 'Select…')}</option>
		{#each options as option}
			<option value={option}>
				{typeof option === 'object' ? option[locale] || option.en : option}
			</option>
		{/each}
	</select>
	<Icon icon="mdi:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none text-muted-foreground" />
</div>