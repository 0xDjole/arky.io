// timezone-utils.js

export const tzGroups = {
	America: [
		{ name: "Pacific Time", zone: "America/Los_Angeles" },
		{ name: "Mountain Time", zone: "America/Denver" },
		{ name: "Central Time", zone: "America/Chicago" },
		{ name: "Eastern Time", zone: "America/New_York" },
		{ name: "Alaska Time", zone: "America/Anchorage" },
		{ name: "Arizona Time", zone: "America/Phoenix" },
	],
	Europe: [
		{ name: "Central European Time", zone: "Europe/Paris" },
		{ name: "Eastern European Time", zone: "Europe/Helsinki" },
		{ name: "UK / Ireland Time", zone: "Europe/London" },
		{ name: "Turkey Time", zone: "Europe/Istanbul" },
	],
	Asia: [
		{ name: "Japan / Korea Time", zone: "Asia/Tokyo" },
		{ name: "China / Singapore", zone: "Asia/Shanghai" },
		{ name: "India Time", zone: "Asia/Kolkata" },
	],
	Australia: [
		{ name: "Sydney / Melbourne", zone: "Australia/Sydney" },
		{ name: "Perth Time", zone: "Australia/Perth" },
	],
	Africa: [
		{ name: "West Africa Time", zone: "Africa/Lagos" },
		{ name: "Central Africa Time", zone: "Africa/Johannesburg" },
	],
	Pacific: [
		{ name: "Hawaii Time", zone: "Pacific/Honolulu" },
		{ name: "Fiji Time", zone: "Pacific/Fiji" },
	],
};

export const findTimeZone = (tzGroups) => {
	// Browser‑reported zone, e.g. "Europe/Sarajevo"
	const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const region = device.split("/")[0]; // "Europe"
	const group = tzGroups[region]; // preset list for that region

	// exact match – great, just use it
	if (group?.some((t) => t.zone === device)) {
		return device;
	}

	// otherwise: fall back to the FIRST zone in the same region so we stay in
	// Europe ↔ Europe, America ↔ America, etc.
	return group ? group[0].zone : device;
};
