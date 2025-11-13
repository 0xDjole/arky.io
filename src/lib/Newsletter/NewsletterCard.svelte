<script lang="ts">
	import { arky } from '@lib/index';
	
	interface StatusEvent {
		status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'SUSPENDED';
		created_at: number;
	}

	interface Newsletter {
		id: string;
		businessId: string;
		name: string;
		description: string;
		newsletterType: 'FREE' | 'PAID';
		statuses: StatusEvent[];
		plans: Array<{ id: string; name: string; amount: number; currency: string; interval: string }>;
		created_at: number;
		updated_at: number;
	}

	interface Props {
		newsletter: Newsletter;
	}

	let { newsletter }: Props = $props();

	let subscribing = $state(false);
	let error = $state<string | null>(null);
	let email = $state('');

	// Helper to get price (plans are not market-specific anymore)
	const getPrice = () => {
		return newsletter.plans?.[0]?.amount || 0;
	};

	const formatPlanPrice = (plan: any) => {
		if (!plan) return '';
		const amountMajor = plan.amount / 100;
		const symbol = plan.currency === 'usd' ? '$' : plan.currency;
		return `${symbol}${amountMajor}`;
	};

	const handleSubscribe = async () => {
		if (!email || !email.includes('@')) {
			error = 'Please enter a valid email address';
			return;
		}

		subscribing = true;
		error = null;

		if (newsletter.newsletterType === 'FREE') {
			try {
				const { arky } = await import('@lib/index');
				await arky.cms.subscribeToCollection({
					id: newsletter.id,
					email: email,
					planId: newsletter.plans[0].id,
				});

				alert('Successfully subscribed to the newsletter!');
				email = ''; // Clear the email field
			} catch (err) {
				console.error('Subscription error:', err);
				error = err instanceof Error ? err.message : 'Failed to subscribe';
			} finally {
				subscribing = false;
			}
			return;
		}

		// Handle paid newsletter subscription with Stripe
		const price = getPrice();
		if (!price || price <= 0) {
			error = 'This newsletter is not properly configured for subscriptions';
			return;
		}

		try {
			// Subscribe to paid newsletter - backend returns checkout URL
			const { arky } = await import('@lib/index');
			const response = await arky.cms.subscribeToCollection({
				id: newsletter.id,
				email: email,
				planId: newsletter.plans[0].id,
			});

			// Backend returns {subscriptionId, status, checkoutUrl}
			const { checkoutUrl } = response;

			if (!checkoutUrl) {
				throw new Error('No checkout URL received from server');
			}

			// Redirect directly to Stripe checkout URL
			window.location.href = checkoutUrl;
		} catch (err) {
			console.error('Subscription error:', err);
			error = err instanceof Error ? err.message : 'Failed to start subscription';
		} finally {
			subscribing = false;
		}
	};
</script>

<div class="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
	<div class="space-y-4">
		<!-- Newsletter Header -->
		<div>
			<h3 class="text-xl font-semibold mb-2">{newsletter.name}</h3>
			<p class="text-muted-foreground text-sm">
				{newsletter.description}
			</p>
		</div>

		<!-- Newsletter Type & Price -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {newsletter.newsletterType === 'FREE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}">
					{newsletter.newsletterType}
				</span>
				{#if newsletter.newsletterType === 'PAID' && newsletter.plans?.[0]}
					<span class="text-sm font-medium">
						{formatPlanPrice(newsletter.plans[0])}/{newsletter.plans[0].interval}
					</span>
				{/if}
			</div>

			<div class="text-xs text-muted-foreground">
				Status: <span class="capitalize">{newsletter.statuses?.[0]?.status.toLowerCase() || 'inactive'}</span>
			</div>
		</div>

		<!-- Subscription Button -->
		{#if newsletter.statuses?.[0]?.status === 'ACTIVE'}
			<div class="space-y-2">
				<input
					type="email"
					bind:value={email}
					placeholder="Enter your email"
					class="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
					required
				/>
				
				<button
					onclick={handleSubscribe}
					disabled={subscribing || !email}
					class="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md font-medium transition-colors"
				>
					{#if subscribing}
						<span class="flex items-center justify-center gap-2">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
							Subscribing...
						</span>
					{:else}
						Subscribe
						{#if newsletter.newsletterType === 'PAID' && newsletter.plans?.[0]}
							for {formatPlanPrice(newsletter.plans[0])}/{newsletter.plans[0].interval}
						{/if}
					{/if}
				</button>

				{#if error}
					<p class="text-destructive text-sm text-center">{error}</p>
				{/if}
			</div>
		{:else}
			<div class="text-center">
				<p class="text-muted-foreground text-sm">
					This newsletter is currently {newsletter.statuses?.[0]?.status.toLowerCase() || 'inactive'}
				</p>
			</div>
		{/if}
	</div>
</div>
