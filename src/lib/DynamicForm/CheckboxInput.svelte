<script lang="ts">
	let { 
		value = false,
		label = '',
		onChange = (value: boolean) => {}
	} = $props();

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onChange(target.checked);
	}
</script>

<label class="group flex items-center gap-3 cursor-pointer">
	<div class="relative">
		<input 
			type="checkbox" 
			class="sr-only"
			checked={value}
			on:change={handleChange}
		/>
		<div class="h-6 w-11 rounded-full transition-colors {value ? 'bg-primary' : 'bg-muted'}"></div>
		<div class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform {value ? 'translate-x-5' : ''}"></div>
	</div>
	<span class="text-foreground">{label}</span>
</label>