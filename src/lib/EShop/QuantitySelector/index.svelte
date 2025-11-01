<script>
	import { createEventDispatcher } from 'svelte';
	import Icon from '@iconify/svelte';
	
	export let quantity = 1;
	export let min = 1;
	export let max = 100;
	export let disabled = false;
	
	const dispatch = createEventDispatcher();
	
	function increment() {
		if (quantity < max && !disabled) {
			quantity = Math.min(max, quantity + 1);
			dispatch('change', quantity);
		}
	}
	
	function decrement() {
		if (quantity > min && !disabled) {
			quantity = Math.max(min, quantity - 1);
			dispatch('change', quantity);
		}
	}
	
	function handleInput(event) {
		const value = parseInt(event.target.value) || min;
		quantity = Math.max(min, Math.min(max, value));
		dispatch('change', quantity);
	}
	
	$: canDecrement = quantity > min && !disabled;
	$: canIncrement = quantity < max && !disabled;
</script>

<div class="quantity-selector">
	<button 
		type="button"
		class="quantity-button"
		disabled={!canDecrement}
		on:click={decrement}
		aria-label="Decrease quantity"
	>
		<Icon icon="mdi:minus" class="quantity-icon" />
	</button>
	
	<input 
		type="number" 
		{min} 
		{max}
		{disabled}
		bind:value={quantity}
		on:input={handleInput}
		class="quantity-input"
		style="-moz-appearance: textfield;"
	/>
	
	<button 
		type="button"
		class="quantity-button"
		disabled={!canIncrement}
		on:click={increment}
		aria-label="Increase quantity"
	>
		<Icon icon="mdi:plus" class="quantity-icon" />
	</button>
</div>

<style>
	@import "tailwindcss/theme" theme(reference);
	@import "@/styles/tailwind-theme.css" theme(reference);

	.quantity-selector {
		@apply flex items-center bg-muted rounded-lg border border-border overflow-hidden shadow-sm;
	}

	.quantity-button {
		@apply flex items-center justify-center w-8 h-8 text-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed md:w-10 md:h-10;
	}

	.quantity-icon {
		@apply w-3 h-3 md:w-4 md:h-4;
	}

	.quantity-input {
		@apply w-12 h-8 text-center bg-transparent border-0 text-foreground font-medium focus:outline-none focus:ring-0 appearance-none text-sm md:w-16 md:h-10 md:text-base;
	}

	/* Hide number input spinners in all browsers */
	.quantity-input::-webkit-outer-spin-button,
	.quantity-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	
	.quantity-input {
		-moz-appearance: textfield;
	}
</style>