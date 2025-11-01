<script>
	import { getImageUrl } from "@lib/index";
	let { blocks = [], label = '', locale = 'en', isNested = false } = $props();
	
	// Get localized content
	function getLocalizedContent(content) {
		if (!content) return '';
		if (content[locale]) return content[locale];
		if (content.en) return content.en;
		return content;
	}

	// Helper function to get badge display text
	function getBadgeText(block, locale) {
		if (!block || !block.value) return '';
		
		const valueBlock = block.value.find(v => v.key === 'value');
		if (!valueBlock || !valueBlock.value) return '';
		
		return getLocalizedContent(valueBlock.value[0]);
	}

	function getBadgeImage(block) {
		if (!block || !block.value) return null;
		
		const mediaBlock = block.value.find(v => v.key === 'media');
		if (!mediaBlock || !mediaBlock.value || !mediaBlock.value[0]) return null;
		
		return getImageUrl(mediaBlock.value[0]);
	}

	// Convert style object to CSS string
	function getStyleString(block) {
		if (!block?.properties?.style) return '';
		
		// Convert camelCase to kebab-case and build CSS string
		return Object.entries(block.properties.style)
			.map(([key, value]) => {
				// Convert camelCase to kebab-case (e.g., fontSize -> font-size)
				const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
				return `${kebabKey}: ${value}`;
			})
			.join('; ');
	}
	
</script>

{#if !isNested}
	<div class="space-y-6">
		{#if label}
			<h3 class="text-xl font-bold tracking-wide">{label}</h3>
		{/if}
		<div class="space-y-6">
			{#each blocks as block (block.id)}
				<div class="my-4">
					<svelte:self blocks={[block]} isNested={true} {locale} />
				</div>
			{/each}
		</div>
	</div>
{:else}
	{#each blocks as block (block.id)}
		{#if block.type === 'TEXT' && block.properties?.variant === 'P'}
			<p class="my-2" style={getStyleString(block)}>
				{getLocalizedContent(block.value?.[0])}
			</p>
		{:else if block.type === 'TEXT' && block.properties?.variant === 'H1'}
			<h1 class="text-3xl font-bold my-4" style={getStyleString(block)}>
				{getLocalizedContent(block.value?.[0])}
			</h1>
		{:else if block.type === 'TEXT' && block.properties?.variant === 'H2'}
			<h2 class="text-2xl font-semibold my-3" style={getStyleString(block)}>
				{getLocalizedContent(block.value?.[0])}
			</h2>
		{:else if block.type === 'TEXT' && block.properties?.variant === 'H3'}
			<h3 class="text-xl font-medium my-2" style={getStyleString(block)}>
				{getLocalizedContent(block.value?.[0])}
			</h3>
		{:else if block.type === 'TEXT' && block.properties?.variant === 'URL'}
			{@const linkText = getLocalizedContent(block.value?.[0]) || block.properties?.url || 'Link'}
			{@const url = block.properties?.url}
			{#if url}
				<div style={getStyleString(block)}>
					<a href={url} target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 underline break-all">
						{linkText}
					</a>
				</div>
			{:else}
				<div style={getStyleString(block)} class="text-gray-500 italic">
					[URL: {linkText}]
				</div>
			{/if}
		{:else if block.type === 'TEXT'}
			{@const content = getLocalizedContent(block.value?.[0])}
			{@const url = block.properties?.url}
			{#if url}
				<a href={url} target="_blank" rel="noopener noreferrer" style={getStyleString(block)}>
					{content}
				</a>
			{:else}
				<p style={getStyleString(block)}>{content}</p>
			{/if}
		{:else if block.type === 'RELATIONSHIP' && block.value?.[0]?.mimeType}
			{@const mediaValue = block.value[0]}
			{@const imageUrl = getImageUrl(mediaValue, false)}
			{@const url = block.properties?.url}
			{@const altText = mediaValue?.alt || block.properties?.label?.en || block.properties?.label?.[Object.keys(block.properties?.label || {})[0]] || 'Image'}
			{#if imageUrl}
				<div style={getStyleString(block)}>
					{#if url}
						<a href={url} target="_blank" rel="noopener noreferrer">
							<img
								src={imageUrl}
								alt={altText}
								referrerpolicy="no-referrer"
							/>
						</a>
					{:else}
						<img
							src={imageUrl}
							alt={altText}
							referrerpolicy="no-referrer"
						/>
					{/if}
				</div>
			{/if}
		{:else if block.type === 'BLOCK' && block.properties?.variant === 'badge'}
			{@const badgeText = getBadgeText(block, locale)}
			{@const badgeImage = getBadgeImage(block)}
			
			<div class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-primary-900/30 border border-primary-700 text-primary-300 my-2" style={getStyleString(block)}>
				<!-- Badge Image -->
				{#if badgeImage}
					<div class="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden bg-base-700">
						<img 
							src={badgeImage} 
							alt={badgeText}
							class="w-full h-full object-cover"
							referrerpolicy="no-referrer"
						/>
					</div>
				{:else}
					<div class="flex-shrink-0 w-6 h-6 rounded-full bg-base-700 flex items-center justify-center">
						<svg class="w-3 h-3 text-base-500" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
						</svg>
					</div>
				{/if}

				<!-- Badge Text -->
				<span class="text-sm font-medium">
					{badgeText}
				</span>
			</div>
		{:else if block.type === 'BLOCK' && block.properties?.variant === 'ul'}
			<ul class="list-disc pl-5 my-3 space-y-1" style={getStyleString(block)}>
				{#each block.value as item}
					<li>
						<svelte:self blocks={[item]} isNested={true} {locale} />
					</li>
				{/each}
			</ul>
		{:else if block.type === 'BLOCK' && block.properties?.variant === 'ol'}
			<ol class="list-decimal pl-5 my-3 space-y-1" style={getStyleString(block)}>
				{#each block.value as item}
					<li>
						<svelte:self blocks={[item]} isNested={true} {locale} />
					</li>
				{/each}
			</ol>
		{:else if block.type === 'BLOCK' && block.properties?.variant === 'li'}
			{#if block.value}
				<svelte:self blocks={block.value} isNested={true} {locale} />
			{/if}
		{:else if block.type === 'BLOCK'}
            <div style={getStyleString(block)}>
				{#each block.value as nestedBlock}
					<svelte:self blocks={[nestedBlock]} isNested={true} {locale} />
				{/each}
			</div>
		{/if}
	{/each}
{/if}
