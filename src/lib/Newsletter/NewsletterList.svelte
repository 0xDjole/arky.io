<script lang="ts">
	import { onMount } from "svelte";
	import NewsletterCard from "./NewsletterCard.svelte";
	import appConfig from '../../appConfig';
	
	interface StatusEvent {
		status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'SUSPENDED';
		created_at: number;
	}

	interface Newsletter {
		id: string;
		business_id: string;
		name: string;
		description: string;
		newsletter_type: 'Free' | 'Paid';
		statuses: StatusEvent[];
		price?: number;
		currency?: string;
		created_at: number;
		updated_at: number;
	}

	let newsletters: Newsletter[] = $state([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let businessId = $state<string>('');

	async function fetchNewsletters(businessId: string) {
		const backendUrl = import.meta.env.PUBLIC_SERVER_URL || 'http://localhost:8000';
		const url = `${backendUrl}/v1/businesses/${businessId}/collections`;

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const backendResponse = await response.json();
		const collections = backendResponse.items || [];
		const newsletters = collections.filter((c: any) =>
			c.type === 'NEWSLETTER' || (c.plans?.length > 0 || c.unsubscribeRedirectUrl)
		);

		return {
			data: newsletters,
			meta: {
				total: newsletters.length,
				page: 1,
				per_page: newsletters.length,
			}
		};
	}

	onMount(async () => {
		try {
			// Get business ID from URL or environment
			const urlParams = new URLSearchParams(window.location.search);
			businessId = urlParams.get('business_id') || appConfig.businessId || '0bbf0256-2fe9-4517-81ff-ebf8ebb2f373';
			
			if (!businessId) {
				throw new Error('Business ID not found. Please configure businessId in config.');
			}

			const response = await fetchNewsletters(businessId);
			
			newsletters = response.data || [];
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