<script>
	import Icon from '@iconify/svelte';          
	import { store, actions } from '@lib/core/stores/reservation';
	import { t } from '../../../lib/i18n/index';
	
	const changeTZ = (e) => actions.setSelectedTimeZone(e.target.value);
	
	function isMissingTimezone() {
		return !Object.values($store.tzGroups).flat().some((t) => t.zone === $store.timezone);
	}
</script>

<div class="mb-6">
	<label class="text-secondary mb-2 block text-sm font-medium">
		{t('reservation.timezone')}
	</label>
	
	<div class="relative w-full">
		<select
			class="bg-secondary border-secondary focus:ring-primary-500 w-full appearance-none rounded-lg
							border p-3 pr-9 text-sm text-primary focus:ring-1 focus:outline-none"
			bind:value={$store.timezone}
			on:change={changeTZ}
		>
			{#each Object.entries($store.tzGroups) as [region, zones]}
				<optgroup label={region} class="bg-tertiary text-secondary">
					{#each zones as tz}
						<option value={tz.zone}>{tz.name}</option>
					{/each}
				</optgroup>
			{/each}
			
			{#if isMissingTimezone()}
				<optgroup label={t('reservation.currentLocation')} class="bg-tertiary text-secondary">
					<option value={$store.timezone}>{$store.timezone}</option>
				</optgroup>
			{/if}
		</select>
		
		<Icon
			icon="mdi:chevron-down"
			class="text-muted pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2"
		/>
	</div>
</div>
