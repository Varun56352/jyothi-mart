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

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCoTlnSpjVx1nAv70I_SWmPN0T5zCusb68';

/**
 * Reverse geocode coordinates to address (prioritizes Google Maps Geocoder, falls back to Nominatim)
 */
export async function reverseGeocode(lat, lng) {
  // 1. Try Google Maps JS Geocoder if loaded in window
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const res = await geocoder.geocode({ location: { lat, lng } });
      if (res.results && res.results[0]) {
        const place = res.results[0];
        let sublocality = '';
        let locality = '';
        let city = '';
        let route = '';

        place.address_components.forEach((c) => {
          if (c.types.includes('sublocality_level_1') || c.types.includes('sublocality')) {
            sublocality = c.long_name;
          }
          if (c.types.includes('locality')) {
            city = c.long_name;
          }
          if (c.types.includes('administrative_area_level_2')) {
            locality = c.long_name;
          }
          if (c.types.includes('route')) {
            route = c.long_name;
          }
        });

        const short =
          [route || sublocality, city || locality].filter(Boolean).join(', ') ||
          place.formatted_address.split(',').slice(0, 2).join(',');

        return {
          formatted: place.formatted_address,
          short: short || place.formatted_address,
          locality: sublocality || locality || city,
          city: city || locality,
        };
      }
    } catch (e) {
      // Fall through to HTTP
    }
  }

  // 2. Try Google Maps HTTP Geocode
  if (GOOGLE_API_KEY) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]) {
        const place = data.results[0];
        let sublocality = '';
        let locality = '';
        let city = '';
        place.address_components?.forEach((c) => {
          if (c.types.includes('sublocality')) sublocality = c.long_name;
          if (c.types.includes('locality')) city = c.long_name;
          if (c.types.includes('administrative_area_level_2')) locality = c.long_name;
        });
        const short =
          [sublocality, city || locality].filter(Boolean).join(', ') ||
          place.formatted_address.split(',').slice(0, 2).join(',');
        return {
          formatted: place.formatted_address,
          short: short || place.formatted_address,
          locality: sublocality || locality || city,
          city: city || locality,
        };
      }
    } catch (err) {
      // Fall through to Nominatim
    }
  }

  // 3. Fallback to Nominatim
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
      short:
        parts.slice(0, 2).join(', ') ||
        data.display_name?.split(',').slice(0, 2).join(',') ||
        `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
  } catch (err) {
    console.error('Reverse geocode error:', err);
    return { formatted: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, locality: '', city: '' };
  }
}

/**
 * Search for places using Google Places Autocomplete or Nominatim
 */
export async function searchPlaces(query) {
  if (!query || query.length < 3) return [];

  // Try Google Places Autocomplete service if loaded in window
  if (typeof window !== 'undefined' && window.google?.maps?.places?.AutocompleteService) {
    try {
      const service = new window.google.maps.places.AutocompleteService();
      const predictions = await new Promise((resolve) => {
        service.getPlacePredictions(
          { input: query, componentRestrictions: { country: 'in' } },
          (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results);
            } else {
              resolve([]);
            }
          }
        );
      });

      if (predictions.length > 0) {
        // Geocode each prediction to get lat/lng
        const geocoder = new window.google.maps.Geocoder();
        const results = await Promise.all(
          predictions.slice(0, 5).map(async (pred) => {
            try {
              const geo = await geocoder.geocode({ placeId: pred.place_id });
              const loc = geo.results?.[0]?.geometry?.location;
              return {
                lat: loc?.lat() || 0,
                lng: loc?.lng() || 0,
                displayName: pred.description,
                short: pred.structured_formatting?.main_text || pred.description.split(',')[0],
              };
            } catch {
              return null;
            }
          })
        );
        const filtered = results.filter((r) => r && r.lat !== 0);
        if (filtered.length > 0) return filtered;
      }
    } catch (e) {
      // Fall through to Nominatim
    }
  }

  // Fallback to Nominatim
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
