/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Calculate total route distance through multiple cities
 * @param {Array} cities - Array of city objects with latitude and longitude
 * @returns {number} Total distance in kilometers, rounded to nearest integer
 */
const calculateRouteDistance = (cities) => {
  if (!cities || cities.length < 2) {
    return 0;
  }

  // Road distance coefficient - roads are typically 25-30% longer than straight line
  const ROAD_COEFFICIENT = 1.3;

  let totalDistance = 0;

  for (let i = 0; i < cities.length - 1; i++) {
    const city1 = cities[i];
    const city2 = cities[i + 1];

    if (city1.latitude && city1.longitude && city2.latitude && city2.longitude) {
      totalDistance += haversineDistance(
        city1.latitude,
        city1.longitude,
        city2.latitude,
        city2.longitude
      );
    }
  }

  // Apply road coefficient for more realistic distance
  return Math.round(totalDistance * ROAD_COEFFICIENT);
};

export { haversineDistance, calculateRouteDistance };
