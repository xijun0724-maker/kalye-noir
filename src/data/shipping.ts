// Delivery zones, windows and fees — the single source behind the cart's
// shipping estimate and the checkout order terms.

export interface ShippingZone {
  id: string;
  label: string; // optgroup label in the estimate / address picker
  addressLabel: string; // wording used on the order terms
  days: string; // "5 – 7"
  firstKg: number; // centavos, first kilogram
  perKg: number; // centavos, each additional kilogram
  provinces: string[];
}

const list = (csv: string) => csv.split(', ');

export const courier = 'Delivery Parcel Express';

// Rough weight of one packed tee. Bump it if you start shipping heavier goods.
export const ITEM_WEIGHT_KG = 0.3;

// ponytail: seed rates, NOT DPE's published card — replace with their real
// per-zone rates when you have them. Everything else reads from here.
export const shippingZones: ShippingZone[] = [
  {
    id: 'ncr',
    label: 'Metro Manila',
    addressLabel: 'METRO MANILA',
    days: '1 – 3',
    firstKg: 9900,
    perKg: 3000,
    provinces: list(
      'Caloocan, Las Piñas, Makati, Malabon, Mandaluyong, Manila, Marikina, Muntinlupa, Navotas, Parañaque, Pasay, Pasig, Pateros, Quezon City, San Juan, Taguig, Valenzuela'
    ),
  },
  {
    id: 'luzon',
    label: 'Luzon',
    addressLabel: 'LUZON PROVINCIAL',
    days: '5 – 7',
    firstKg: 14900,
    perKg: 4000,
    provinces: list(
      'Abra, Albay, Apayao, Aurora, Bataan, Batanes, Batangas, Benguet, Bulacan, Cagayan, Camarines Norte, Camarines Sur, Catanduanes, Cavite, Ifugao, Ilocos Norte, Ilocos Sur, Isabela, Kalinga, La Union, Laguna, Marinduque, Masbate, Mountain Province, Nueva Ecija, Nueva Vizcaya, Occidental Mindoro, Oriental Mindoro, Pampanga, Pangasinan, Quezon, Quirino, Rizal, Romblon, Sorsogon, Tarlac, Zambales'
    ),
  },
  {
    id: 'vismin',
    label: 'Visayas / Mindanao',
    addressLabel: 'VISAYAS/MINDANAO',
    days: '10 – 12',
    firstKg: 19900,
    perKg: 5000,
    provinces: list(
      'Aklan, Antique, Biliran, Bohol, Capiz, Cebu, Eastern Samar, Guimaras, Iloilo, Leyte, Negros Occidental, Negros Oriental, Northern Samar, Samar, Siquijor, Southern Leyte, Agusan del Norte, Agusan del Sur, Basilan, Bukidnon, Camiguin, Cotabato, Davao de Oro, Davao del Norte, Davao del Sur, Davao Occidental, Davao Oriental, Dinagat Islands, Lanao del Norte, Lanao del Sur, Maguindanao, Misamis Occidental, Misamis Oriental, Sarangani, Sulu, Sultan Kudarat, Surigao del Norte, Surigao del Sur, Tawi-Tawi, Zamboanga del Norte, Zamboanga del Sur, Zamboanga Sibugay'
    ),
  },
  {
    id: 'palawan',
    label: 'Palawan',
    addressLabel: 'PALAWAN',
    days: '10 – 15',
    firstKg: 22900,
    perKg: 5500,
    provinces: ['Palawan'],
  },
];

export const zoneById = (id: string | undefined | null) =>
  shippingZones.find((zone) => zone.id === id);

// Whole kilograms, rounded up — couriers bill in kg brackets, not fractions.
// Grams first: plain 10 * 0.3 floats to 3.0000000000000004 and would bill 4 kg.
export const parcelKg = (itemCount: number) => {
  const grams = Math.round(Math.max(itemCount, 1) * ITEM_WEIGHT_KG * 1000);
  return Math.max(1, Math.ceil(grams / 1000));
};

export function estimateFee(
  zoneId: string | undefined | null,
  itemCount: number
): number | null {
  const zone = zoneById(zoneId);
  if (!zone || itemCount < 1) return null;
  return zone.firstKg + (parcelKg(itemCount) - 1) * zone.perKg;
}

export const deliveryLines = shippingZones.map(
  (zone) => `* ${zone.days} Business days for ${zone.addressLabel} address`
);

export const orderTerms = {
  receipt:
    'NOTE: Please check your item upon receipt. If you notice any issues, kindly report them to us immediately so we can assist you promptly.',
  preparation:
    'Please allow our team 2 - 3 BUSINESS DAYS, weekends and holidays NOT included to verify and prepare the orders.',
  deliveryIntro: '→ NOTE that delivery to your address (from date of pick-up) would be:',
  payment: '* Please prepare exact amount for your payment. Your order will arrive soon.',
};
