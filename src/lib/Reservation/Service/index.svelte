<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { getGalleryThumbnail } from '../../index';
	import { store, actions, initReservationStore, canProceed, currentStepName, totalSteps } from '@lib/core/stores/reservation';
 	import { t, getLocale, getRelativeLocaleUrl } from '@lib/i18n/index';
	import appConfig from '../../../appConfig';
	import { arky } from '@lib/index';

	import StepIndicator from '../StepIndicator/index.svelte';
	import TimeZoneSelector from '../TimeZoneSelector/index.svelte';
	import Calendar from '../Calendar/index.svelte';
	import AvailableSlots from '../AvailableSlots/index.svelte';
	import ReviewComponent from '../Review/index.svelte';
	import Blocks from '../Blocks/index.svelte';

	export let service;

	function getPrice(prices) {
		if (!prices || !Array.isArray(prices)) return "";
		// TODO: Get market from business config instead of hardcoded 'us'
		const market = 'us';
		return arky.utils.getMarketPrice(prices, market);
	}

	// Get currency from reservation store
	$: businessCurrency = $store.currency;

	onMount(() => {
		initReservationStore();
		actions.setService(service);
	});

	const locale = getLocale();
	const thumb = getGalleryThumbnail(service.blocks);
	const thumbUrl = thumb || null;

	// Filter out gallery block from display blocks
	const displayBlocks = service.blocks?.filter(block => block.key !== 'gallery') || [];
</script>

<div class="relative mt-16">
	{#if thumbUrl}
		<div class="relative h-[500px] w-full overflow-hidden rounded-t-2xl shadow-lg">
			<img src={thumbUrl}
			     alt={service.key}
			     class="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
			<div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/>
		</div>
	{/if}

	<div class={`w-full p-8 text-white ${!thumbUrl
		? 'relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-t-2xl'
		: 'absolute bottom-0 left-0'}`}>
		<div class="flex flex-wrap items-end justify-between gap-6">
			<div>
				<span class="bg-primary-500/50 inline-block rounded-full px-4 py-1.5 text-sm font-medium shadow-md backdrop-blur-md">
					{t('ui.premiumService')}
				</span>

				<h1 class="mt-2 text-4xl font-bold leading-tight md:text-5xl">
					{service.key}
				</h1>
			</div>

			<div class="bg-base-100/10 rounded-xl px-6 py-3 backdrop-blur-md">
				<p class="font-mono text-3xl font-bold">{getPrice(service.prices)}</p>
			</div>
		</div>
	</div>
</div>

<div class="mx-auto max-w-6xl px-4 py-12">
	<div class="border-secondary bg-card overflow-hidden rounded-2xl border shadow-md">
		<div class="border-secondary bg-secondary border-b px-6 py-4">
			<h2 class="text-primary text-2xl font-bold">{t('ui.serviceInformation')}</h2>
		</div>
		<div class="p-6">
			<Blocks blocks={displayBlocks} />
		</div>
	</div>
</div>

<div class="mx-auto max-w-6xl px-4 pb-12">
	<div class="border-secondary bg-card overflow-hidden rounded-2xl border shadow-md">
		<div class="border-secondary bg-secondary border-b px-6 py-4">
			<h2 class="text-primary text-2xl font-bold">{t('reservation.makeReservation')}</h2>
			<p class="text-muted mt-1 text-sm">
				{t('reservation.followSteps')}
			</p>
		</div>

		<div class="p-6 space-y-6">
			{#if $totalSteps > 1}
				<StepIndicator />
			{/if}

			{#key $currentStepName}
				{#if $currentStepName === 'datetime'}
				<div class="flex flex-col md:flex-row md:gap-6">
					<div class="md:w-1/2">
						<h3 class="text-primary mb-4 text-xl font-semibold">
							{!$store.isMultiDay ? t('reservation.selectDate') : t('reservation.selectDateRange')}
						</h3>
						<TimeZoneSelector />
						<Calendar />
					</div>

					<div class="mt-8 md:mt-0 md:w-1/2">
						{#if !$store.isMultiDay}
							<h3 class="text-primary mb-4 text-xl font-semibold">{t('reservation.selectTime')}</h3>
						{/if}
						<AvailableSlots />
						
						<!-- Display message if no time slot is selected -->
						{#if $store.selectedDate && (!$store.selectedSlot || $store.slots.length === 0)}
							<div class="bg-warning border-warning text-warning rounded-lg border p-3 mt-4">
								<div class="flex items-center gap-2">
									<Icon icon="mdi:alert" class="h-5 w-5 flex-shrink-0" />
									<span>{t('reservation.selectTimeSlot')}</span>
								</div>
							</div>
						{:else if $store.isMultiDay && $store.startDate && !$store.endDate}
							<div class="bg-warning border-warning text-warning rounded-lg border p-3 mt-4">
								<div class="flex items-center gap-2">
									<Icon icon="mdi:alert" class="h-5 w-5 flex-shrink-0" />
									<span>{t('reservation.selectEndDate')}</span>
								</div>
							</div>
						{/if}
					</div>
				</div>

				{#if $totalSteps > 1}
					<div class="flex justify-between pt-6">
						<button class="bg-tertiary hover:bg-secondary text-primary px-4 py-2 rounded-lg flex items-center gap-2"
						        on:click={() => actions.prevStep()}>
							<Icon icon="mdi:arrow-left" class="h-5 w-5" /> {t('ui.back')}
						</button>

						<!-- Make Continue button conditional based on canProceed value -->
						<button class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2
						               {!$canProceed ? 'opacity-50 cursor-not-allowed' : ''}"
						        disabled={!$canProceed}
						        on:click={() => actions.nextStep()}>
							{t('ui.continue')} <Icon icon="mdi:arrow-right" class="h-5 w-5" />
						</button>
					</div>
				{/if}

				{:else if $currentStepName === 'review'}
					<ReviewComponent />

					<div class="flex justify-between pt-6">
						<button class="bg-tertiary hover:bg-secondary text-primary px-4 py-2 rounded-lg flex items-center gap-2"
						        on:click={() => actions.prevStep()}>
							<Icon icon="mdi:arrow-left" class="h-5 w-5" /> {t('ui.back')}
						</button>
					</div>
				{/if}
			{/key}

		</div>
	</div>
</div>

