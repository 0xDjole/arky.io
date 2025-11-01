<script>
	import { onMount } from 'svelte';
	import { getLocale, getRelativeLocaleUrl } from "@lib/i18n";
import { store as reservationStore, actions as reservationActions, initReservationStore } from '@lib/core/stores/reservation';
import { businessActions } from '@lib/core/stores/business';
import { arky } from '@lib/index';
	import appConfig from '../../../appConfig';

	const API_URL = appConfig.apiUrl;
	const STORAGE_URL = appConfig.storageUrl;
	const BUSINESS_ID = appConfig.businessId;

	let locale = "en";
	let services = [];
	let loading = true;
	let error = null;

	// Get currency from reservation store
	$: businessCurrency = $reservationStore.currency;

	function getGalleryThumbnail(gallery) {
		if (!gallery?.length) return null;
		const item = gallery.find((g) => g.settings?.isThumbnail) || gallery[0];
		const res = item.media.resolutions.thumbnail || item.media.resolutions.original;
		return res?.url || null;
	}

	function displayServicePrice(service) {
		// Prefer new market-based prices
		if (service?.prices && Array.isArray(service.prices) && service.prices.length > 0) {
			// TODO: Get market from business config instead of hardcoded 'us'
			return arky.utils.getMarketPrice(service.prices, 'us');
		}
		return '';
	}

	async function loadServices() {
		try {
			loading = true;
			error = null;
			const res = await fetch(
				`${API_URL}/v1/businesses/${BUSINESS_ID}/services?limit=100`
			);
			
			if (!res.ok) {
				throw new Error('Failed to load services');
			}
			
			const { items } = await res.json();
			services = items;
		} catch (e) {
			error = e.message;
			console.error('Error loading services:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		// Initialize reservation store (which also initializes business store)
		initReservationStore();
		loadServices();
	});
</script>

{#if loading}
	<div class="mt-20 w-full">
		<!-- Clean loading indicator -->
		<div class="flex items-center justify-center mb-12">
			<div class="flex items-center space-x-3">
				<svg class="h-6 w-6 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			</div>
		</div>
		
		<!-- YouTube-style skeleton cards -->
		<div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
			{#each Array(6) as _, i}
				<div class="skeleton-card bg-card rounded-xl overflow-hidden shadow-sm">
					<!-- Image skeleton with gradient animation -->
					<div class="skeleton-shimmer" style="height: 200px;"></div>
					
					<div class="p-6">
						<!-- Title skeleton -->
						<div class="skeleton-shimmer h-6 rounded-md mb-3" style="width: {80 + (i % 3) * 10}%;"></div>
						
						<!-- Description lines -->
						<div class="skeleton-shimmer h-4 rounded mb-2" style="width: {90 - (i % 2) * 15}%;"></div>
						<div class="skeleton-shimmer h-4 rounded mb-4" style="width: {65 + (i % 4) * 12}%;"></div>
						
						<!-- Price skeleton -->
						<div class="skeleton-shimmer h-5 rounded-md" style="width: {35 + (i % 3) * 20}%;"></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{:else if error}
	<div class="mt-20 flex flex-col items-center justify-center space-y-4">
		<div class="text-error text-center">
			<p class="text-lg font-medium">Failed to load services</p>
			<p class="text-sm mt-1">{error}</p>
		</div>
		<button 
			on:click={loadServices}
			class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
		>
			Try again
		</button>
	</div>
{:else}
	<div class="mt-20 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
		{#if services.length === 0}
			<p class="col-span-full text-muted text-center py-12">No services found.</p>
		{:else}
			{#each services as service (service.id)}
			{@const thumbPath = getGalleryThumbnail(service.gallery)}
			{@const thumbUrl = thumbPath ? `${STORAGE_URL}/${thumbPath}` : null}

			<a
				href={getRelativeLocaleUrl(getLocale(), `/services/${service.slug}`) }
				class="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
			>
				{#if thumbUrl}
					<img
						src={thumbUrl}
						alt={service.name[locale] || service.name.en}
						referrerpolicy="no-referrer"
						class="w-full h-48 object-cover"
					/>
				{:else}
					<div class="w-full h-48 bg-muted flex items-center justify-center">
						<p class="text-muted text-sm">No image</p>
					</div>
				{/if}

				<div class="p-6">
					<h3 class="text-lg font-semibold text-primary mb-2">
						{service.name[locale] || service.name.en}
					</h3>
					<p class="text-muted text-sm mb-3">
						{service.description?.[locale] || service.description?.en || ""}
					</p>
					<p class="text-primary-600 font-medium">
						{displayServicePrice(service)}
					</p>
				</div>
			</a>
		{/each}
	{/if}
</div>
{/if}

<style>
	.skeleton-card {
		animation: skeleton-appear 0.6s ease-out forwards;
		opacity: 0;
	}

	.skeleton-card:nth-child(1) { animation-delay: 0.1s; }
	.skeleton-card:nth-child(2) { animation-delay: 0.2s; }
	.skeleton-card:nth-child(3) { animation-delay: 0.3s; }
	.skeleton-card:nth-child(4) { animation-delay: 0.4s; }
	.skeleton-card:nth-child(5) { animation-delay: 0.5s; }
	.skeleton-card:nth-child(6) { animation-delay: 0.6s; }

	@keyframes skeleton-appear {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.skeleton-shimmer {
		background: linear-gradient(
			90deg,
			var(--bg-muted) 0%,
			var(--bg-accent) 50%,
			var(--bg-muted) 100%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}
</style>