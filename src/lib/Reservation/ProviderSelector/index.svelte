<script>
	import Icon from '@iconify/svelte';
	import { store, actions } from '@lib/core/stores/reservation';
	import { t } from '../../../lib/i18n/index';
</script>

{#if $store.selectedMethod?.includes('SPECIFIC')}
	<div class="bg-secondary border-secondary rounded-xl border p-4 shadow-lg mt-0" style="opacity: 0.8;">
		<h3 class="mb-4 text-xl font-bold text-primary">{t('reservation.provider')}</h3>

		{#if $store.providers.length === 0 && $store.loading}
			<div class="py-6 text-center">
				<div class="text-secondary bg-primary-900/40 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
					<Icon icon="mdi:loading" class="h-8 w-8 animate-spin" />
				</div>
				<p class="text-secondary">{t('ui.loadingProviders')}</p>
			</div>
		{:else if $store.providers.length === 0}
			<div class="py-6 text-center">
				<div class="text-secondary bg-primary-900/40 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
					<Icon icon="mdi:account-off" class="h-8 w-8" />
				</div>
				<p class="text-secondary">{t('ui.noProvidersAvailable')}</p>
			</div>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2">
				{#each $store.providers as r (r.id)}
					<button
						on:click={() => actions.selectProvider(r)}
						class="flex w-full items-center gap-3 rounded-lg border p-3 transition-colors
							{ $store.selectedProvider?.id === r.id
								? 'border-primary-500 bg-primary-900/40'
								: 'border-secondary bg-secondary hover:bg-tertiary' }">
						{#if r.gallery?.length}
							<div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
								<img
									src={`${$store.storageUrl}/${r.gallery[0].media.resolutions.thumbnail?.url ?? r.gallery[0].media.resolutions.original?.url}`}
									alt={r.name}
									referrerpolicy="no-referrer"
									class="h-full w-full object-cover"
								/>
							</div>
						{:else}
							<div class="text-secondary bg-primary-900/30 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
								<Icon icon="mdi:account" class="h-6 w-6" />
							</div>
						{/if}

						<div class="min-w-0 flex-1 text-left">
							<div class="flex items-center">
								<h4 class="truncate text-base font-medium text-primary">{r.name}</h4>
								{#if $store.selectedProvider?.id === r.id}
									<Icon icon="mdi:check-circle" class="h-5 w-5 text-secondary ml-2" />
								{/if}
							</div>
							{#if r.description}
								<p class="text-secondary truncate text-xs">{r.description}</p>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{/if}

		<div class="mt-6 flex justify-between">
			<button 
				class="bg-tertiary hover:bg-secondary text-primary px-4 py-2 rounded-lg flex items-center gap-2 transition"
				on:click={() => actions.prevStep()}>
				<Icon icon="mdi:arrow-left" class="h-5 w-5" />
				{t('ui.back')}
			</button>

			<button
				class="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition {!$store.selectedProvider ? 'opacity-50 cursor-not-allowed' : ''}"
				on:click={() => actions.nextStep()}
				disabled={!$store.selectedProvider}>
				{t('ui.continue')}
				<Icon icon="mdi:arrow-right" class="h-5 w-5" />
			</button>
		</div>
	</div>
{/if}
