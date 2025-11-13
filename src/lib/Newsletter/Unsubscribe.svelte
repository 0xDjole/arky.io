<script lang="ts">
	import { onMount } from 'svelte';
	import { arky } from '@lib/index';
	import appConfig from '../../appConfig';

	let status: 'idle' | 'loading' | 'success' | 'error' = $state('loading');
	let message = $state<string>('Processing your request...');

	onMount(async () => {
		try {
			const url = new URL(window.location.href);
			const token = url.searchParams.get('token') || url.searchParams.get('unsubscribeToken');

			if (!token) {
				status = 'error';
				message = 'Invalid or missing token.';
				return;
			}

			status = 'loading';
			message = 'Updating your subscription...';

			await arky.user.subscribe({
				identifier: token,
			});

			status = 'success';
			message = 'You have been unsubscribed. We\'re sorry to see you go.';
		} catch (err) {
			console.error('Unsubscribe error:', err);
			status = 'error';
			message = err instanceof Error ? err.message : 'Failed to update subscription.';
		}
	});
</script>

<div class="site-container py-16">
	<div class="mx-auto max-w-md text-center space-y-6">
		<h1 class="text-2xl font-bold">Newsletter Preferences</h1>
		{#if status === 'loading'}
			<div class="flex items-center justify-center gap-3 text-muted-foreground">
				<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
				<span>{message}</span>
			</div>
		{:else if status === 'success'}
			<div class="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
				<p>{message}</p>
			</div>
			<a href="/newsletters" class="inline-block mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Back to newsletters</a>
		{:else}
			<div class="bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-4">
				<p>{message}</p>
			</div>
			<a href="/newsletters" class="inline-block mt-4 px-4 py-2 rounded-md bg-muted text-foreground hover:bg-muted/80">Back to newsletters</a>
		{/if}
	</div>
</div>
