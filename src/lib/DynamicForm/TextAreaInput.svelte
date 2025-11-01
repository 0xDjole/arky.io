<script lang="ts">
	let { 
		value = '',
		placeholder = '',
		required = false,
		rows = 3,
		onChange = (value: string) => {},
		onBlur = () => {}
	} = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		onChange(target.value);
	}
</script>

<textarea
	{value}
	{placeholder}
	{required}
	{rows}
	on:input={handleInput}
	on:blur={onBlur}
	class="w-full rounded-lg border-0 bg-muted px-3 py-2 text-foreground focus:bg-background placeholder-gray-500 resize-none"
></textarea>