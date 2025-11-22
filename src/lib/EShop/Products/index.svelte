<script>
	import { onMount } from 'svelte';
	import { arky } from '@lib/index';
	import { getLocale } from '@lib/i18n';
	import appConfig from '../../../appConfig';
	import { showToast } from '@lib/toast.js';
	import { store } from '@lib/core/stores/eshop';

	const locale = getLocale();

	let products = [];
	let loading = true;
	let error = null;

	async function loadProducts() {
		try {
			loading = true;
			error = null;

			const response = await arky.eshop.getProducts({
				status: 'ACTIVE',
				limit: 50
			});

			products = response.items || [];
		} catch (err) {
			error = 'Failed to load products';
			console.error('Error loading products:', err);
		} finally {
			loading = false;
		}
	}

	function getGalleryThumbnail(blocks) {
		if (!blocks || !Array.isArray(blocks)) return null;

		const galleryBlock = blocks.find((block) => block.key === 'gallery');
		if (!galleryBlock?.value?.length) return null;

		const items = galleryBlock.value
			.map((itemBlock) => {
				if (!itemBlock.value || !Array.isArray(itemBlock.value)) return null;

				const isThumbnailBlock = itemBlock.value.find((b) => b.key === 'is_thumbnail');
				const mediaBlock = itemBlock.value.find((b) => b.key === 'media');

				if (!mediaBlock?.value?.[0]) return null;

				return {
					isThumbnail: isThumbnailBlock?.value?.[0] || false,
					media: mediaBlock.value[0]
				};
			})
			.filter(Boolean);

		if (!items.length) return null;

		const item = items.find((g) => g.isThumbnail) || items[0];
		const res = item.media?.resolutions?.thumbnail || item.media?.resolutions?.original;
		return res?.url || null;
	}

	function getDefaultVariant(product) {
		return product.variants?.find(v => v.isDefault) || product.variants?.[0];
	}

function displayVariantPrice(variant) {
		if (!variant) return '';
		if (variant.prices && Array.isArray(variant.prices) && variant.prices.length > 0) {
			const storeData = store.get();
			const marketId = storeData.selectedMarket?.id || 'us';
			return arky.utils.getMarketPrice(variant.prices, marketId);
		}
		return '';
	}

	onMount(() => {
		loadProducts();
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
			<p class="text-lg font-medium">Failed to load products</p>
			<p class="text-sm mt-1">{error}</p>
		</div>
		<button 
			on:click={loadProducts}
			class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
		>
			Try again
		</button>
	</div>
{:else}
	<div class="mt-20 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
		{#if products.length === 0}
			<p class="col-span-full text-muted text-center py-12">No products found.</p>
		{:else}
			{#each products as product}
				{@const defaultVariant = getDefaultVariant(product)}
			    {@const thumbPath = getGalleryThumbnail(product.blocks)}
			    {@const thumbUrl = thumbPath || null}
			    {@const productSlug = product.seo?.slug?.[locale] || product.seo?.slug?.en || product.id}



				<a
					href="/products/{productSlug}"
					class="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
				>
					{#if thumbUrl}
						<img
							src={thumbUrl}
							alt={product.name}
							
							class="w-full h-48 object-cover"
						/>
					{:else}
						<div class="w-full h-48 bg-muted flex items-center justify-center">
							<p class="text-muted text-sm">No image</p>
						</div>
					{/if}

					<div class="p-6">
						<h3 class="text-lg font-semibold text-primary mb-2">
							{product.name}
						</h3>
						{#if product.description}
							<p class="text-muted text-sm mb-3">
								{product.description}
							</p>
						{/if}

						{#if defaultVariant}
							<div class="flex items-center justify-between mb-2">
								<p class="text-primary-600 font-medium">
									{displayVariantPrice(defaultVariant)}
								</p>
								
								<!-- Stock Status -->
								{#if defaultVariant.stock > 0}
									<span class="text-sm text-primary-600 bg-primary-100 px-2 py-1 rounded">
										In Stock
									</span>
								{:else}
									<span class="text-sm text-error bg-error-100 px-2 py-1 rounded">
										Out of Stock
									</span>
								{/if}
							</div>
						{/if}

						<!-- Product Type -->
						<div class="flex items-center justify-between">
							<span class="text-xs text-muted bg-muted px-2 py-1 rounded">
								{product.productType}
							</span>
						</div>
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