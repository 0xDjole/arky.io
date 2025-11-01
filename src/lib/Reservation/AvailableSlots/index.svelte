<script lang="ts">
	import Icon from '@iconify/svelte';
	import { store, actions } from '@lib/core/stores/reservation';
	import { t } from '../../../lib/i18n/index';
</script>

{#if !$store.isMultiDay && $store.slots.length && $store.selectedDate}
	<div class="bg-secondary border-secondary mt-4 rounded-xl border p-4 shadow-lg" style="opacity: 0.8;">
		<div class="border-secondary mb-3 flex items-center justify-between border-b pb-3">
			<h3 class="text-lg font-medium text-primary">{t('reservation.chooseTime')}</h3>
			<span class="bg-primary-900/40 text-primary rounded-full px-2 py-1 text-xs font-medium">
				{$store.slots.length} options
			</span>
		</div>

		<div class="space-y-2">
			{#each $store.slots as slot (slot.id)}
				<div class="flex items-center justify-between rounded-lg border p-3 transition-colors duration-200
				            {$store.selectedSlot?.id === slot.id
				              ? 'bg-primary-900/30 border-primary-700'
				              : 'bg-secondary hover:bg-tertiary border-secondary'}">
					<div class="flex items-center gap-3">
						<Icon icon="mdi:clock-outline"
						      class="h-5 w-5 text-primary"/>
						<span class="font-medium text-primary">{slot.timeText}</span>
					</div>

					{#if $store.selectedSlot?.id !== slot.id}
						<button on:click={() => actions.selectTimeSlot(slot)}
						        class="bg-tertiary hover:bg-secondary text-primary text-sm px-3 py-1 rounded-md transition">
							{t('ui.select', 'Select')}
						</button>
					{:else}
						<button on:click={() => actions.selectTimeSlot(null)}
						        class="text-secondary hover:text-primary text-xs flex items-center">
							<Icon icon="mdi:close" class="h-4 w-4"/>
						</button>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- multi-day indicator -->
{#if $store.isMultiDay && $store.startDate}
	<div class="bg-secondary border-secondary mt-4 rounded-xl border p-4 shadow-lg space-y-4" style="opacity: 0.8;">
		<div class="border-secondary mb-3 flex items-center justify-between border-b pb-3">
			<h3 class="text-lg font-medium text-primary">{t('reservation.selectedDateRange', 'Selected Date Range')}</h3>
			{#if $store.endDate}
				<span class="bg-primary-900/40 text-primary rounded-full px-2 py-1 text-xs font-medium">
					{Math.ceil((new Date($store.endDate).getTime() - new Date($store.startDate).getTime()) / 864e5) + 1} {t('days', 'days')}
				</span>
			{/if}
		</div>

		<!-- start only -->
		{#if $store.startDate && !$store.endDate}
			<div class="flex items-center gap-3 p-2">
				<Icon icon="mdi:calendar-start" class="h-5 w-5 text-secondary"/>
				<div>
					<p class="text-primary">{t('reservation.startDateSelected', 'Start date selected')}</p>
					<p class="text-secondary text-sm">{actions.formatDateDisplay($store.startDate)}</p>
					<p class="text-secondary mt-2 text-sm">{t('reservation.selectEndDate', 'Please select an end date')}</p>
				</div>
			</div>
		{:else if $store.startDate && $store.endDate}
			<!-- full range -->
			<div class="border-secondary rounded-lg border p-3 flex items-center gap-3">
				<Icon icon="mdi:calendar-range" class="h-5 w-5 text-secondary"/>
				<div>
					<p class="text-primary">{t('reservation.completeDateRange', 'Complete date range')}</p>
					<p class="text-secondary text-sm">
						{actions.formatDateDisplay($store.startDate)} to {actions.formatDateDisplay($store.endDate)}
					</p>
				</div>
			</div>

			<!-- generated range slot -->
			{#if $store.slots.length && $store.slots[0].isMultiDay}
				<div class="border-primary-700 bg-primary-900/30 mt-2 flex items-center gap-3 rounded-lg border p-3">
					<Icon icon="mdi:clock-outline" class="h-5 w-5 text-secondary"/>
					<span class="text-primary font-medium">{$store.slots[0].timeText}</span>
				</div>
			{/if}
		{/if}
	</div>
{/if}
