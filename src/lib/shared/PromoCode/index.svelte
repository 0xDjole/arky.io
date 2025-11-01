<script lang="ts">
	import Icon from '@iconify/svelte';

	interface Props {
		appliedPromoCode: string | null;
		onApply: (code: string) => void;
		onRemove: () => void;
		disabled?: boolean;
	}

	let { appliedPromoCode, onApply, onRemove, disabled = false }: Props = $props();

	let promoCodeInput = $state('');

	function handleApply() {
		const code = promoCodeInput.trim();
		if (!code) return;
		onApply(code);
		promoCodeInput = '';
	}
</script>

<div>
	<h4 class="text-lg font-semibold mb-3 text-card-foreground">Promo Code</h4>
	{#if appliedPromoCode}
		<div class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
			<div class="flex items-center gap-2">
				<Icon icon="mdi:tag" class="w-5 h-5 text-green-600" />
				<span class="text-sm font-medium text-green-800">
					{appliedPromoCode}
				</span>
			</div>
			<button
				onclick={onRemove}
				disabled={disabled}
				class="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
				aria-label="Remove promo code"
			>
				<Icon icon="mdi:close" class="w-5 h-5" />
			</button>
		</div>
	{:else}
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={promoCodeInput}
				placeholder="Enter promo code"
				disabled={disabled}
				class="flex-1 p-3 bg-card border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-card-foreground placeholder-muted-foreground text-sm disabled:opacity-50"
				onkeydown={(e) => e.key === 'Enter' && handleApply()}
			/>
			<button
				onclick={handleApply}
				disabled={!promoCodeInput.trim() || disabled}
				class="px-6 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				Apply
			</button>
		</div>
	{/if}
</div>
