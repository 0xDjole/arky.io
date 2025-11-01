<script>
  import Icon from '@iconify/svelte';
  import check from '@iconify-icons/mdi/check';
  import { store } from '@lib/core/stores/reservation';
  import { t } from '../../../lib/i18n/index';
</script>

<div class="bg-secondary border-secondary mb-8 rounded-xl border p-4 shadow-lg" style="opacity: 0.9;">
  <div class="relative flex items-center justify-between">
    {#each Object.entries($store.steps) as [idx, step]}
      {@const i = +idx}
      <div class="relative z-10 flex flex-1 items-center">
        <div
          class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold
                  { $store.currentStep >= i
                    ? 'border-primary-500 bg-primary-900 text-primary'
                    : 'border-muted bg-tertiary text-muted' }">
          {#if $store.currentStep > i}
            <Icon icon={check} class="h-4 w-4" />
          {:else}
            {idx}
          {/if}
        </div>
        
        <p class="ml-3 text-sm font-medium
                   { $store.currentStep >= i ? 'text-primary' : 'text-muted' }">
                   {t(`steps.${step.name}`)}
        </p>
        
        {#if i < $store.totalSteps}
          <div
            class="mx-4 flex-1 border-t-2
                   { $store.currentStep > i ? 'border-primary-500' : 'border-muted' }">
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
