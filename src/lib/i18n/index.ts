import { getRelativeLocaleUrl as astroRelative } from "astro:i18n";

export const textTranslations = {
	en: {
		hero_description: `…`,
		back_to_all_posts: "Back to all posts",
		updated: "Updated",
		steps: {
			method: "Choose Reservation Type",
			provider: "Choose Provider",
			datetime: "Choose Date & Time",
			review: "Review Details & Confirm",
		},
		notFound: {
			title: "404 - Page Not Found",
			description: "The page you're looking for doesn't exist.",
			heading: "This page seems misplaced...",
			message:
				"Unfortunately, this page does not exist. Maybe you can find what you're looking for on the home page?",
			homeButton: "Take me home",
			servicesButton: "Browse services",
		},
		// General UI
		ui: {
			language: "Language",
			welcome: "Welcome",
			loading: "Loading...",
			error: "Error",
			submit: "Submit",
			cancel: "Cancel",
			save: "Save",
			back: "Back",
			continue: "Continue",
			select: "Select",
			chooseReservationType: "Choose Reservation Type",
			serviceInformation: "Service Information",
			details: "Details",
			premiumService: "Premium Service",
			loadingProviders: "Loading available providers…",
			noProvidersAvailable: "No providers available for this service",
		},
		// Forms
		form: {
			required: "Required",
			email: "Email",
			phone: "Phone",
			message: "Message",
			name: "Name",
			firstName: "First Name",
			lastName: "Last Name",
			company: "Company",
			enterHere: "Enter here...",
			select: "Select...",
			fieldRequired: "This field is required",
		},
		// Reservation
		reservation: {
			date: "Date",
			time: "Time",
			dateTime: "Date & Time",
			type: "Reservation Type",
			service: "Service",
			provider: "Provider",
			book: "Book Now",
			confirm: "Confirm Booking",
			sendCode: "Send Verification Code",
			verifyCode: "Verify Code",
			verificationCode: "Verification Code",
			phoneVerified: "Phone number verified",
			chooseDate: "Choose a date",
			chooseTime: "Choose a time",
			available: "Available",
			unavailable: "Unavailable",
			enterCode: "Enter 6-digit code",
			specific: "Specific Provider",
			standard: "Standard Booking",
			emptyCart: "Your cart is empty",
			specificProvider: "Specific provider selected",
			timezone: "Time zone",
			currentLocation: "Current Location",
			directOrder: "Direct Order",
			purchaseWithoutSchedule: "Purchase without scheduling",
			scheduleAnyTime: "Schedule for any available time",
			chooseSpecificProvider: "Choose a specific provider",
			makeReservation: "Make a Reservation",
			followSteps: "Follow the steps below to complete your reservation",
			selectDate: "Select Date",
			selectDateRange: "Select Date Range",
			selectTime: "Select Time",
			selectTimeSlot: "Please select a time slot to continue.",
			selectEndDate: "Please select an end date to continue.",
			selectedDateRange: "Selected Date Range",
			startDateSelected: "Start date selected",
			completeDateRange: "Complete date range",
			inquiry: "Inquiry Booking",
			specificStandard: "Specific Provider Standard Booking",
			specificInquiry: "Specific Provider Inquiry Booking",
			providerName: "Provider",
			multiDayReservation: "Multi-day Reservation",
			notAvailable: "Reservations Not Available",
			contactUs:
				"This service currently doesn't accept reservations. Please contact us for more information.",
		},
		// Cart
		cart: {
			title: "Your Cart",
			empty: "Your cart is empty.",
			checkout: "Checkout",
			remove: "Remove",
			total: "Total",
			processing: "Processing…",
			viewCart: "View Cart",
			addToCart: "Add to Cart",
		},
		// Common
		days: "days",
		// Phone verification
		phone: {
			verification: "Phone Verification",
			verifyToast: "Please verify your phone number above before completing your booking.",
			verify: "Verify your phone number to continue",
			enterPhone: "Enter your phone number",
			processing: "Processing...",
			verifying: "Verifying...",
		},
	},
	fr: {
		hero_description: `…`,
		back_to_all_posts: "Retour à tous les articles",
		updated: "Mis à jour",
		steps: {
			method: "Choisir le type de réservation",
			provider: "Choisir le prestataire",
			datetime: "Choisir la date et l'heure",
			review: "Vérifier et confirmer",
		},
		notFound: {
			title: "404 - Page non trouvée",
			description: "La page que vous recherchez n'existe pas.",
			heading: "Cette page semble égarée...",
			message:
				"Malheureusement, cette page n'existe pas. Peut-être pouvez-vous trouver ce que vous cherchez sur la page d'accueil ?",
			homeButton: "Retour à l'accueil",
			servicesButton: "Parcourir les services",
		},
		// General UI
		ui: {
			language: "Langue",
			welcome: "Bienvenue",
			loading: "Chargement...",
			error: "Erreur",
			submit: "Soumettre",
			cancel: "Annuler",
			save: "Enregistrer",
			back: "Retour",
			continue: "Continuer",
			select: "Sélectionner",
			chooseReservationType: "Choisir le type de réservation",
			serviceInformation: "Informations sur le service",
			details: "Détails",
			premiumService: "Service Premium",
			loadingProviders: "Chargement des prestataires disponibles…",
			noProvidersAvailable: "Aucun prestataire disponible pour ce service",
		},
		// Forms
		form: {
			required: "Obligatoire",
			email: "E-mail",
			phone: "Téléphone",
			message: "Message",
			name: "Nom",
			firstName: "Prénom",
			lastName: "Nom de famille",
			company: "Entreprise",
			enterHere: "Saisir ici...",
			select: "Sélectionner...",
			fieldRequired: "Ce champ est obligatoire",
		},
		// Reservation
		reservation: {
			date: "Date",
			time: "Heure",
			dateTime: "Date et heure",
			type: "Type de réservation",
			service: "Service",
			provider: "Prestataire",
			book: "Réserver maintenant",
			confirm: "Confirmer la réservation",
			sendCode: "Envoyer le code de vérification",
			verifyCode: "Vérifier le code",
			verificationCode: "Code de vérification",
			phoneVerified: "Numéro de téléphone vérifié",
			chooseDate: "Choisir une date",
			chooseTime: "Choisir une heure",
			available: "Disponible",
			unavailable: "Indisponible",
			enterCode: "Entrez le code à 6 chiffres",
			specific: "Prestataire spécifique",
			standard: "Réservation standard",
			emptyCart: "Votre panier est vide",
			specificProvider: "Prestataire spécifique sélectionné",
			timezone: "Fuseau horaire",
			currentLocation: "Localisation actuelle",
			directOrder: "Commande directe",
			purchaseWithoutSchedule: "Acheter sans programmer",
			scheduleAnyTime: "Programmer à n'importe quel moment disponible",
			chooseSpecificProvider: "Choisir un prestataire spécifique",
			makeReservation: "Effectuer une réservation",
			followSteps: "Suivez les étapes ci-dessous pour compléter votre réservation",
			selectDate: "Sélectionner une date",
			selectDateRange: "Sélectionner une période",
			selectTime: "Sélectionner une heure",
			selectTimeSlot: "Veuillez sélectionner un créneau horaire pour continuer.",
			selectEndDate: "Veuillez sélectionner une date de fin pour continuer.",
			selectedDateRange: "Période sélectionnée",
			startDateSelected: "Date de début sélectionnée",
			completeDateRange: "Période complète",
			inquiry: "Réservation sur demande",
			specificStandard: "Réservation standard avec prestataire spécifique",
			specificInquiry: "Réservation sur demande avec prestataire spécifique",
			providerName: "Prestataire",
			multiDayReservation: "Réservation sur plusieurs jours",
			notAvailable: "Réservations non disponibles",
			contactUs:
				"Ce service n'accepte actuellement pas de réservations. Veuillez nous contacter pour plus d'informations.",
		},
		// Cart
		cart: {
			title: "Votre Panier",
			empty: "Votre panier est vide.",
			checkout: "Paiement",
			remove: "Supprimer",
			total: "Total",
			processing: "Traitement en cours...",
			viewCart: "Voir le panier",
			addToCart: "Ajouter au panier",
		},
		// Common
		days: "jours",
		// Phone verification
		phone: {
			verification: "Vérification du téléphone",
			verifyToast:
				"Veuillez vérifier votre numéro de téléphone ci-dessus avant de finaliser votre réservation.",
			verify: "Vérifiez votre numéro de téléphone pour continuer",
			enterPhone: "Entrez votre numéro de téléphone",
			processing: "Traitement en cours...",
			verifying: "Vérification en cours...",
		},
	},
} as const;

export const routeTranslations = {
	en: {
		overviewKey: "overview",
	},
	fr: {
		overviewKey: "apercu",
	},
} as const;

export function getLocalizedString(languageObj, locale, fallback: string = ""): string {
	if (languageObj == null) return fallback;

	if (typeof languageObj === "string") return languageObj;

	if (languageObj[locale]) return languageObj[locale];

	if (languageObj[defaultLocale]) return languageObj[defaultLocale];

	const firstTranslation = Object.values(languageObj)[0];
	if (firstTranslation) return firstTranslation;

	return fallback;
}

export const getRelativeLocaleUrl = (locale, path) => {
	const loc = getLocale(locale);
	return astroRelative(loc, path);
};

export function getLocale(locale) {
	if (locale) {
		return locale;
	}

	if (typeof window === "undefined") {
		return defaultLocale;
	}

	const url = new URL(window.location.href);
	const localeFromUrl = getLocaleFromUrl(url);

	return localeFromUrl;
}

export function t(key, locale = null) {
	const effectiveLocale = getLocale(locale);

	const keyPath = key.split(".");
	let result = textTranslations[effectiveLocale];

	for (const segment of keyPath) {
		if (!result || !result[segment]) {
			const enResult = textTranslations["en"];
			let fallbackValue = enResult;

			for (const fallbackSegment of keyPath) {
				if (!fallbackValue || !fallbackValue[fallbackSegment]) {
					return key;
				}
				fallbackValue = fallbackValue[fallbackSegment];
			}

			return fallbackValue;
		}
		result = result[segment];
	}

	return result || key;
}

export function getLocaleFromUrl(url: URL): (typeof locales)[number] {
	const [, locale] = url.pathname.split("/");

	if (locales.includes(locale)) return locale as (typeof locales)[number];
	return defaultLocale;
}

export function getLocalizedPathname(locale: (typeof locales)[number], url: URL): string {
	const [, lang, ...rest] = url.pathname.split("/");

	const getKeyByValue = (obj: Record<string, string>, value: string): string | undefined => {
		return Object.keys(obj).find((key) => obj[key] === value.replace(/\/$/, "").replace(/^\//, ""));
	};

	let oldPath: string, currLocale: (typeof locales)[number];
	// @ts-expect-error the whole point of this is to check if lang is a valid locale
	if (locales.includes(lang)) {
		// remove locale from URL if it's already there
		oldPath = rest.join("/");
		currLocale = lang as (typeof locales)[number];
	} else {
		oldPath = url.pathname;
		currLocale = defaultLocale;
	}

	// trim any starting and ending slashes for comparison
	const routeStringTrimmed = oldPath.replace(/\/$/, "").replace(/^\//, "");

	// first find out if the passed value maps to a key for route translations
	const routeTranslationsKey = getKeyByValue(routeTranslations[currLocale], routeStringTrimmed);

	// if there is a key, then use that key to get the translated route
	const translatedRoute = routeTranslationsKey
		? routeTranslations[locale][routeTranslationsKey]
		: routeStringTrimmed;

	return astroRelative(locale, translatedRoute);
}

// The below locales need to match what you've put in your `astro.config.mjs` file
export const locales = ["en", "fr"] as const;
export const defaultLocale = "en" as const;

// localeMap is used to map languages to their respective locales - used for formatDate function
export const localeMap = {
	en: "en-US",
	fr: "fr-FR",
} as const;

// text to show in the language switcher for each locale
export const languageSwitcherMap = {
	en: "EN",
	fr: "FR",
	// en: "English",
	// fr: "Français",
} as const;
