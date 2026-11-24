export interface Airport {
  code: string;
  city: string;
  name: string;
}

export const AIRPORTS: Airport[] = [
  { code: "DEL", city: "New Delhi", name: "Indira Gandhi Intl" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj Intl" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda Intl" },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi Intl" },
  { code: "MAA", city: "Chennai", name: "Chennai Intl" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose Intl" },
  { code: "GOX", city: "Goa", name: "Manohar Intl (Mopa)" },
  { code: "PNQ", city: "Pune", name: "Pune Intl" },
  { code: "AMD", city: "Ahmedabad", name: "Sardar Vallabhbhai Patel Intl" },
  { code: "COK", city: "Kochi", name: "Cochin Intl" },
  { code: "JAI", city: "Jaipur", name: "Jaipur Intl" },
  { code: "LKO", city: "Lucknow", name: "Chaudhary Charan Singh Intl" },
];

export function getAirport(code: string): Airport {
  return AIRPORTS.find((a) => a.code === code) ?? { code, city: code, name: code };
}
