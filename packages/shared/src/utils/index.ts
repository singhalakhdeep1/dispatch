// ─── Money utilities ──────────────────────────────────────────────────────────

/**
 * Format paise integer to human-readable currency string.
 * e.g. 27900 → "₹279.00"
 */
export function formatMoney(paise: number, currency: string = "INR"): string {
    const amount = paise / 100;
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

/**
 * Convert a decimal amount (₹) to integer paise.
 * e.g. 279.0 → 27900
 */
export function rupeeToP(amount: number): number {
    return Math.round(amount * 100);
}

/**
 * Convert paise to rupees.
 */
export function paiseToRupee(paise: number): number {
    return paise / 100;
}

/**
 * Apply surge multiplier to a fee (paise) and return the new fee in paise.
 */
export function applySurge(baseFee: number, multiplier: number): number {
    return Math.round(baseFee * multiplier);
}

// ─── Geo utilities ────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two lat/lng points in kilometres.
 */
export function haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Estimated delivery time in minutes based on distance.
 * Assumes avg 20 km/h city speed + 5 min pickup buffer.
 */
export function estimateDeliveryMins(distanceKm: number): number {
    const travelMins = (distanceKm / 20) * 60;
    return Math.ceil(travelMins + 5);
}

/**
 * Calculate delivery fee in paise based on distance.
 * Base: ₹25 for ≤3 km, then ₹8/km after that.
 */
export function calculateDeliveryFee(distanceKm: number, surgeMultiplier = 1.0): number {
    const BASE_FEE_PAISE = 2500;        // ₹25
    const PER_KM_PAISE = 800;           // ₹8/km
    const FREE_DISTANCE_KM = 3;

    const extraKm = Math.max(0, distanceKm - FREE_DISTANCE_KM);
    const baseFee = BASE_FEE_PAISE + Math.round(extraKm * PER_KM_PAISE);

    return applySurge(baseFee, surgeMultiplier);
}
