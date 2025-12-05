export interface GalleryItem {
	isThumbnail: boolean;
	media: any;
}

export function extractGalleryItems(blocks: any): GalleryItem[] {
	if (!blocks || !Array.isArray(blocks)) return [];

	const galleryBlock = blocks.find((b: any) => b.key === "gallery");
	if (!galleryBlock?.value || !Array.isArray(galleryBlock.value)) return [];

	return galleryBlock.value.map((item: any) => {
		if (item.type === 'RELATIONSHIP_MEDIA' && item.key === 'media') {
			if (!item.value?.[0]) return null;
			return { isThumbnail: false, media: item.value[0] };
		}
		return null;
	}).filter(Boolean) as GalleryItem[];
}

export function getGalleryThumbnail(blocks: any) {
	if (!blocks || !Array.isArray(blocks)) return null;

	const galleryBlock = blocks.find((b: any) => b.key === "gallery");
	if (!galleryBlock?.value?.[0]) return null;

	const firstItem = galleryBlock.value[0];
	if (firstItem.type === 'RELATIONSHIP_MEDIA' && firstItem.key === 'media') {
		return firstItem.value?.[0]?.resolutions?.original?.url || null;
	}

	return null;
}

export function getFirstGalleryMedia(blocks: any) {
	if (!blocks || !Array.isArray(blocks)) return null;

	const galleryBlock = blocks.find((b: any) => b.key === "gallery");
	if (!galleryBlock?.value?.[0]) return null;

	const firstItem = galleryBlock.value[0];
	if (firstItem.type === 'RELATIONSHIP_MEDIA' && firstItem.key === 'media') {
		return firstItem.value?.[0] || null;
	}

	return null;
}
