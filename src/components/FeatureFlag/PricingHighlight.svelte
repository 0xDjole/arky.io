<script lang="ts">
	import { onMount } from 'svelte';
	import { arky } from '@lib/arky';

	interface Props {
		plans: any[];
	}

	let { plans }: Props = $props();

	let featuredPlan = $state('pro');
	let badgeText = $state('Most Popular');
	let isLoading = $state(true);

	onMount(async () => {
		try {
			const response = await arky.featureFlags.getVariant({ flagKey: 'pricing-highlight-test' });
			if (response.payload && Array.isArray(response.payload)) {
				const values = arky.extractBlockValues(response.payload);
				featuredPlan = values.featuredPlan || 'pro';
				badgeText = values.badgeText || 'Most Popular';
			}
		} catch (error) {
			console.error('Failed to get pricing variant:', error);
		} finally {
			isLoading = false;
		}
	});

	const handlePlanSelect = (planName: string) => {
		// Track plan selection event
		arky.featureFlags.trackEvent({ eventName: 'plan_select' }).catch(console.error);
	};

	// Determine if a plan should be featured based on variant
	const isFeatured = (plan: any) => {
		const planKey = plan.name?.toLowerCase().replace(/\s+/g, '-') || '';
		return planKey.includes(featuredPlan);
	};
</script>

<div class="pricing-grid gsap-stagger mx-auto mt-12 grid w-full max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style="overflow: visible; perspective: 800px;">
	{#each plans as plan}
		{@const featured = isFeatured(plan)}
		<div
			class="pricing-plan hover-lift gsap-stagger-item relative mx-auto h-full w-full max-w-sm overflow-hidden rounded-2xl transition-all duration-300"
			class:bg-gradient-primary={featured}
			class:bg-tertiary={!featured}
		>
			<div class="relative h-full p-px">
				<div class="bg-card relative z-10 flex h-full flex-col overflow-hidden rounded-[calc(1rem-1px)]">
					{#if featured}
						<div
							class="glow-primary absolute top-0 left-0 -z-10 mx-auto aspect-square w-full max-w-7xl -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
							aria-hidden="true"
						></div>
					{/if}
					<div class="mx-auto flex h-full w-full max-w-[20rem] flex-col px-6 pb-6">
						<div class="flex w-full justify-between pt-6">
							<h3
								class="text-lg font-semibold"
								class:main-text-gradient={featured}
								class:text-primary={!featured}
							>
								{plan.name}
							</h3>
							{#if featured}
								<div class="flex w-full items-center justify-end">
									<div class="bg-brand text-brand flex gap-2 rounded-full px-3 py-1 text-sm font-medium">
										<p class="flex items-center">{badgeText}</p>
									</div>
								</div>
							{/if}
						</div>
						<div class="pt-3">
							<p class="text-secondary">{plan.description}</p>
							<p class="mt-3 font-semibold">
								{#if plan.custom}
									<span class="text-price text-5xl font-semibold">Custom</span>
								{:else}
									<div class="pricing-monthly">
										<span class="text-price text-5xl font-semibold">${plan.monthly}</span>
										<span class="text-secondary text-3xl">/mo</span>
										<br />
										<p class="text-muted mt-1 text-sm font-normal">(paid monthly)</p>
									</div>
									<div class="pricing-yearly hidden">
										<span class="text-price text-5xl font-semibold">${plan.yearly}</span>
										<span class="text-secondary text-3xl">/mo</span>
										<br />
										<p class="text-muted mt-1 text-sm font-normal">(paid yearly)</p>
									</div>
								{/if}
							</p>
						</div>
						<ul class="my-6 flex w-full flex-col gap-2">
							{#each plan.features || [] as feature}
								<li class="text-secondary flex items-center">
									<svg class="text-check mr-2 h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
										<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
									</svg>
									<span class="inline">{feature}</span>
								</li>
							{/each}
						</ul>
						<div class="mt-auto">
							<a
								href="#contact-form"
								class="inline-flex w-full items-center justify-center rounded-lg px-4 py-3 font-medium transition-colors"
								class:bg-primary={featured}
								class:text-white={featured}
								class:border={!featured}
								class:border-gray-300={!featured}
								class:text-gray-700={!featured}
								class:hover:bg-gray-50={!featured}
								onclick={() => handlePlanSelect(plan.name)}
							>
								Get Started
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.bg-gradient-primary {
		background: linear-gradient(135deg, #8b5cf6, #3b82f6);
	}

	.bg-tertiary {
		background: var(--bg-tertiary, #f3f4f6);
	}

	.bg-card {
		background: var(--bg-card, #ffffff);
	}

	.main-text-gradient {
		background: linear-gradient(135deg, #8b5cf6, #3b82f6);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.text-primary {
		color: var(--text-primary, #111827);
	}

	.text-secondary {
		color: var(--text-secondary, #6b7280);
	}

	.text-price {
		color: var(--text-price, #111827);
	}

	.text-muted {
		color: var(--text-muted, #9ca3af);
	}

	.text-check {
		color: var(--text-check, #10b981);
	}

	.bg-brand {
		background: rgba(139, 92, 246, 0.1);
	}

	.text-brand {
		color: #8b5cf6;
	}

	.glow-primary {
		background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
	}

	.bg-primary {
		background: linear-gradient(135deg, #8b5cf6, #3b82f6);
	}

	.hover-lift {
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.hover-lift:hover {
		transform: translateY(-8px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
	}
</style>
