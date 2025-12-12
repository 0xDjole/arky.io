import { map, computed } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import { arky } from "@lib/index";

interface ServiceDuration {
  duration: number;
  isPause?: boolean;
}

interface AvailableSlot {
  from: number;
  to: number;
  providerId: string;
}

interface TimelinePoint {
  timestamp: number;
  concurrent: number;
}

interface WorkingHours {
  from: number;
  to: number;
}

interface WorkingDay {
  day: string;
  workingHours: WorkingHours[];
}

interface SpecificDate {
  date: number;
  workingHours: WorkingHours[];
}

interface OutcastDate {
  month: number;
  day: number;
  workingHours: WorkingHours[];
}

interface WorkingTime {
  workingDays?: WorkingDay[];
  specificDates?: SpecificDate[];
  outcastDates?: OutcastDate[];
}

interface ProviderWithTimeline {
  id: string;
  workingTime?: WorkingTime;
  timeline: TimelinePoint[];
  concurrentLimit: number;
}

export interface Slot {
  id: string;
  serviceId: string;
  providerId: string;
  from: number;
  to: number;
  timeText: string;
  dateText: string;
  isMultiDay?: boolean;
  serviceName?: string;
  date?: string;
  serviceBlocks?: any[];
}

export interface CalendarDay {
  date: Date;
  iso: string;
  available: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isToday: boolean;
  blank: boolean;
}

interface ReservationState {
  service: any | null;
  providers: ProviderWithTimeline[];
  selectedProvider: ProviderWithTimeline | null;
  currentMonth: Date;
  calendar: CalendarDay[];
  selectedDate: string | null;
  startDate: string | null;
  endDate: string | null;
  slots: Slot[];
  selectedSlot: Slot | null;
  cart: Slot[];
  timezone: string;
  tzGroups: Record<string, { zone: string; name: string }[]>;
  loading: boolean;
  weekdays: string[];
  quote: any | null;
  fetchingQuote: boolean;
  quoteError: string | null;
  currency: string;
  phoneNumber: string;
  verificationCode: string;
  dateTimeConfirmed: boolean;
  isMultiDay: boolean;
  availablePaymentMethods: any[];
}

function formatTime(ts: number, tz: string): string {
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

function formatSlotTime(from: number, to: number, tz: string): string {
  return `${formatTime(from, tz)} – ${formatTime(to, tz)}`;
}

function getTzOffset(date: Date, tz: string): number {
  const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const local = new Date(date.toLocaleString("en-US", { timeZone: tz }));
  return (utc.getTime() - local.getTime()) / 60000;
}

function toUtcTimestamp(year: number, month: number, day: number, mins: number, tz: string): number {
  const midnight = new Date(Date.UTC(year, month - 1, day));
  const offset = getTzOffset(midnight, tz);
  return Math.floor(midnight.getTime() / 1000) + (mins + offset) * 60;
}

function isBlocked(from: number, to: number, timeline: TimelinePoint[], limit: number): boolean {
  const before = timeline.filter((p) => p.timestamp <= from).sort((a, b) => b.timestamp - a.timestamp);
  if (before.length > 0 && before[0].concurrent >= limit) return true;
  for (const p of timeline) {
    if (p.timestamp >= from && p.timestamp < to && p.concurrent >= limit) return true;
  }
  return false;
}

function getTotalDuration(durations: ServiceDuration[]): number {
  return durations.reduce((sum, d) => sum + d.duration, 0);
}

function getWorkingHoursForDate(
  wt: WorkingTime | undefined,
  date: Date,
  tz: string
): WorkingHours[] {
  if (!wt) return [];
  const dayName = date.toLocaleDateString("en-US", { weekday: "long", timeZone: tz }).toLowerCase();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const ts = Math.floor(date.getTime() / 1000);
  const specific = wt.specificDates?.find((s) => s.date === ts);
  if (specific) return specific.workingHours || [];
  const outcast = wt.outcastDates?.find((o) => o.month === m && o.day === d);
  if (outcast) return outcast.workingHours || [];
  return wt.workingDays?.find((w) => w.day === dayName)?.workingHours || [];
}

function computeSlotsForDate(opts: {
  providers: ProviderWithTimeline[];
  date: Date;
  durations: ServiceDuration[];
  timezone: string;
  slotInterval?: number;
}): AvailableSlot[] {
  const { providers, date, durations, timezone, slotInterval } = opts;
  const total = getTotalDuration(durations);
  const interval = slotInterval || total;
  const slots: AvailableSlot[] = [];
  const nowTs = Math.floor(Date.now() / 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return [];
  const [year, month, day] = date.toLocaleDateString("en-CA", { timeZone: timezone }).split("-").map(Number);
  for (const p of providers) {
    for (const wh of getWorkingHoursForDate(p.workingTime, date, timezone)) {
      for (let m = wh.from; m + total <= wh.to; m += interval) {
        const from = toUtcTimestamp(year, month, day, m, timezone);
        const to = from + total * 60;
        if (from < nowTs) continue;
        if (!isBlocked(from, to, p.timeline, p.concurrentLimit)) {
          slots.push({ from, to, providerId: p.id });
        }
      }
    }
  }
  return slots.sort((a, b) => a.from - b.from);
}

function hasAvailableSlots(opts: {
  providers: ProviderWithTimeline[];
  date: Date;
  durations: ServiceDuration[];
  timezone: string;
}): boolean {
  return computeSlotsForDate(opts).length > 0;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const createInitialState = (): ReservationState => ({
  service: null,
  providers: [],
  selectedProvider: null,
  currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  calendar: [],
  selectedDate: null,
  startDate: null,
  endDate: null,
  slots: [],
  selectedSlot: null,
  cart: [],
  timezone: typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC",
  tzGroups: {},
  loading: false,
  weekdays: WEEKDAYS,
  quote: null,
  fetchingQuote: false,
  quoteError: null,
  currency: "USD",
  phoneNumber: "",
  verificationCode: "",
  dateTimeConfirmed: false,
  isMultiDay: false,
  availablePaymentMethods: [],
});

export const store = map<ReservationState>(createInitialState());

function getServiceDurations(): ServiceDuration[] {
  const state = store.get();
  if (!state.service?.durations?.length) return [{ duration: 60, isPause: false }];
  return state.service.durations.map((d: any) => ({
    duration: d.duration,
    isPause: d.isPause || d.is_pause || false,
  }));
}

function buildCalendar(): CalendarDay[] {
  const state = store.get();
  const { currentMonth, selectedDate, startDate, endDate, providers, selectedProvider, timezone } = state;
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: CalendarDay[] = [];
  const pad = (first.getDay() + 6) % 7;

  for (let i = 0; i < pad; i++) {
    cells.push({ date: new Date(0), iso: "", available: false, isSelected: false, isInRange: false, isToday: false, blank: true });
  }

  const activeProviders = selectedProvider ? providers.filter(p => p.id === selectedProvider.id) : providers;
  const durations = getServiceDurations();

  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(year, month, d);
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const available = activeProviders.length > 0 && hasAvailableSlots({ providers: activeProviders, date, durations, timezone });
    const isToday = date.getTime() === today.getTime();
    const isSelected = iso === selectedDate || iso === startDate || iso === endDate;
    let isInRange = false;
    if (startDate && endDate) {
      const t = date.getTime();
      isInRange = t > new Date(startDate).getTime() && t < new Date(endDate).getTime();
    }
    cells.push({ date, iso, available, isSelected, isInRange, isToday, blank: false });
  }

  const suffix = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < suffix; i++) {
    cells.push({ date: new Date(0), iso: "", available: false, isSelected: false, isInRange: false, isToday: false, blank: true });
  }

  return cells;
}

function computeSlots(dateStr: string): Slot[] {
  const state = store.get();
  const { providers, selectedProvider, timezone, service } = state;
  const date = new Date(dateStr + "T00:00:00");
  const activeProviders = selectedProvider ? providers.filter(p => p.id === selectedProvider.id) : providers;
  const raw = computeSlotsForDate({ providers: activeProviders, date, durations: getServiceDurations(), timezone });

  return raw.map((s, i) => ({
    id: `${service?.id}-${s.from}-${i}`,
    serviceId: service?.id || "",
    providerId: s.providerId,
    from: s.from,
    to: s.to,
    timeText: formatSlotTime(s.from, s.to, timezone),
    dateText: new Date(s.from * 1000).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", timeZone: timezone }),
  }));
}

export const currentStepName = computed(store, (state) => {
  if (!state.service) return "";
  if (!state.selectedSlot || !state.dateTimeConfirmed) return "datetime";
  return "review";
});

export const canProceed = computed(store, (state) => {
  const step = currentStepName.get();
  switch (step) {
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
  return 2;
});

export const steps = computed(store, () => {
  const result: Record<number, { name: string }> = {};
  result[1] = { name: "datetime" };
  result[2] = { name: "review" };
  return result;
});

export const currentStep = computed(store, () => {
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

const STEP_ORDER = ["datetime", "review"];

const getStepIndex = (step: string): number => {
  const idx = STEP_ORDER.indexOf(step);
  return idx >= 0 ? idx : 0;
};

export const actions = {
  setTimezone(tz: string) {
    store.setKey("timezone", tz);
    store.setKey("calendar", buildCalendar());
    const state = store.get();
    if (state.selectedDate) {
      store.setKey("slots", computeSlots(state.selectedDate));
      store.setKey("selectedSlot", null);
    }
  },

  async setService(service: any) {
    store.setKey("loading", true);
    try {
      const isMultiDayBlock = service?.blocks?.find((b: any) => b.key === "isMultiDay");
      const isMultiDay = isMultiDayBlock?.value?.[0] === true;

      const fullService = await arky.reservation.getService({ id: service.id });

      store.set({
        ...store.get(),
        service: fullService,
        selectedProvider: null,
        providers: [],
        selectedDate: null,
        startDate: null,
        endDate: null,
        slots: [],
        selectedSlot: null,
        currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        loading: false,
        isMultiDay,
      });

      if (fullService.prices?.[0]?.currency) {
        store.setKey("currency", fullService.prices[0].currency);
      }

      await actions.loadMonth();
    } catch (e) {
      store.setKey("loading", false);
      throw e;
    }
  },

  async loadMonth() {
    const state = store.get();
    if (!state.service) return;
    store.setKey("loading", true);

    try {
      const { currentMonth, service } = state;
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const from = Math.floor(new Date(year, month, 1).getTime() / 1000);
      const to = Math.floor(new Date(year, month + 1, 0, 23, 59, 59).getTime() / 1000);

      const providers = await arky.reservation.getServiceProviders({ serviceId: service.id, from, to });
      store.setKey("providers", providers || []);
      store.setKey("calendar", buildCalendar());
    } finally {
      store.setKey("loading", false);
    }
  },

  prevMonth() {
    const { currentMonth } = store.get();
    store.setKey("currentMonth", new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    actions.loadMonth();
  },

  nextMonth() {
    const { currentMonth } = store.get();
    store.setKey("currentMonth", new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    actions.loadMonth();
  },

  selectProvider(provider: ProviderWithTimeline | null) {
    store.set({
      ...store.get(),
      selectedProvider: provider,
      selectedDate: null,
      startDate: null,
      endDate: null,
      slots: [],
      selectedSlot: null,
    });
    store.setKey("calendar", buildCalendar());
  },

  selectDate(cell: CalendarDay) {
    if (cell.blank || !cell.available) return;
    store.setKey("dateTimeConfirmed", false);
    const state = store.get();

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
      actions.updateCalendar();
    } else {
      const slots = computeSlots(cell.iso);
      store.set({ ...state, selectedDate: cell.iso, slots, selectedSlot: null });
      store.setKey("calendar", buildCalendar());
    }
  },

  createMultiDaySlot() {
    const state = store.get();
    if (!state.startDate || !state.endDate) return;

    const [startYear, startMonth, startDay] = state.startDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = state.endDate.split("-").map(Number);
    const tz = state.timezone;

    // Full day booking: midnight start day to midnight after end day (24/7 schedule)
    const from = toUtcTimestamp(startYear, startMonth, startDay, 0, tz);
    const to = toUtcTimestamp(endYear, endMonth, endDay + 1, 0, tz);
    const providerId = state.selectedProvider?.id || state.providers[0]?.id || "";

    const slot: Slot = {
      id: `multi-${from}-${to}`,
      serviceId: state.service?.id || "",
      providerId,
      from,
      to,
      timeText: "Full day",
      dateText: `${state.startDate} to ${state.endDate}`,
      isMultiDay: true,
    };
    store.setKey("slots", [slot]);
    store.setKey("selectedSlot", slot);
  },

  selectTimeSlot(slot: Slot | null) {
    store.setKey("dateTimeConfirmed", false);
    store.setKey("selectedSlot", slot);
  },

  resetDateSelection() {
    store.setKey("selectedDate", null);
    store.setKey("startDate", null);
    store.setKey("endDate", null);
    store.setKey("slots", []);
    store.setKey("selectedSlot", null);
    store.setKey("dateTimeConfirmed", false);
  },

  updateCalendar() {
    store.setKey("calendar", buildCalendar());
  },

  findFirstAvailable() {
    const state = store.get();
    for (const day of state.calendar) {
      if (!day.blank && day.available) {
        actions.selectDate(day);
        return;
      }
    }
  },

  addToCart() {
    const state = store.get();
    if (!state.selectedSlot) return;
    const enrichedSlot: Slot = {
      ...state.selectedSlot,
      serviceName: state.service?.name?.en || state.service?.name || "",
      date: state.selectedSlot.dateText,
      serviceBlocks: state.service?.reservationBlocks || [],
    };
    store.set({
      ...state,
      cart: [...state.cart, enrichedSlot],
      selectedDate: null,
      startDate: null,
      endDate: null,
      slots: [],
      selectedSlot: null,
    });
    store.setKey("calendar", buildCalendar());
  },

  removeFromCart(slotId: string) {
    const state = store.get();
    store.setKey("cart", state.cart.filter(s => s.id !== slotId));
  },

  clearCart() {
    store.setKey("cart", []);
  },

  async checkout(paymentMethodId?: string, blocks?: any[], email?: string, phone?: string) {
    const state = store.get();
    if (!state.cart.length) return { success: false, error: "Cart is empty" };
    store.setKey("loading", true);

    try {
      const promoCodeId = state.quote?.payment?.promoCode?.id || undefined;

      const result = await arky.reservation.checkout({
        items: state.cart.map((s) => ({
          serviceId: s.serviceId,
          providerId: s.providerId,
          from: s.from,
          to: s.to,
          blocks: s.serviceBlocks || [],
        })),
        paymentMethodId,
        promoCodeId,
        blocks: blocks || [],
        email: email || undefined,
        phone: phone || undefined,
      });
      return { success: true, data: result };
    } catch (e: any) {
      return { success: false, error: e.message };
    } finally {
      store.setKey("loading", false);
    }
  },

  async fetchQuote(paymentMethodId?: string, promoCode?: string) {
    const state = store.get();
    if (!state.cart.length) return null;
    store.setKey("fetchingQuote", true);
    store.setKey("quoteError", null);
    try {
      const quote = await arky.reservation.getQuote({
        items: state.cart.map(s => ({
          serviceId: s.serviceId,
          from: s.from,
          to: s.to,
          providerId: s.providerId,
        })),
        paymentMethodId,
        promoCode,
      });
      store.setKey("quote", quote);
      if (quote?.availablePaymentMethods) {
        store.setKey("availablePaymentMethods", quote.availablePaymentMethods);
      }
      return quote;
    } catch (e: any) {
      store.setKey("quoteError", e.message);
      return null;
    } finally {
      store.setKey("fetchingQuote", false);
    }
  },

  async getProvidersList() {
    const state = store.get();
    if (!state.service) return [];
    const response = await arky.reservation.getProviders({ serviceId: state.service.id, limit: 100 });
    return response?.items || [];
  },

  prevStep() {
    const current = currentStepName.get();

    if (current === "review") {
      store.setKey("dateTimeConfirmed", false);
      return;
    }

    const idx = getStepIndex(current);
    for (let i = idx - 1; i >= 0; i--) {
      const step = STEP_ORDER[i];
      if (step === "datetime") {
        store.setKey("selectedSlot", null);
        store.setKey("dateTimeConfirmed", false);
        return;
      }
    }
  },

  nextStep() {
    const current = currentStepName.get();
    if (current === "datetime" && canProceed.get()) {
      store.setKey("dateTimeConfirmed", true);
    }
  },

  getServicePrice(): string {
    const state = store.get();

    // Use quote total if available (authoritative price from quote engine)
    if (state.quote?.total !== undefined) {
      return String(state.quote.total);
    }

    // Fallback to base price display before quote is fetched
    if (!state.service?.prices) return "";
    return arky.utils.getMarketPrice(state.service.prices, "us") || "0";
  },

  async addPhoneNumber() {
    const state = store.get();
    const phone = state.phoneNumber;
    if (!phone) return { success: false, error: "No phone number" };
    try {
      await arky.user.sendPhoneCode({ phone });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async phoneNumberConfirm() {
    const state = store.get();
    const code = state.verificationCode;
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

let cartInitialized = false;

store.subscribe((state, _oldValue, changedKey) => {
  if (!cartInitialized) return;
  if (changedKey === "cart" || changedKey === undefined) {
    const currentCart = cartParts.get();
    if (JSON.stringify(state.cart) !== JSON.stringify(currentCart)) {
      cartParts.set(state.cart);
    }
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

  if (arky?.utils?.tzGroups) {
    store.setKey("tzGroups", arky.utils.tzGroups);
  }

  const savedCart = cartParts.get();
  if (savedCart?.length) {
    store.setKey("cart", savedCart);
  }
  cartInitialized = true;
}

export default { store, actions, initReservationStore };
