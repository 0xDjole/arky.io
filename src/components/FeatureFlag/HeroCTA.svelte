<script lang="ts">
	import { onMount } from 'svelte';
	import { arky } from '@lib/arky';

	let variantKey = $state('control');
	let values = $state<Record<string, any>>({});
	let isLoading = $state(true);

	// Derived values from payload
	let ctaText = $derived(values.text || 'Get Started');
	let ctaStyle = $derived(values.style || 'gradient');
	let showBadge = $derived(Boolean(values.showBadge));

	onMount(async () => {
		try {
			const response = await arky.featureFlags.getVariant({ flagKey: 'hero-cta-test' });
			variantKey = response.variantKey;
			if (response.payload && Array.isArray(response.payload)) {
				values = arky.extractBlockValues(response.payload);
			}
		} catch (error) {
			console.error('Failed to get variant:', error);
		} finally {
			isLoading = false;
		}
	});

	const handleClick = () => {
		// Track signup event when user clicks
		arky.featureFlags.trackEvent({ eventName: 'signup' }).catch(console.error);
		// Navigate to contact form
		document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
	};
</script>

<div class="hero-cta" class:opacity-0={isLoading}>
	<button
		class="cta-button"
		class:cta-solid={ctaStyle === 'solid'}
		onclick={handleClick}
	>
		{#if showBadge}
			<span class="cta-badge">Free</span>
		{/if}
		<span class="cta-text">{ctaText}</span>
		<div class="cta-arrow">
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="5" y1="12" x2="19" y2="12"></line>
				<polyline points="12 5 19 12 12 19"></polyline>
			</svg>
		</div>
	</button>
</div>

<style>
	.hero-cta {
		margin-bottom: 2rem;
		transform: translateY(50px);
		transition: opacity 0.3s ease;
	}

	.opacity-0 {
		opacity: 0;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #8b5cf6, #3b82f6);
		border: none;
		border-radius: 50px;
		color: white;
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		transform: scale(1);
		position: relative;
	}

	.cta-button.cta-solid {
		background: #8b5cf6;
		box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
	}

	.cta-button:hover {
		transform: scale(1.05);
		box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3);
	}

	.cta-arrow {
		transition: transform 0.3s ease;
	}

	.cta-button:hover .cta-arrow {
		transform: translateX(5px);
	}

	.cta-badge {
		position: absolute;
		top: -8px;
		right: -8px;
		background: #10b981;
		color: white;
		font-size: 0.75rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 10px;
		text-transform: uppercase;
	}
</style>
