// Gallery utilities specific to arky.io

export function getGalleryThumbnail(blocks: any) {
	if (!blocks || !Array.isArray(blocks)) return null;

	const galleryBlock = blocks.find((b: any) => b.key === "gallery");
	if (!galleryBlock || !galleryBlock.value || !Array.isArray(galleryBlock.value)) return null;

	const items = galleryBlock.value;
	if (items.length === 0) return null;

	let selectedItem = items[0];
	for (const item of items) {
		if (!item.value || !Array.isArray(item.value)) continue;

		const isThumbnailBlock = item.value.find((b: any) => b.key === "is_thumbnail");
		if (isThumbnailBlock && isThumbnailBlock.value && isThumbnailBlock.value[0] === true) {
			selectedItem = item;
			break;
		}
	}

	// Extract media from selected item
	if (!selectedItem.value || !Array.isArray(selectedItem.value)) return null;

	const mediaBlock = selectedItem.value.find((b: any) => b.key === "media");
	if (!mediaBlock || !mediaBlock.value || !Array.isArray(mediaBlock.value)) return null;

	const media = mediaBlock.value[0];
	if (!media || !media.resolutions) return null;

	const res = media.resolutions.thumbnail || media.resolutions.original;
	return res?.url || null;
}

export function getFirstGalleryMedia(blocks: any) {
	if (!blocks || !Array.isArray(blocks)) return null;

	const galleryBlock = blocks.find((b: any) => b.key === "gallery");
	if (!galleryBlock || !galleryBlock.value || !Array.isArray(galleryBlock.value)) return null;

	const items = galleryBlock.value;
	if (items.length === 0) return null;

	const firstItem = items[0];
	if (!firstItem.value || !Array.isArray(firstItem.value)) return null;

	const mediaBlock = firstItem.value.find((b: any) => b.key === "media");
	if (!mediaBlock || !mediaBlock.value || !Array.isArray(mediaBlock.value)) return null;

	return mediaBlock.value[0];
}
