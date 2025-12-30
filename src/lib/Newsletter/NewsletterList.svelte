<script lang="ts">
	import { onMount } from "svelte";
	import NewsletterCard from "./NewsletterCard.svelte";
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
		plans: Array<{ id: string; name: string; price?: number; marketId?: string }>;
		statuses: StatusEvent[];
		createdAt: number;
		updatedAt: number;
	}

	let newsletters: Newsletter[] = $state([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const response = await arky.newsletter.getNewsletters();
			newsletters = response.items || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load newsletters';
		} finally {
			loading = false;
		}
	});
</script>

<div class="space-y-8">
	{#if loading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else if error}
		<div class="text-center py-12">
			<div class="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
				<p class="text-destructive font-medium">Error loading newsletters</p>
				<p class="text-destructive/80 text-sm mt-2">{error}</p>
			</div>
		</div>
	{:else if newsletters.length === 0}
		<div class="text-center py-12">
			<div class="bg-muted/50 rounded-lg p-8 max-w-md mx-auto">
				<p class="text-muted-foreground">No newsletters available at the moment.</p>
				<p class="text-muted-foreground text-sm mt-2">Check back later for updates!</p>
			</div>
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each newsletters as newsletter}
				<NewsletterCard {newsletter} />
			{/each}
		</div>
	{/if}
</div>
