<script lang="ts">
	import { arky } from '@lib/index';

	interface StatusEvent {
		status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'SUSPENDED';
		createdAt: number;
	}

	interface SubscriptionPlan {
		id: string;
		name: string;
		price?: number;
		marketId?: string;
	}

	interface Newsletter {
		id: string;
		businessId: string;
		name: string;
		description: string;
		plans: SubscriptionPlan[];
		statuses: StatusEvent[];
		createdAt: number;
		updatedAt: number;
	}

	interface Props {
		newsletter: Newsletter;
	}

	let { newsletter }: Props = $props();

	let subscribing = $state(false);
	let error = $state<string | null>(null);
	let email = $state('');

	// Determine if newsletter is free or paid based on plans
	const isPaid = $derived(newsletter.plans?.some(p => p.price && p.price > 0) || false);
	const newsletterType = $derived(isPaid ? 'PAID' : 'FREE');

	// Get price from first plan with a price
	const getPrice = () => {
		return newsletter.plans?.find(p => p.price && p.price > 0)?.price || 0;
	};

	const formatPlanPrice = (plan: SubscriptionPlan | undefined) => {
		if (!plan?.price) return '';
		const amountMajor = plan.price / 100;
		return `$${amountMajor}`;
	};

	const handleSubscribe = async () => {
		if (!email || !email.includes('@')) {
			error = 'Please enter a valid email address';
			return;
		}

		subscribing = true;
		error = null;

		if (!isPaid) {
			// Free newsletter subscription
			try {
				await arky.user.subscribe({
					identifier: email,
					target: `newsletter:${newsletter.id}`,
					planId: newsletter.plans[0]?.id,
					successUrl: window.location.origin + '/newsletters?subscribed=true',
					cancelUrl: window.location.origin + '/newsletters',
				});

				alert('Successfully subscribed to the newsletter!');
				email = '';
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
			subscribing = false;
			return;
		}

		try {
			const paidPlan = newsletter.plans?.find(p => p.price && p.price > 0);
			const response = await arky.user.subscribe({
				identifier: email,
				target: `newsletter:${newsletter.id}`,
				planId: paidPlan?.id,
				successUrl: window.location.origin + '/newsletters?subscribed=true',
				cancelUrl: window.location.origin + '/newsletters',
			});

			const { checkoutUrl } = response;

			if (!checkoutUrl) {
				throw new Error('No checkout URL received from server');
			}

			window.location.href = checkoutUrl;
		} catch (err) {
			console.error('Subscription error:', err);
			error = err instanceof Error ? err.message : 'Failed to start subscription';
		} finally {
			subscribing = false;
		}
	};

	const currentStatus = $derived(newsletter.statuses?.[0]?.status || 'INACTIVE');
	const paidPlan = $derived(newsletter.plans?.find(p => p.price && p.price > 0));
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
				<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {newsletterType === 'FREE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}">
					{newsletterType}
				</span>
				{#if isPaid && paidPlan}
					<span class="text-sm font-medium">
						{formatPlanPrice(paidPlan)}/month
					</span>
				{/if}
			</div>

			<div class="text-xs text-muted-foreground">
				Status: <span class="capitalize">{currentStatus.toLowerCase()}</span>
			</div>
		</div>

		<!-- Subscription Button -->
		{#if currentStatus === 'ACTIVE'}
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
						{#if isPaid && paidPlan}
							for {formatPlanPrice(paidPlan)}/month
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
					This newsletter is currently {currentStatus.toLowerCase()}
				</p>
			</div>
		{/if}
	</div>
</div>
