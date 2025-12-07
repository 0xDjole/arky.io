import { computed } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import { arky } from "@lib/index";
import type { Slot, CalendarDay } from "arky-sdk";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const engine = arky.reservationEngine({
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

export const store = engine.store;

let cartInitialized = false;

store.setKey("weekdays" as any, WEEKDAYS);
store.setKey("quote" as any, null);
store.setKey("fetchingQuote" as any, false);
store.setKey("quoteError" as any, null);
store.setKey("currency" as any, "USD");
store.setKey("phoneNumber" as any, "");
store.setKey("verificationCode" as any, "");
store.setKey("tzGroups" as any, arky.utils.tzGroups);
store.setKey("dateTimeConfirmed" as any, false);
store.setKey("isMultiDay" as any, false);

export const currentStepName = computed(store, (state: any) => {
  if (!state.service) return "";
  if (!state.selectedMethod && state.service.reservationMethods?.length > 1) return "method";
  if (state.selectedMethod?.includes("SPECIFIC") && !state.selectedProvider) return "provider";
  if (!state.selectedSlot || !state.dateTimeConfirmed) return "datetime";
  return "review";
});

export const canProceed = computed(store, (state) => {
  const step = currentStepName.get();
  switch (step) {
    case "method":
      return !!state.selectedMethod;
    case "provider":
      return !!state.selectedProvider;
    case "datetime":
      return state.isMultiDay
        ? !!(state.startDate && state.endDate && state.selectedSlot)
        : !!(state.selectedDate && state.selectedSlot);
    case "review":
      return true;
    default:
      return false;
  }
});

export const monthYear = computed(store, (state) => {
  return state.currentMonth.toLocaleString(undefined, { month: "long", year: "numeric" });
});

export const totalSteps = computed(store, (state) => {
  if (!state.service) return 0;
  let steps = 2;
  if (state.service.reservationMethods?.length > 1) steps++;
  if (state.selectedMethod?.includes("SPECIFIC")) steps++;
  return steps;
});

export const steps = computed(store, (state) => {
  const result: Record<number, { name: string }> = {};
  let idx = 1;

  if (state.service?.reservationMethods?.length > 1) {
    result[idx++] = { name: "method" };
  }
  if (state.selectedMethod?.includes("SPECIFIC")) {
    result[idx++] = { name: "provider" };
  }
  result[idx++] = { name: "datetime" };
  result[idx++] = { name: "review" };

  return result;
});

export const currentStep = computed(store, (state) => {
  const name = currentStepName.get();
  const stepsObj = steps.get();

  for (const [idx, step] of Object.entries(stepsObj)) {
    if (step.name === name) return parseInt(idx);
  }
  return 1;
});

const formatDateDisplay = (ds: string | null): string => {
  if (!ds) return "";
  const d = new Date(ds);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const STEP_ORDER = ["method", "provider", "datetime", "review"];

const getStepIndex = (step: string): number => {
  const idx = STEP_ORDER.indexOf(step);
  return idx >= 0 ? idx : 0;
};

export const actions = {
  setService: async (service: any) => {
    const isMultiDayBlock = service?.blocks?.find((b: any) => b.key === "isMultiDay");
    const isMultiDay = isMultiDayBlock?.value?.[0] === true;
    await engine.setService(service.id);
    store.setKey("isMultiDay" as any, isMultiDay);
    store.setKey("service", service);
    if (service.prices?.[0]?.currency) {
      store.setKey("currency" as any, service.prices[0].currency);
    }
  },

  handleMethodSelection: async (method: string, advance: boolean = true) => {
    engine.selectMethod(method);
    if (method.includes("SPECIFIC")) {
      const providers = await engine.getProvidersList();
      store.setKey("providers", providers);
      if (advance && providers.length === 1) {
        engine.selectProvider(providers[0]);
      }
    }
  },

  selectDate: (cell: CalendarDay) => {
    if (cell.blank || !cell.available) return;
    store.setKey("dateTimeConfirmed" as any, false);
    const state = store.get() as any;

    if (state.isMultiDay) {
      if (!state.startDate) {
        store.setKey("startDate", cell.iso);
        store.setKey("selectedDate", cell.iso);
        store.setKey("endDate", null);
        store.setKey("selectedSlot", null);
      } else if (!state.endDate) {
        if (cell.date.getTime() < new Date(state.startDate).getTime()) {
          store.setKey("startDate", cell.iso);
          store.setKey("endDate", state.startDate);
        } else {
          store.setKey("endDate", cell.iso);
        }
        actions.createMultiDaySlot();
      } else {
        store.setKey("startDate", cell.iso);
        store.setKey("selectedDate", cell.iso);
        store.setKey("endDate", null);
        store.setKey("selectedSlot", null);
      }
      engine.updateCalendar();
    } else {
      engine.selectDate(cell);
    }
  },

  createMultiDaySlot: () => {
    const state = store.get() as any;
    if (!state.startDate || !state.endDate) return;

    const startDT = new Date(state.startDate);
    startDT.setHours(9, 0, 0, 0);
    const endDT = new Date(state.endDate);
    endDT.setHours(17, 0, 0, 0);
    const from = Math.floor(startDT.getTime() / 1000);
    const to = Math.floor(endDT.getTime() / 1000);
    const providerId = state.selectedProvider?.id || state.providers[0]?.id || "";

    const slot = {
      id: `multi-${from}-${to}`,
      serviceId: state.service?.id || "",
      providerId,
      from,
      to,
      timeText: "9:00 AM - 5:00 PM daily",
      dateText: `${state.startDate} to ${state.endDate}`,
      isMultiDay: true,
    };
    store.setKey("slots", [slot]);
    store.setKey("selectedSlot", slot);
  },

  selectTimeSlot: (slot: Slot | null) => {
    store.setKey("dateTimeConfirmed" as any, false);
    engine.selectSlot(slot as Slot);
  },

  resetDateSelection: () => {
    store.setKey("selectedDate", null);
    store.setKey("startDate", null);
    store.setKey("endDate", null);
    store.setKey("slots", []);
    store.setKey("selectedSlot", null);
    store.setKey("dateTimeConfirmed" as any, false);
  },

  addToCart: () => {
    const state = store.get();
    if (!state.selectedSlot) return;
    const enrichedSlot = {
      ...state.selectedSlot,
      serviceName: state.service?.name?.en || state.service?.name || "",
      date: state.selectedSlot.dateText,
      reservationMethod: state.selectedMethod,
      serviceBlocks: state.service?.reservationBlocks || [],
    };
    engine.addToCart();
    const cart = store.get().cart;
    if (cart.length > 0) {
      cart[cart.length - 1] = { ...cart[cart.length - 1], ...enrichedSlot };
      store.setKey("cart", [...cart]);
    }
  },

  checkout: async (paymentMethod?: string, blocks?: any[], promoCode?: string) => {
    try {
      const result = await engine.checkout({ paymentMethod, blocks, promoCode });
      return { success: true, data: result };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  fetchQuote: async (paymentMethod?: string, promoCode?: string) => {
    store.setKey("fetchingQuote" as any, true);
    store.setKey("quoteError" as any, null);
    try {
      const quote = await engine.getQuote({ paymentMethod, promoCode });
      store.setKey("quote" as any, quote);
      return quote;
    } catch (e: any) {
      store.setKey("quoteError" as any, e.message);
      return null;
    } finally {
      store.setKey("fetchingQuote" as any, false);
    }
  },

  prevStep: () => {
    const current = currentStepName.get();
    const state = store.get() as any;

    if (current === "review") {
      store.setKey("dateTimeConfirmed" as any, false);
      return;
    }

    const idx = getStepIndex(current);
    for (let i = idx - 1; i >= 0; i--) {
      const step = STEP_ORDER[i];
      if (step === "method" && state.service?.reservationMethods?.length > 1) {
        store.setKey("selectedMethod", null);
        store.setKey("dateTimeConfirmed" as any, false);
        return;
      }
      if (step === "provider" && state.selectedMethod?.includes("SPECIFIC")) {
        store.setKey("selectedProvider", null);
        store.setKey("dateTimeConfirmed" as any, false);
        return;
      }
      if (step === "datetime") {
        store.setKey("selectedSlot", null);
        store.setKey("dateTimeConfirmed" as any, false);
        return;
      }
    }
  },

  nextStep: () => {
    const current = currentStepName.get();
    if (current === "datetime" && canProceed.get()) {
      store.setKey("dateTimeConfirmed" as any, true);
    }
  },

  getServicePrice: (): string => {
    const state = store.get();
    if (!state.service?.prices) return "";
    return arky.utils.getMarketPrice(state.service.prices, "us") || "";
  },

  addPhoneNumber: async () => {
    const state = store.get();
    const phone = (state as any).phoneNumber;
    if (!phone) return { success: false, error: "No phone number" };
    try {
      await arky.user.sendPhoneCode({ phone });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  phoneNumberConfirm: async () => {
    const state = store.get();
    const code = (state as any).verificationCode;
    if (!code) return { success: false, error: "No verification code" };
    try {
      await arky.user.verifyPhoneCode({ code });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  formatDateDisplay,
};

export const cartParts = persistentAtom<Slot[]>("reservationCart", [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

store.subscribe((state) => {
  if (!cartInitialized) return;
  const currentCart = cartParts.get();
  if (JSON.stringify(state.cart) !== JSON.stringify(currentCart)) {
    cartParts.set(state.cart);
  }
});

cartParts.subscribe((cart) => {
  if (!cartInitialized) return;
  const currentCart = store.get().cart;
  if (JSON.stringify(cart) !== JSON.stringify(currentCart)) {
    store.setKey("cart", cart);
  }
});

export function initReservationStore() {
  if (cartInitialized) return;
  const savedCart = cartParts.get();
  if (savedCart?.length) {
    store.setKey("cart", savedCart);
  }
  cartInitialized = true;
}

export default { store, engine, actions, initReservationStore };
