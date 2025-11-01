<script lang="ts">
	let { 
		value = 0,
		min = 0,
		max = 100,
		onChange = (value: number) => {}
	} = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		onChange(Number(target.value));
	}
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between text-sm text-muted-foreground">
		<span>{min}</span>
		<span class="rounded-full bg-accent px-3 py-1 font-mono text-foreground">
			{value}
		</span>
		<span>{max}</span>
	</div>
	<input	
		type="range"
		{min}
		{max}
		{value}
		on:input={handleInput}
		class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
	/>
</div>