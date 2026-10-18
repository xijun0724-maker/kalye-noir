// Delivery zones and windows: the single source behind the cart's estimate and
// the checkout order terms.

export interface ShippingZone {
  id: string;
  label: string; // optgroup label in the address picker
  days: string; // "5 – 7"
  fee: number;
  provinces: string[];
}

const list = (csv: string) => csv.split(', ');

export const courier = 'Delivery Parcel Express';
export const FREE_SHIPPING_THRESHOLD = 3;

export const shippingZones: ShippingZone[] = [
  {
    id: 'ncr',
    label: 'Metro Manila',
    days: '1 – 3',
    fee: 100,
    provinces: list(
      'Caloocan, Las Piñas, Makati, Malabon, Mandaluyong, Manila, Marikina, Muntinlupa, Navotas, Parañaque, Pasay, Pasig, Pateros, Quezon City, San Juan, Taguig, Valenzuela'
    ),
  },
  {
    id: 'luzon',
    label: 'Luzon',
    days: '5 – 7',
    fee: 150,
    provinces: list(
      'Abra, Albay, Apayao, Aurora, Bataan, Batanes, Batangas, Benguet, Bulacan, Cagayan, Camarines Norte, Camarines Sur, Catanduanes, Cavite, Ifugao, Ilocos Norte, Ilocos Sur, Isabela, Kalinga, La Union, Laguna, Marinduque, Masbate, Mountain Province, Nueva Ecija, Nueva Vizcaya, Occidental Mindoro, Oriental Mindoro, Pampanga, Pangasinan, Quezon, Quirino, Rizal, Romblon, Sorsogon, Tarlac, Zambales'
    ),
  },
  {
    id: 'vismin',
    label: 'Visayas / Mindanao',
    days: '10 – 12',
    fee: 200,
    provinces: list(
      'Aklan, Antique, Biliran, Bohol, Capiz, Cebu, Eastern Samar, Guimaras, Iloilo, Leyte, Negros Occidental, Negros Oriental, Northern Samar, Samar, Siquijor, Southern Leyte, Agusan del Norte, Agusan del Sur, Basilan, Bukidnon, Camiguin, Cotabato, Davao de Oro, Davao del Norte, Davao del Sur, Davao Occidental, Davao Oriental, Dinagat Islands, Lanao del Norte, Lanao del Sur, Maguindanao, Misamis Occidental, Misamis Oriental, Sarangani, Sulu, Sultan Kudarat, Surigao del Norte, Surigao del Sur, Tawi-Tawi, Zamboanga del Norte, Zamboanga del Sur, Zamboanga Sibugay'
    ),
  },
  {
    id: 'palawan',
    label: 'Palawan',
    days: '10 – 15',
    fee: 200,
    provinces: ['Palawan'],
  },
];

export const zoneById = (id: string | undefined | null) =>
  shippingZones.find((zone) => zone.id === id);

export function calculateShippingFee(zoneId: string | undefined | null, itemCount: number): number {
  if (itemCount >= FREE_SHIPPING_THRESHOLD) return 0;
  const zone = zoneById(zoneId);
  return zone ? zone.fee : 0;
}

export const deliveryLines = shippingZones.map(
  (zone) => `${zone.label}: ${zone.days} business days`
);

export const orderTerms = {
  receipt:
    'Please check your item on receipt. If something is wrong, report it right away so we can sort it out.',
  preparation:
    'Please allow 2 – 3 business days to verify and prepare your order. Weekends and holidays are not included.',
  deliveryIntro: 'Estimated delivery to your address, counted from pick-up:',
  payment: 'Please prepare the exact amount for your payment. Your order will arrive soon.',
};
