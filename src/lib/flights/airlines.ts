export type AirlineCode = "6E" | "QP" | "SG" | "IX" | "IC";
export type FareTier = "basic" | "flex" | "premium";
/** paid = every seat costs extra; free-standard = standard seats free; free-any = any seat incl. extra legroom */
export type SeatPolicy = "paid" | "free-standard" | "free-any";

export interface FareFamily {
  id: string;
  name: string;
  tier: FareTier;
  /** Amount added to the flight's base fare (can be negative for cabin-only fares). */
  addOn: number;
  cabinKg: number;
  checkinKg: number;
  /** Cancellation fee more than 3 days before departure. null = non-refundable (taxes only). */
  cancelFee: number | null;
  /** Cancellation fee within 3 days of departure. */
  cancelFeeLate: number | null;
  changeFee: number;
  changeFeeLate: number;
  seat: SeatPolicy;
  meal: boolean;
  priority: boolean;
}

export interface Airline {
  code: AirlineCode;
  name: string;
  tagline: string;
  badgeClass: string;
  textClass: string;
  onTimePct: number;
  aircraft: string[];
  seatPitch: string;
  power: string;
  priceFactor: number;
  speedFactor: number;
  flightNoRange: [number, number];
  /** Pre-booked 15 kg check-in bag for fares without one. */
  bagAddOn15kg: number;
  /** Pre-booked extra 5 kg. */
  extra5kg: number;
  /** Excess baggage at the airport, per kg. */
  excessPerKg: number;
  seatFee: number;
  mealFee: number;
  refundMode: string;
  noShow: string;
  fares: FareFamily[];
}

export const AIRLINES: Airline[] = [
  {
    code: "6E",
    name: "IndiGo",
    tagline: "Largest network, frequent flights",
    badgeClass: "bg-air-6e text-air-foreground",
    textClass: "text-air-6e",
    onTimePct: 84,
    aircraft: ["A320neo", "A321neo"],
    seatPitch: '28–29"',
    power: "Select aircraft",
    priceFactor: 1.05,
    speedFactor: 1,
    flightNoRange: [2000, 6999],
    bagAddOn15kg: 1800,
    extra5kg: 2475,
    excessPerKg: 550,
    seatFee: 350,
    mealFee: 300,
    refundMode: "Original payment · 5–7 days",
    noShow: "Only statutory taxes refunded",
    fares: [
      { id: "saver", name: "Saver", tier: "basic", addOn: 0, cabinKg: 7, checkinKg: 15, cancelFee: 3500, cancelFeeLate: 4000, changeFee: 2999, changeFeeLate: 3499, seat: "paid", meal: false, priority: false },
      { id: "flexi", name: "Flexi Plus", tier: "flex", addOn: 1150, cabinKg: 7, checkinKg: 15, cancelFee: 2000, cancelFeeLate: 3000, changeFee: 0, changeFeeLate: 0, seat: "free-standard", meal: true, priority: false },
      { id: "super6e", name: "Super 6E", tier: "premium", addOn: 2850, cabinKg: 10, checkinKg: 20, cancelFee: 1000, cancelFeeLate: 1500, changeFee: 0, changeFeeLate: 0, seat: "free-any", meal: true, priority: true },
    ],
  },
  {
    code: "QP",
    name: "Akasa Air",
    tagline: "Best on-time among the big carriers",
    badgeClass: "bg-air-qp text-air-foreground",
    textClass: "text-air-qp",
    onTimePct: 88,
    aircraft: ["737 MAX 8"],
    seatPitch: '29–30"',
    power: "USB-C at every seat",
    priceFactor: 1,
    speedFactor: 1,
    flightNoRange: [1100, 1899],
    bagAddOn15kg: 1600,
    extra5kg: 2250,
    excessPerKg: 500,
    seatFee: 250,
    mealFee: 350,
    refundMode: "Original payment · 5–7 days",
    noShow: "Only statutory taxes refunded",
    fares: [
      { id: "saver", name: "Saver", tier: "basic", addOn: 0, cabinKg: 7, checkinKg: 15, cancelFee: 3000, cancelFeeLate: 3500, changeFee: 2500, changeFeeLate: 3000, seat: "paid", meal: false, priority: false },
      { id: "flexi", name: "Flexi", tier: "flex", addOn: 950, cabinKg: 7, checkinKg: 15, cancelFee: 1500, cancelFeeLate: 2500, changeFee: 0, changeFeeLate: 0, seat: "free-standard", meal: true, priority: false },
    ],
  },
  {
    code: "SG",
    name: "SpiceJet",
    tagline: "Often the lowest headline fare",
    badgeClass: "bg-air-sg text-air-foreground",
    textClass: "text-air-sg",
    onTimePct: 71,
    aircraft: ["737-800", "737 MAX 8", "Q400"],
    seatPitch: '28–30"',
    power: "Not available",
    priceFactor: 0.93,
    speedFactor: 1.03,
    flightNoRange: [100, 999],
    bagAddOn15kg: 1700,
    extra5kg: 2400,
    excessPerKg: 550,
    seatFee: 300,
    mealFee: 300,
    refundMode: "Original payment or credit shell · 7–10 days",
    noShow: "Only statutory taxes refunded",
    fares: [
      { id: "saver", name: "SpiceSaver", tier: "basic", addOn: 0, cabinKg: 7, checkinKg: 15, cancelFee: 3500, cancelFeeLate: 4000, changeFee: 3000, changeFeeLate: 3500, seat: "paid", meal: false, priority: false },
      { id: "flex", name: "SpiceFlex", tier: "flex", addOn: 1100, cabinKg: 7, checkinKg: 15, cancelFee: 2500, cancelFeeLate: 3000, changeFee: 0, changeFeeLate: 0, seat: "free-standard", meal: true, priority: false },
      { id: "max", name: "SpiceMax", tier: "premium", addOn: 2400, cabinKg: 7, checkinKg: 15, cancelFee: 1500, cancelFeeLate: 2500, changeFee: 0, changeFeeLate: 0, seat: "free-any", meal: true, priority: true },
    ],
  },
  {
    code: "IX",
    name: "Air India Express",
    tagline: "Cabin-only Lite fares & Biz seats",
    badgeClass: "bg-air-ix text-air-foreground",
    textClass: "text-air-ix",
    onTimePct: 82,
    aircraft: ["737 MAX 8", "A320neo"],
    seatPitch: '28–30"',
    power: "Select aircraft",
    priceFactor: 0.97,
    speedFactor: 1,
    flightNoRange: [1100, 2999],
    bagAddOn15kg: 1450,
    extra5kg: 2300,
    excessPerKg: 500,
    seatFee: 250,
    mealFee: 400,
    refundMode: "Original payment · 7 days",
    noShow: "Only statutory taxes refunded",
    fares: [
      { id: "lite", name: "Xpress Lite", tier: "basic", addOn: -350, cabinKg: 7, checkinKg: 0, cancelFee: 3500, cancelFeeLate: 4000, changeFee: 3000, changeFeeLate: 3500, seat: "paid", meal: false, priority: false },
      { id: "value", name: "Xpress Value", tier: "basic", addOn: 0, cabinKg: 7, checkinKg: 15, cancelFee: 3000, cancelFeeLate: 3500, changeFee: 2750, changeFeeLate: 3250, seat: "paid", meal: false, priority: false },
      { id: "flex", name: "Xpress Flex", tier: "flex", addOn: 1200, cabinKg: 7, checkinKg: 15, cancelFee: 1500, cancelFeeLate: 2500, changeFee: 0, changeFeeLate: 0, seat: "free-standard", meal: true, priority: false },
      { id: "biz", name: "Xpress Biz", tier: "premium", addOn: 3600, cabinKg: 7, checkinKg: 25, cancelFee: 1000, cancelFeeLate: 1500, changeFee: 0, changeFeeLate: 0, seat: "free-any", meal: true, priority: true },
    ],
  },
  {
    code: "IC",
    name: "Fly91",
    tagline: "Regional specialist, roomy ATR seats",
    badgeClass: "bg-air-ic text-air-foreground",
    textClass: "text-air-ic",
    onTimePct: 91,
    aircraft: ["ATR 72-600"],
    seatPitch: '30"',
    power: "Not available",
    priceFactor: 0.9,
    speedFactor: 1.22,
    flightNoRange: [3000, 3999],
    bagAddOn15kg: 1300,
    extra5kg: 2000,
    excessPerKg: 450,
    seatFee: 200,
    mealFee: 250,
    refundMode: "Original payment · 7 days",
    noShow: "Only statutory taxes refunded",
    fares: [
      { id: "saver", name: "Saver", tier: "basic", addOn: 0, cabinKg: 7, checkinKg: 15, cancelFee: 2500, cancelFeeLate: 3000, changeFee: 2000, changeFeeLate: 2500, seat: "free-standard", meal: false, priority: false },
      { id: "flexi", name: "Flexi", tier: "flex", addOn: 800, cabinKg: 7, checkinKg: 20, cancelFee: 1000, cancelFeeLate: 2000, changeFee: 0, changeFeeLate: 0, seat: "free-any", meal: true, priority: false },
    ],
  },
];

export function getAirline(code: string): Airline | undefined {
  return AIRLINES.find((a) => a.code === code);
}
