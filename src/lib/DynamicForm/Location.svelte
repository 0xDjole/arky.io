<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { arky } from '@lib/index.ts';
	import { selectedMarket, getZonesForMarket } from '@lib/core/stores/business';
	import type { Location } from '@lib/core/types';

	let countriesData = $state<Array<{ code: string; name: string; states: Array<{ code: string; name: string }> }>>([]);
	let loadingCountries = $state(true);

	onMount(async () => {
		try {
			const response = await arky.location.getCountries();
			countriesData = response.items || [];
		} catch (error) {
			console.error('Failed to load countries:', error);
		} finally {
			loadingCountries = false;
		}
	});

	const ALL_COUNTRIES = $derived(
		countriesData.map(c => ({ iso: c.code, name: c.name }))
			.sort((a, b) => a.name.localeCompare(b.name))
	);

	let availableCountries = $derived.by(() => {
		const market = $selectedMarket;
		if (!market || countriesData.length === 0) return [];

		const marketZones = getZonesForMarket(market.id);
		if (marketZones.length === 0) return [];

		const hasGlobalZone = marketZones.some(z => z.countries.length === 0);
		if (hasGlobalZone) {
			return ALL_COUNTRIES;
		}

		const uniqueCountryCodes = new Set<string>();
		marketZones.forEach(zone => {
			zone.countries.forEach(countryCode => uniqueCountryCodes.add(countryCode));
		});

		return Array.from(uniqueCountryCodes)
			.map(iso => ALL_COUNTRIES.find(c => c.iso === iso))
			.filter(c => c !== undefined)
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	let {
		value = {} as Location,
		onUpdate = (location: Location) => {},
		required = false
	} = $props();

	function getAvailableStates(selectedCountry: string): Array<{ code: string; name: string }> {
		const market = $selectedMarket;
		if (!market || !selectedCountry) return [];

		const marketZones = getZonesForMarket(market.id);
		const matchingZones = marketZones.filter(z =>
			z.countries.length === 0 || z.countries.includes(selectedCountry)
		);

		const hasZoneWithAllStates = matchingZones.some(z => !z.states || z.states.length === 0);

		if (hasZoneWithAllStates) {
			const countryData = countriesData.find(c => c.code === selectedCountry);
			if (!countryData || !countryData.states) return [];
			return [...countryData.states].sort((a, b) => a.name.localeCompare(b.name));
		}

		const zoneStates = new Set<string>();
		matchingZones.forEach(zone => {
			(zone.states || []).forEach(state => zoneStates.add(state));
		});

		if (zoneStates.size === 0) {
			return [];
		}

		const countryData = countriesData.find(c => c.code === selectedCountry);
		if (!countryData) {
			return Array.from(zoneStates).map(s => ({ code: s, name: s })).sort((a, b) => a.name.localeCompare(b.name));
		}
		return countryData.states
			.filter(s => zoneStates.has(s.code))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	function update(patch: Partial<Location>) {
		const next = { ...value, ...patch };
		onUpdate(next);
	}
</script>

<div class="space-y-3">
	<label class="mb-1 block font-medium text-foreground">
		Shipping Address
		{#if required}
			<span class="text-error ml-1">*</span>
		{/if}
	</label>

	<select
		class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground text-base"
		value={value.countryCode || ''}
		onchange={(e) => {
			const countryIso = e.currentTarget.value;
			const countryObj = ALL_COUNTRIES.find(c => c.iso === countryIso);
			update({
				country: countryObj?.name || null,
				countryCode: countryIso,
				state: null,
				city: null
			});
		}}
	>
		<option value="">Select a country...</option>
		{#each availableCountries as country}
			<option value={country.iso}>{country.name}</option>
		{/each}
	</select>

	{#if value.countryCode}
		{@const availableStates = getAvailableStates(value.countryCode)}

		{#if availableStates.length > 0}
			<select
				class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground text-base"
				value={value.state || ''}
				onchange={(e) => update({ state: e.currentTarget.value })}
			>
				<option value="">Select a state...</option>
				{#each availableStates as state}
					<option value={state.code}>{state.name}</option>
				{/each}
			</select>
		{:else}
			<input
				type="text"
				class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground placeholder-gray-500 text-base"
				placeholder="State/Province (optional)"
				value={value.state || ''}
				oninput={(e) => update({ state: e.currentTarget.value })}
			/>
		{/if}

		<div class="grid grid-cols-2 gap-3">
			<input
				type="text"
				class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground placeholder-gray-500 text-base"
				placeholder="City"
				value={value.city || ''}
				oninput={(e) => update({ city: e.currentTarget.value })}
			/>

			<input
				type="text"
				class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground placeholder-gray-500 text-base"
				placeholder="Postal Code"
				value={value.postalCode || ''}
				oninput={(e) => update({ postalCode: e.currentTarget.value })}
			/>
		</div>

		<input
			type="text"
			class="w-full p-3 bg-muted border-0 rounded-lg focus:bg-background transition-colors text-foreground placeholder-gray-500 text-base"
			placeholder="Address"
			value={value.address || ''}
			oninput={(e) => update({ address: e.currentTarget.value })}
		/>
	{/if}
</div>

{#if required && !value.countryCode}
	<div class="mt-1 text-xs text-error font-medium">
		<Icon icon="mdi:alert-circle" class="w-3 h-3 inline mr-1" />
		Country is required.
	</div>
{/if}
