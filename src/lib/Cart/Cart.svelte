<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import EshopCart from '../EShop/Cart/index.svelte';
	import ReservationCart from '../Reservation/Cart/index.svelte';
	import {
		totalCartItems,
		hasEshopItems,
		hasReservationItems,
		isCartEmpty,
		showEshopSection,
		showReservationSection,
		showBothSections
	} from '@lib/core/stores/cart';
	import { initEshopStore } from '@lib/core/stores/eshop';
	import { initReservationStore } from '@lib/core/stores/reservation';

	onMount(() => {
		initEshopStore();
		initReservationStore();
	});
</script>

<div class="bg-card mx-auto mt-20 max-w-4xl space-y-6 rounded-xl p-6 shadow-lg border">
	<h1 class="text-3xl font-bold text-card-foreground mb-6">Shopping Cart</h1>

	<!-- Show empty cart message only if both carts are empty -->
	{#if $isCartEmpty}
		<div class="bg-muted rounded-lg p-12 text-center">
			<div class="text-muted-foreground bg-card mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
				<Icon icon="mdi:cart-outline" class="h-12 w-12" />
			</div>
			<h2 class="text-xl font-semibold text-card-foreground mb-4">Your cart is empty</h2>
			<p class="text-muted-foreground mb-6">Start shopping or browse our services to add items to your cart.</p>
			<div class="flex gap-4 justify-center">
				<a href="/products" class="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary font-medium transition-colors">
					Browse Products
				</a>
				<a href="/services" class="border border-primary text-primary px-6 py-3 rounded-lg hover:bg-accent font-medium transition-colors">
					Browse Services
				</a>
			</div>
		</div>
	{:else}
		<!-- E-shop Cart Section -->
		{#if $showEshopSection}
			<div class="space-y-4">
				{#if $showBothSections}
					<h2 class="text-2xl font-semibold text-card-foreground flex items-center gap-2">
						<Icon icon="mdi:shopping" class="w-5 h-5 text-primary" />
						Products
					</h2>
				{/if}
				<EshopCart />
			</div>
		{/if}

		<!-- Reservations Section -->
		{#if $showReservationSection}
			<div class="border-t pt-6">
				{#if $showBothSections}
					<h2 class="text-2xl font-semibold text-card-foreground flex items-center gap-2 mb-4">
						<Icon icon="mdi:calendar" class="w-5 h-5 text-primary" />
						Reservations
					</h2>
				{/if}
				<ReservationCart />
			</div>
		{/if}
	{/if}
</div>