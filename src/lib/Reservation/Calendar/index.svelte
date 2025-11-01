<script lang="ts">
	import Icon from '@iconify/svelte';
	import { store, actions } from '@lib/core/stores/reservation';

	function discClass(cell) {
		if (cell.blank) return '';

		const avail = actions.isAvailable(cell);
		const sel = actions.isSelectedDay(cell);
		const inSpan = actions.isInSelectedRange(cell);

		if (sel) return 'bg-primary-900/50 border-2 border-primary-400 shadow-lg shadow-primary-500/20';
		if (inSpan) return 'bg-primary-500/30 border border-primary-700/40';
		if (avail) return 'bg-primary-900/20 border border-primary-800/40';

		return 'bg-transparent border-muted';
	}

	function numClass(cell) {
		if (cell.blank) return 'text-muted';
		if (actions.isSelectedDay(cell)) return 'text-primary font-bold';
		if (actions.isInSelectedRange(cell)) return 'text-secondary';
		if (actions.isAvailable(cell)) return 'text-secondary';
		return 'text-muted';
	}
</script>

<div class="bg-tertiary border-primary mx-auto max-w-md overflow-hidden rounded-xl border shadow-lg">
	<div class="relative p-5">
		<div class="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
			<div class="absolute inset-0 bg-gradient-primary"></div>
			<div class="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary-400 to-transparent"></div>
			<div class="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary-400 to-transparent"></div>
		</div>

		<div class="relative flex items-center justify-between">
			<button aria-label="Previous month"
			        on:click={() => actions.prevMonth()}
			        class="bg-secondary text-muted border-primary hover:bg-tertiary hover:text-primary flex h-10 w-10 items-center justify-center rounded-full border transition">
				<Icon icon="mdi:chevron-left" class="h-5 w-5"/>
			</button>

			<h3 class="text-xl font-bold tracking-wide text-primary">{$store.monthYear}</h3>

			<button aria-label="Next month"
			        on:click={() => actions.nextMonth()}
			        class="bg-secondary text-muted border-primary hover:bg-tertiary hover:text-primary flex h-10 w-10 items-center justify-center rounded-full border transition">
				<Icon icon="mdi:chevron-right" class="h-5 w-5"/>
			</button>
		</div>
	</div>

	{#if $store.isMultiDay}
		<div class="bg-secondary border-secondary border-b px-4 py-3 text-center text-primary text-sm font-medium flex items-center justify-center gap-2">
			<Icon icon="mdi:calendar-range" class="h-5 w-5"/>
			{#if !$store.startDate}
				SELECT&nbsp;START&nbsp;DATE
			{:else if !$store.endDate}
				SELECT&nbsp;END&nbsp;DATE
			{:else}
				<span class="flex items-center gap-2">
					{actions.formatDateDisplay($store.startDate)}
					<svg class="text-primary h-4 w-8" viewBox="0 0 24 6" fill="none">
						<path d="M0 3h24" stroke="currentColor" stroke-width=".5" stroke-dasharray="1 3"/>
						<path d="M24 3l-3 2M24 3l-3 -2" stroke="currentColor" stroke-width=".5"/>
					</svg>
					{actions.formatDateDisplay($store.endDate)}
				</span>
			{/if}
		</div>
	{/if}

	<div class="bg-tertiary border-secondary grid grid-cols-7 border-b p-3 text-center">
		{#each $store.weekdays as d}
			<div class="text-muted text-xs font-medium uppercase tracking-wider">{d}</div>
		{/each}
	</div>

	<div class="bg-tertiary grid grid-cols-7 gap-1.5 p-4">
		{#each $store.days as cell}
			<div class="group relative flex aspect-square items-center justify-center {cell.blank ? 'text-muted cursor-default' : 'cursor-pointer'}"
			     on:click={() => !cell.blank && actions.selectDate(cell)}>

				{#if !cell.blank}
					<div class={"absolute inset-2 rounded-full transition-all " + discClass(cell)}></div>
				{/if}

				<span class={"relative z-10 text-sm " + numClass(cell)}>
					{cell.blank ? '' : cell.date?.getDate()}
				</span>

				{#if !cell.blank && actions.isAvailable(cell) && !actions.isSelectedDay(cell)}
					<div class="bg-primary-400 shadow-sm absolute -bottom-2 mt-2 h-1.5 w-1.5 rounded-full"></div>
				{/if}
			</div>
		{/each}
	</div>

	{#if $store.isMultiDay && ($store.startDate || $store.endDate)}
		<div class="border-secondary border-t p-3 text-center">
			<button on:click={actions.resetDateSelection}
			        class="bg-secondary text-primary hover:bg-tertiary hover:text-secondary border-primary px-4 py-2 text-sm font-medium rounded-md flex items-center gap-1.5 mx-auto border transition">
				<Icon icon="mdi:refresh" class="h-4 w-4"/> RESET
			</button>
		</div>
	{/if}
</div>
