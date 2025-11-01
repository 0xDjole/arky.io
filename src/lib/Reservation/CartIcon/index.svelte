<script>
    import Icon from '@iconify/svelte';
    import { initReservationStore } from '@lib/core/stores/reservation';
    import { initEshopStore } from '@lib/core/stores/eshop';
    import { totalCartItems } from '@lib/core/stores/cart';
    import { onMount } from 'svelte';
	import {  getLocale, getRelativeLocaleUrl } from '@lib/i18n/index.js';
    
    export let className = '';
    
    onMount(() => {
        initReservationStore();
        initEshopStore();
    });
</script>

<a
    href={getRelativeLocaleUrl(getLocale(), '/cart')}
    class="cart-icon relative flex h-8 w-8 items-center justify-center rounded-full {className}"
    aria-label="Shopping cart"
>
    <Icon icon="mdi:cart" class="h-5 w-5 text-primary" />
    {#if $totalCartItems > 0}
        <div
            class="bg-accent absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-accent shadow-sm"
        >
            {$totalCartItems}
        </div>
    {/if}
</a>

<style>
    .cart-icon {
        transition: transform 0.2s ease;
    }
    .cart-icon:hover {
        transform: scale(1.05);
    }
    .cart-icon:hover :global(.text-primary) {
        color: var(--text-secondary);
    }
    .cart-icon:active {
        transform: scale(0.95);
    }
    .min-w-5 {
        min-width: 1.25rem;
    }
</style>
