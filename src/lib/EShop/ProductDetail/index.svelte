<script>
	import { onMount } from 'svelte';
	import { showToast } from '@lib/toast.js';
	import { actions, store } from '@lib/core/stores/eshop';
	import QuantitySelector from '../QuantitySelector/index.svelte';
	import AttributeBlocks from '../AttributeBlocks/index.svelte';
	import Icon from '@iconify/svelte';
	import appConfig from '../../../appConfig';
	import { arky } from '@lib/index';

	const STORAGE_URL = appConfig.storageUrl;

	export let product;

	let loading = false;
	let error = null;
	let selectedVariant = null;
	let quantity = 1;
	let selectedImageIndex = 0;
	let addingToCart = false;

	async function addToCart() {
		if (!product || !selectedVariant) return;
		
		try {
			addingToCart = true;
			
			// Use frontend cart store instead of backend API
			actions.addItem(product, selectedVariant, quantity);
			
			// Reset quantity after adding to cart
			quantity = 1;
		} catch (err) {
			showToast(`Error: ${err.message}`, 'error', 5000);
			console.error('Error adding to cart:', err);
		} finally {
			addingToCart = false;
		}
	}

	function getDefaultVariant(product) {
		return product.variants?.find(v => v.isDefault) || product.variants?.[0];
	}

	function formatPrice(prices) {
		if (!prices || !Array.isArray(prices)) return '';
		const storeData = store.get();
		const marketId = storeData.selectedMarket?.id || 'us';
		return arky.utils.getMarketPrice(prices, marketId);
	}

	function extractGalleryFromBlocks(blocks) {
		if (!blocks || !Array.isArray(blocks)) return [];

		const galleryBlock = blocks.find((block) => block.key === 'gallery');
		if (!galleryBlock?.value?.length) return [];

		return galleryBlock.value
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
	}

	function getGalleryThumbnail(blocks) {
		const gallery = extractGalleryFromBlocks(blocks);
		if (!gallery.length) return null;

		const item = gallery.find((g) => g.isThumbnail) || gallery[0];
		const res = item.media?.resolutions?.thumbnail || item.media?.resolutions?.original;
		return res?.url || null;
	}

	function getProductImages(product) {
		const gallery = extractGalleryFromBlocks(product.blocks);
		if (gallery.length === 0) {
			return [];
		}

		return gallery.map(item => {
			if (item?.media?.resolutions) {
				const original = item.media.resolutions.original?.url;
				const thumbnail = item.media.resolutions.thumbnail?.url;

				if (!original) return null;

				return {
					url: `${STORAGE_URL}/${original}`,
					thumbnail: `${STORAGE_URL}/${thumbnail || original}`,
					alt: product.name
				};
			}
			return null;
		}).filter(Boolean);
	}



	function selectVariant(variant) {
		selectedVariant = variant;
	}

	function goBack() {
		window.history.back();
	}

	onMount(() => {
		if (product) {
			selectedVariant = getDefaultVariant(product);
		}
	});

	$: images = product ? getProductImages(product) : [];
	$: selectedImage = images[selectedImageIndex];
	$: isInStock = selectedVariant?.stock > 0;
</script>

<div class="min-h-screen bg-background py-8">
	<div class="max-w-7xl mx-auto px-6">
		{#if loading}
			<div class="flex justify-center items-center py-20">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
			</div>
		{:else if error}
			<div class="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center max-w-md mx-auto">
				<div class="text-destructive text-lg mb-2">Error</div>
				<div class="text-destructive/80 mb-4">{error}</div>
				<button 
					class="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
					on:click={goBack}
				>
					Go Back
				</button>
			</div>
		{:else if product}
			<!-- Breadcrumb -->
			<nav class="mb-6">
				<button 
					class="text-primary hover:text-primary/80 transition-colors"
					on:click={goBack}
				>
					← Back to Products
				</button>
			</nav>

			<div class="bg-card rounded-lg shadow-sm border overflow-hidden">
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
					<!-- Product Images -->
					<div class="space-y-4">
						{#if selectedImage}
							<div class="aspect-square bg-muted rounded-lg overflow-hidden">
								<img 
									src={selectedImage.url} 
									alt={selectedImage.alt}
									class="w-full h-full object-cover"
								/>
							</div>
							
							{#if images.length > 1}
								<div class="grid grid-cols-4 gap-2">
									{#each images as image, index}
										<button 
											class="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors {selectedImageIndex === index ? 'border-blue-500' : 'border-transparent'}"
											on:click={() => selectedImageIndex = index}
										>
											<img 
												src={image.thumbnail} 
												alt={image.alt}
												class="w-full h-full object-cover"
											/>
										</button>
									{/each}
								</div>
							{/if}
						{:else}
							<div class="aspect-square bg-muted rounded-lg flex items-center justify-center">
								<Icon icon="mdi:image" class="w-24 h-24 text-muted-foreground" />
							</div>
						{/if}
					</div>

					<!-- Product Details -->
					<div class="space-y-6">
						<div>
							<h1 class="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
							<div class="flex items-center gap-2 mb-4">
								<span class="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
									{product.productType}
								</span>
								<span class="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
									SKU: {selectedVariant?.sku || 'N/A'}
								</span>
							</div>
							
							{#if product.description}
								<p class="text-muted-foreground leading-relaxed">{product.description}</p>
							{/if}
						</div>

						<!-- Variants -->
						{#if product.variants && product.variants.length > 1}
							<div>
								<h3 class="text-lg font-semibold mb-3">Options</h3>
								<div class="grid grid-cols-1 gap-2">
									{#each product.variants as variant}
										<button 
											class="p-3 border rounded-lg text-left transition-all {selectedVariant?.id === variant.id ? 'border-primary bg-success text-success-foreground' : 'border-transparent bg-muted hover:bg-accent'}"
											on:click={() => selectVariant(variant)}
											disabled={variant.stock === 0}
										>
											<div class="flex justify-between items-center">
												<div>
													<div class="font-medium">{formatPrice(variant.prices)}</div>
													{#if variant.attributes && variant.attributes.length > 0}
														<div class="text-sm text-muted-foreground">
															<AttributeBlocks 
																blocks={variant.attributes} 
																variant="inline" 
															/>
														</div>
													{/if}
												</div>
												<div class="text-sm {variant.stock > 0 ? 'text-green-600' : 'text-red-600'}">
													{variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
												</div>
											</div>
										</button>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Price and Stock -->
						{#if selectedVariant}
							<div class="border-t pt-6">
								<div class="flex items-center justify-between mb-4">
									<div class="text-2xl font-bold bg-accent text-accent-foreground px-4 py-2 rounded-lg inline-block">
										{formatPrice(selectedVariant.prices)}
									</div>
									<div class="text-sm {isInStock ? 'text-green-600' : 'text-red-600'}">
										{isInStock ? `${selectedVariant.stock} in stock` : 'Out of stock'}
									</div>
								</div>

								<!-- Quantity and Add to Cart -->
								{#if isInStock}
									<div class="flex gap-4">
										<QuantitySelector 
											bind:quantity={quantity}
											min={1}
											max={selectedVariant.stock}
											on:change={(e) => quantity = e.detail}
										/>

										<button 
											class="flex-1 bg-accent text-accent-foreground px-6 py-3 rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
											on:click={addToCart}
											disabled={addingToCart || !isInStock}
										>
											{#if addingToCart}
												<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
													<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												Adding...
											{:else}
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5"></path>
												</svg>
												Add to Cart
											{/if}
										</button>
									</div>
								{:else}
									<button 
										class="w-full bg-muted text-muted-foreground px-6 py-3 rounded-lg cursor-not-allowed"
										disabled
									>
										Out of Stock
									</button>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>