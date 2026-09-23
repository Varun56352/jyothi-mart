/**
 * Haversine distance between two coordinates in km
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Estimate delivery time based on distance
 */
export function estimateDeliveryTime(distanceKm) {
  if (distanceKm <= 1) return '8-10 mins';
  if (distanceKm <= 2) return '10-15 mins';
  if (distanceKm <= 3) return '15-20 mins';
  if (distanceKm <= 5) return '20-30 mins';
  return '30-45 mins';
}

/**
 * Get current position via browser Geolocation API
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        const messages = {
          1: 'Location permission denied. Please enable location access in your browser settings.',
          2: 'Location unavailable. Please check your device GPS.',
          3: 'Location request timed out. Please try again.',
        };
        reject(new Error(messages[error.code] || 'Unable to get your location'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000, ...options }
    );
  });
}

/**
 * Reverse geocode coordinates to address using Nominatim (free, no API key)
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (!data || data.error) {
      return { formatted: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, locality: '', city: '' };
    }
    const addr = data.address || {};
    const locality =
      addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.county || '';
    const city = addr.city || addr.state_district || addr.state || '';
    const road = addr.road || addr.pedestrian || '';
    const parts = [road, locality, city].filter(Boolean);
    return {
      formatted: data.display_name || parts.join(', '),
      locality,
      city,
      road,
      short: parts.slice(0, 2).join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
  } catch (err) {
    console.error('Reverse geocode error:', err);
    return { formatted: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, locality: '', city: '' };
  }
}

/**
 * Search for places using Nominatim
 */
export async function searchPlaces(query) {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.map((place) => ({
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      displayName: place.display_name,
      short: place.display_name?.split(',').slice(0, 3).join(', '),
    }));
  } catch (err) {
    console.error('Place search error:', err);
    return [];
  }
}
