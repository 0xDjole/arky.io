import { computed } from "nanostores";
import { cartItems as eshopItems } from "./eshop";
import { cartParts as reservationItems } from "./reservation";

export const totalCartItems = computed([eshopItems, reservationItems], (eshop, reservation) => {
    const eshopArr = Array.isArray(eshop) ? eshop : [];
    const reservationArr = Array.isArray(reservation) ? reservation : [];
    const eshopCount = eshopArr.reduce((sum, item) => sum + (item?.quantity || 0), 0);
    const reservationCount = reservationArr.length;
    return eshopCount + reservationCount;
});

export const hasEshopItems = computed(eshopItems, (items) => Array.isArray(items) && items.length > 0);
export const hasReservationItems = computed(reservationItems, (items) => Array.isArray(items) && items.length > 0);
export const isCartEmpty = computed([eshopItems, reservationItems], (eshop, reservation) => {
    const eshopEmpty = !Array.isArray(eshop) || eshop.length === 0;
    const reservationEmpty = !Array.isArray(reservation) || reservation.length === 0;
    return eshopEmpty && reservationEmpty;
});

export const showEshopSection = computed([hasEshopItems, isCartEmpty], (hasEshop, isEmpty) => Boolean(hasEshop) || Boolean(isEmpty));
export const showReservationSection = computed([hasReservationItems, isCartEmpty], (hasReservation, isEmpty) => Boolean(hasReservation) || Boolean(isEmpty));
export const showBothSections = computed([hasEshopItems, hasReservationItems], (hasEshop, hasReservation) => Boolean(hasEshop) && Boolean(hasReservation));
