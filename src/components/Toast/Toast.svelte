<script>
	import { toastStore, removeToast } from '../../lib/toast.js';
	import Icon from '@iconify/svelte';
	import { fly } from 'svelte/transition';

	$: toasts = $toastStore.toasts;

	function getIcon(type) {
		switch (type) {
			case 'success': return 'mdi:check-circle';
			case 'error': return 'mdi:alert-circle';
			case 'warning': return 'mdi:alert';
			case 'info': return 'mdi:information';
			default: return 'mdi:check-circle';
		}
	}

	function getColors(type) {
		switch (type) {
			case 'success': return 'bg-green-500 text-white';
			case 'error': return 'bg-red-500 text-white';
			case 'warning': return 'bg-yellow-500 text-white';
			case 'info': return 'bg-blue-500 text-white';
			default: return 'bg-green-500 text-white';
		}
	}
</script>

<div class="fixed top-4 right-4 z-[100] space-y-2">
	{#each toasts as toast (toast.id)}
		<div
			class="flex items-center gap-3 p-4 rounded-lg shadow-lg max-w-sm {getColors(toast.type)}"
			transition:fly={{ x: 300, duration: 300 }}
		>
			<Icon icon={getIcon(toast.type)} class="h-5 w-5 flex-shrink-0" />
			<p class="text-sm font-medium flex-1">{toast.message}</p>
			<button
				on:click={() => removeToast(toast.id)}
				class="text-white/80 hover:text-white transition-colors"
			>
				<Icon icon="mdi:close" class="h-4 w-4" />
			</button>
		</div>
	{/each}
</div>