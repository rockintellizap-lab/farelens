import { describe, expect, it } from "vitest";

import { getAirline } from "./airlines";
import { generateFlights, type FareOption, type Flight } from "./generate";
import { addOnsForNeeds, bestFareForNeeds, bestIndexes, refundIfCancelled, trueCost } from "./pricing";

function flightFor(code: string, basePrice = 5000): Flight {
  const airline = getAirline(code)!;
  return { id: `${code}1`, airline, flightNo: `${code} 1`, from: "DEL", to: "BOM", date: "2030-01-10", departMin: 600, arriveMin: 730, durationMin: 130, stops: 0, via: null, layoverMin: 0, aircraft: "A320", basePrice, seatsLeft: null };
}
function option(code: string, fareId: string, basePrice = 5000): FareOption {
  const flight = flightFor(code, basePrice);
  const fare = flight.airline.fares.find((f) => f.id === fareId)!;
  return { flight, fare, price: basePrice + fare.addOn };
}

const noNeeds = { bag: false, seat: false, meal: false };

describe("true cost", () => {
  it("adds the 15 kg bag fee to a cabin-only fare when the traveller needs a bag", () => {
    const lite = option("IX", "lite");
    expect(trueCost(lite, { ...noNeeds, bag: true })).toBe(lite.price + 1450);
  });

  it("adds nothing for a bag when the fare already includes check-in baggage", () => {
    const saver = option("6E", "saver");
    expect(trueCost(saver, { ...noNeeds, bag: true })).toBe(saver.price);
  });

  it("adds the seat fee only when seats are paid on that fare", () => {
    expect(addOnsForNeeds(getAirline("QP")!, option("QP", "saver").fare, { ...noNeeds, seat: true })).toEqual([{ label: "Seat of your choice", amount: 250 }]);
    expect(addOnsForNeeds(getAirline("QP")!, option("QP", "flexi").fare, { ...noNeeds, seat: true })).toEqual([]);
  });

  it("picks Xpress Value over Xpress Lite once a check-in bag is needed", () => {
    expect(bestFareForNeeds(flightFor("IX"), { ...noNeeds, bag: true }).fare.id).toBe("value");
    expect(bestFareForNeeds(flightFor("IX"), noNeeds).fare.id).toBe("lite");
  });
});

describe("refund if cancelled", () => {
  it("returns fare minus the cancellation fee", () => {
    expect(refundIfCancelled(option("6E", "saver", 5000))).toBe(1500);
    expect(refundIfCancelled(option("6E", "saver", 5000), true)).toBe(1000);
  });

  it("caps the fee at the base fare so taxes always come back", () => {
    expect(refundIfCancelled(option("SG", "saver", 2000))).toBe(360);
  });
});

describe("best-in-row highlighting", () => {
  it("highlights the lowest value for min rows", () => {
    expect([...bestIndexes([3000, 2500, 3500], "min")]).toEqual([1]);
  });
  it("highlights nothing when every option ties", () => {
    expect(bestIndexes([7, 7, 7], "max").size).toBe(0);
  });
});

describe("flight generation", () => {
  it("returns flights from all 5 airlines and is stable for the same search", () => {
    const a = generateFlights("DEL", "BOM", "2030-01-10");
    const b = generateFlights("DEL", "BOM", "2030-01-10");
    expect(new Set(a.map((f) => f.airline.code)).size).toBe(5);
    expect(a.map((f) => f.id)).toEqual(b.map((f) => f.id));
  });
});
