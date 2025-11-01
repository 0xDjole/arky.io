<script>
	import Icon from '@iconify/svelte';
	import { totalCartItems } from '@lib/core/stores/cart';
	import { getLocale, getRelativeLocaleUrl, t } from '@lib/i18n/index';
</script>

{#if $totalCartItems > 0}
	<a href={getRelativeLocaleUrl(getLocale(), '/cart')}
	   class="bg-accent hover:bg-accent fixed right-4 bottom-4 z-30 flex items-center gap-2 rounded-full px-5 py-3 text-accent shadow-lg transition-all">
		<Icon icon="mdi:cart" class="h-5 w-5" />
		{t('cart.viewCart')} ({$totalCartItems})
	</a>
{/if}