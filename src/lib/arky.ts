import { createArkySDK } from "arky-sdk";
import appConfig from "../appConfig";

// Get API URL from appConfig (which is based on PUBLIC_ENVIRONMENT)
const API_URL = appConfig.apiUrl;
// Build-time admin token for SSR (private, not exposed to client)
const ARKY_TOKEN = import.meta.env.ARKY_TOKEN || "";

export const arky = createArkySDK({
	baseUrl: API_URL,
	businessId: appConfig.businessId,
	market: "us",
	locale: "en",
	autoGuest: typeof window !== "undefined",

	getToken: () => {
		if (typeof window === "undefined") {
			// During SSR/build, use admin token if available
			return {
				accessToken: ARKY_TOKEN,
				refreshToken: "",
				provider: "API",
				expiresAt: 0,
				userId: "",
			};
		}

		const token = localStorage.getItem("guestToken") || "";
		const userId = localStorage.getItem("guestUserId") || "";
		const expiresAt = parseInt(localStorage.getItem("tokenExpiresAt") || "0", 10);

		return {
			accessToken: token,
			refreshToken: "",
			provider: "GUEST",
			expiresAt,
			userId,
		};
	},

	setToken: (tokens) => {
		if (typeof window === "undefined") return;

		if (tokens.accessToken) {
			localStorage.setItem("guestToken", tokens.accessToken);
			if (tokens.userId) {
				localStorage.setItem("guestUserId", tokens.userId);
			}
			if (tokens.expiresAt) {
				localStorage.setItem("tokenExpiresAt", tokens.expiresAt.toString());
			}
		} else {
			localStorage.removeItem("guestToken");
			localStorage.removeItem("guestUserId");
			localStorage.removeItem("tokenExpiresAt");
		}
	},

	logout: () => {
		if (typeof window === "undefined") return;

		localStorage.removeItem("guestToken");
		localStorage.removeItem("guestUserId");
		localStorage.removeItem("tokenExpiresAt");
	},

	isAuthenticated: () => {
		if (typeof window === "undefined") return false;
		return !!localStorage.getItem("guestToken");
	},

	navigate: undefined,
	loginFallbackPath: undefined,
});

export default arky;
