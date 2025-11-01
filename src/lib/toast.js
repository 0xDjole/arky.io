import { deepMap } from 'nanostores';

export const toastStore = deepMap({
	toasts: []
});

let toastId = 0;

export function showToast(message, type = 'success', duration = 5000) {
	const id = ++toastId;
	const toast = {
		id,
		message,
		type, // 'success', 'error', 'warning', 'info'
		duration
	};

	const currentToasts = toastStore.get().toasts;
	toastStore.setKey('toasts', [...currentToasts, toast]);

	if (duration > 0) {
		setTimeout(() => {
			removeToast(id);
		}, duration);
	}

	return id;
}

export function removeToast(id) {
	const currentToasts = toastStore.get().toasts;
	toastStore.setKey('toasts', currentToasts.filter(t => t.id !== id));
}

export function clearToasts() {
	toastStore.setKey('toasts', []);
}