<script>
	import Icon from '@iconify/svelte';
	import { store, actions } from '@lib/core/stores/reservation';
	import DynamicForm from '@lib/DynamicForm/index.svelte';
	import { t, getLocale } from '../../../lib/i18n/index';

	function update(idx, v) {
		const svc = { ...$store.service };
		const list = [...svc.reservationBlocks];
		list[idx] = { ...list[idx], value: Array.isArray(v) ? v : [v] };
		svc.reservationBlocks = list;
		store.setKey('service', svc);
	}

	async function handlePhoneSendCode(blockId, phone) {
		store.setKey('phoneNumber', phone);
		return await actions.updateProfilePhone();
	}

	async function handlePhoneVerifyCode(blockId, code) {
		store.setKey('verificationCode', code);
		return await actions.verifyPhoneCode();
	}
</script>

{#if $store.selectedSlot}
	<div class="bg-secondary border-secondary mt-4 rounded-xl border p-4 shadow-lg space-y-6" style="opacity: 0.8;">
		<div class="border-secondary flex items-center justify-between border-b pb-3">
			<h3 class="text-lg font-medium text-primary">{t('steps.review')}</h3>
			<div class="bg-primary-900/40 text-secondary rounded-lg px-3 py-1 text-sm">{$store.selectedSlot.timeText}</div>
		</div>
		
		<div class="space-y-2">
			<h4 class="text-secondary font-medium">{t('reservation.service')}</h4>
			<div class="border-secondary bg-secondary rounded-lg border p-4 flex gap-3">
				<Icon icon="mdi:store" class="h-5 w-5 text-secondary mt-1"/>
				<div>
					<p class="font-medium text-primary">
						{$store.service.name.en ?? Object.values($store.service.name)[0]}
					</p>
					{#if $store.service.priceOption}
						<p class="text-secondary mt-1 text-sm">{actions.getServicePrice()}</p>
					{/if}
				</div>
			</div>
		</div>
		
		<div class="space-y-2">
			<h4 class="text-secondary font-medium">{t('reservation.type')}</h4>
			<div class="border-secondary bg-secondary rounded-lg border p-4 flex gap-3">
				<Icon icon="mdi:calendar-check" class="h-5 w-5 text-secondary mt-1"/>
				<div>
					<p class="font-medium text-primary">
						{#if $store.selectedMethod === 'STANDARD'}{t('reservation.standard')}{/if}
						{#if $store.selectedMethod === 'INQUIRY'}{t('reservation.inquiry')}{/if}
						{#if $store.selectedMethod === 'STANDARD_SPECIFIC'}{t('reservation.specificStandard')}{/if}
						{#if $store.selectedMethod === 'INQUIRY_SPECIFIC'}{t('reservation.specificInquiry')}{/if}
						{#if $store.selectedMethod === 'ORDER'}{t('reservation.directOrder')}{/if}
					</p>
					{#if $store.selectedProvider}
						<p class="text-secondary mt-1 text-sm">{t('reservation.providerName')}: {$store.selectedProvider.name}</p>
					{/if}
				</div>
			</div>
		</div>
		
		<div class="space-y-2">
			<h4 class="text-secondary font-medium">{t('reservation.dateTime')}</h4>
			<div class="border-secondary bg-secondary rounded-lg border p-4 flex gap-3">
				<Icon 
					icon={$store.isMultiDay ? 'mdi:calendar-range' : 'mdi:calendar'} 
					class="h-5 w-5 text-secondary mt-1"
				/>
				<div>
					{#if $store.isMultiDay}
						<p class="font-medium text-primary">{t('reservation.multiDayReservation')}</p>
						<p class="text-secondary mt-1 text-sm">
							{actions.formatDateDisplay($store.startDate)} to {actions.formatDateDisplay($store.endDate)}
							({Math.ceil((new Date($store.endDate) - new Date($store.startDate)) / 864e5) + 1} {t('days')})
						</p>
					{:else}
						<p class="font-medium text-primary">
							{(() => {
								const [year, month, day] = $store.selectedDate.split('-').map(Number);
								const date = new Date(year, month - 1, day, 12, 0, 0);
								return date.toLocaleDateString(getLocale(), {
									weekday:'long',
									year:'numeric',
									month:'long',
									day:'numeric'
								});
							})()}
						</p>
						<p class="text-secondary mt-1 text-sm">{$store.selectedSlot.timeText}</p>
					{/if}
				</div>
			</div>
		</div>
		
		<DynamicForm 
			blocks={$store.service?.reservationBlocks || []} 
			onUpdate={update}
			onPhoneSendCode={handlePhoneSendCode}
			onPhoneVerifyCode={handlePhoneVerifyCode}
		/>
		
		<button
			class="bg-primary-600 hover:bg-primary-700 text-white w-full flex items-center justify-center gap-2 py-3 rounded-lg mt-4 transition"
			on:click={() => actions.addToCart($store.selectedSlot)}>
			{t('cart.addToCart')} <Icon icon="mdi:cart-plus" class="h-5 w-5"/>
		</button>
	</div>
{/if}
