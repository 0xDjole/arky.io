<script>
	import Icon from '@iconify/svelte';
	import { store, actions } from '@lib/core/stores/reservation';
	import { t } from '../../../lib/i18n/index';
</script>

{#if $store.service?.reservationMethods?.length}
	<div class="bg-secondary border-secondary rounded-xl border p-4 shadow-lg" style="opacity: 0.8;">
		<h3 class="mb-4 text-xl font-bold text-primary">{t('ui.chooseReservationType', 'Choose Reservation Type')}</h3>
		
		<div class="grid gap-3 sm:grid-cols-2">
			{#if $store.service.reservationMethods.includes('STANDARD')}
				<button
					on:click={() => actions.handleMethodSelection('STANDARD')}
					class="flex w-full items-center gap-3 rounded-lg border p-3 transition-colors 
								{ $store.selectedMethod === 'STANDARD'
									? 'border-primary-500 bg-primary-900/40'
									: 'border-secondary bg-secondary hover:bg-tertiary' }">
					<div
						class="flex-shrink-0 rounded-full p-2
									{ $store.selectedMethod === 'STANDARD'
										? 'bg-primary-900/80 text-primary'
										: 'bg-primary-900/40 text-secondary' }">
						<Icon icon="mdi:calendar-check" class="h-5 w-5" />
					</div>

					<div class="text-left">
						<h4 class="text-lg font-medium text-primary">{t('reservation.standard')}</h4>
						<p class="text-secondary text-xs">{t('reservation.scheduleAnyTime', 'Schedule for any available time')}</p>
					</div>

					{#if $store.selectedMethod === 'STANDARD'}
						<Icon icon="mdi:check-circle" class="h-5 w-5 text-secondary ml-auto" />
					{/if}
				</button>
			{/if}

			{#if $store.service.reservationMethods.some(m => m.includes('SPECIFIC'))}
				{#each $store.service.reservationMethods.filter(m => m.includes('SPECIFIC')) as specificMethod}
					<button
						on:click={() => actions.handleMethodSelection(specificMethod)}
						class="flex w-full items-center gap-3 rounded-lg border p-3 transition-colors
									{ $store.selectedMethod === specificMethod
										? 'border-primary-500 bg-primary-900/40'
										: 'border-secondary bg-secondary hover:bg-tertiary' }">
						<div
							class="flex-shrink-0 rounded-full p-2
										{ $store.selectedMethod === specificMethod
											? 'bg-primary-900/80 text-primary'
											: 'bg-primary-900/40 text-secondary' }">
							<Icon icon="mdi:account-check" class="h-5 w-5" />
						</div>

						<div class="text-left">
							<h4 class="text-lg font-medium text-primary">{t('reservation.specific')}</h4>
							<p class="text-secondary text-xs">{t('reservation.chooseSpecificProvider', 'Choose a specific provider')}</p>
						</div>

						{#if $store.selectedMethod === specificMethod}
							<Icon icon="mdi:check-circle" class="h-5 w-5 text-secondary ml-auto" />
						{/if}
					</button>
				{/each}
			{/if}

			{#if $store.service.reservationMethods.includes('ORDER')}
				<button
					on:click={() => actions.handleMethodSelection('ORDER')}
					class="flex w-full items-center gap-3 rounded-lg border p-3 transition-colors
								{ $store.selectedMethod === 'ORDER'
									? 'border-primary-500 bg-primary-900/40'
									: 'border-secondary bg-secondary hover:bg-tertiary' }">
					<div
						class="flex-shrink-0 rounded-full p-2
									{ $store.selectedMethod === 'ORDER'
										? 'bg-primary-900/80 text-primary'
										: 'bg-primary-900/40 text-secondary' }">
						<Icon icon="mdi:cart-plus" class="h-5 w-5" />
					</div>

					<div class="text-left">
						<h4 class="text-lg font-medium text-primary">{t('reservation.directOrder', 'Direct Order')}</h4>
						<p class="text-secondary text-xs">{t('reservation.purchaseWithoutSchedule', 'Purchase without scheduling')}</p>
					</div>

					{#if $store.selectedMethod === 'ORDER'}
						<Icon icon="mdi:check-circle" class="h-5 w-5 text-secondary ml-auto" />
					{/if}
				</button>
			{/if}
		</div>
	</div>
{/if}
