<script lang="ts">
	import Icon from '@iconify/svelte';
	import { arky } from '@lib/index';
	import type { Quote } from '@lib/core/types';

	interface Props {
		quote: Quote | null;
		fetchingQuote: boolean;
		quoteError: string | null;
		currency: string;
		itemCount: number;
		itemLabel?: string; // 'item' for eshop, 'service' for reservations
		title?: string; // 'Order Summary' or 'Reservation Summary'
		showShipping?: boolean; // Show shipping section (only for eshop)
	}

	let {
		quote,
		fetchingQuote,
		quoteError,
		currency,
		itemCount,
		itemLabel = 'item',
		title = 'Summary',
		showShipping = false
	}: Props = $props();

	const pluralLabel = itemLabel === 'item' ? 'items' : `${itemLabel}s`;
</script>

<div class="bg-muted/30 border border-border rounded-lg p-6">
	<h4 class="text-lg font-semibold text-primary mb-4">{title}</h4>

	{#if fetchingQuote}
		<!-- Loading State -->
		<div class="flex items-center justify-center py-4">
			<Icon icon="mdi:loading" class="w-6 h-6 animate-spin text-muted-foreground mr-2" />
			<span class="text-sm text-muted-foreground">Calculating total...</span>
		</div>
	{:else if quoteError}
		<!-- Error State -->
		<div class="text-sm text-destructive p-4 bg-destructive/10 rounded">
			{quoteError}
		</div>
	{:else if quote}
		<!-- Full Price Breakdown from Quote -->
		<div class="space-y-3">
			<div class="flex justify-between text-sm text-card-foreground">
				<span>Subtotal ({itemCount} {itemCount === 1 ? itemLabel : pluralLabel}):</span>
				<span class="font-medium">{arky.utils.formatMinor(quote.subtotal, currency)}</span>
			</div>

			{#if showShipping && quote.shippingMethod}
				<div class="flex justify-between text-sm text-card-foreground">
					<span>Shipping ({quote.shippingMethod.id?.toUpperCase?.() || quote.shippingMethod.id}):</span>
					<span class="font-medium">
						{#if quote.shipping === 0}
							<span class="text-green-600 font-semibold">FREE</span>
						{:else}
							{arky.utils.formatMinor(quote.shipping, currency)}
						{/if}
					</span>
				</div>
			{/if}

			{#if quote.discount > 0}
				<div class="flex justify-between text-sm text-green-600 font-semibold">
					<span class="flex items-center gap-1">
						<Icon icon="mdi:check-circle" class="w-4 h-4" />
						Discount:
					</span>
					<span>-{arky.utils.formatMinor(quote.discount, currency)}</span>
				</div>
			{/if}

			<div class="flex justify-between text-sm text-card-foreground">
				<span>Tax:</span>
				<span class="font-medium">{arky.utils.formatMinor(quote.payment.tax?.amount ?? 0, currency)}</span>
			</div>

			<div class="border-t border-border pt-3 mt-2"></div>

			<div class="flex justify-between items-center">
				<span class="text-xl font-bold text-card-foreground">Total:</span>
				<span class="text-2xl font-bold text-primary">
					{arky.utils.formatMinor(quote.total, currency)}
				</span>
			</div>
		</div>
	{:else}
		<!-- Fallback: No Quote Available -->
		<div class="space-y-3">
			<div class="flex justify-between text-sm text-card-foreground">
				<span>{itemLabel === 'item' ? 'Items' : 'Services'}:</span>
				<span class="font-medium">{itemCount} {itemCount === 1 ? itemLabel : pluralLabel}</span>
			</div>
			{#if showShipping}
				<div class="flex justify-between text-sm text-muted-foreground">
					<span>Shipping:</span>
					<span class="italic">Calculated at checkout</span>
				</div>
			{/if}
			<div class="flex justify-between text-sm text-muted-foreground">
				<span>Tax:</span>
				<span class="italic">Calculated at checkout</span>
			</div>

			<div class="border-t border-border pt-3 mt-2"></div>

			<div class="flex justify-between items-center">
				<span class="text-lg font-semibold text-card-foreground">Estimated Total:</span>
				<span class="text-xl font-bold text-primary">—</span>
			</div>
		</div>
	{/if}
</div>
