'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoreInfo } from '@/lib/api';
import { calculateDistanceKm, estimateDeliveryTime, getCurrentPosition, reverseGeocode } from '@/lib/geoUtils';

const LocationContext = createContext();

const STORAGE_KEY = 'jm_user_location';

function loadSavedLocation() {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveLocation(data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function LocationProvider({ children }) {
  const [address, setAddress] = useState('Detecting location...');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [coords, setCoords] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [isServiceable, setIsServiceable] = useState(true);
  const [deliveryTimeEstimate, setDeliveryTimeEstimate] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Store info from backend
  const [storeInfo, setStoreInfo] = useState(null);

  // Fetch store info on mount
  useEffect(() => {
    getStoreInfo()
      .then((res) => {
        const data = res.data?.data || res.data || {};
        setStoreInfo(data);
      })
      .catch((err) => {
        console.error('Failed to load store info:', err);
      });
  }, []);

  // Load saved location on mount
  useEffect(() => {
    const saved = loadSavedLocation();
    if (saved) {
      setAddress(saved.address || 'Detecting location...');
      setLocality(saved.locality || '');
      setCity(saved.city || '');
      setCoords(saved.coords || null);
      setDistanceKm(saved.distanceKm ?? null);
      setIsServiceable(saved.isServiceable !== false);
      setDeliveryTimeEstimate(saved.deliveryTimeEstimate || '');
    }
  }, []);

  const checkServiceability = useCallback(
    (customerCoords) => {
      if (!storeInfo?.deliveryZone?.center?.lat || !customerCoords?.lat) {
        return { distance: null, serviceable: true, eta: '' };
      }
      const storeLat = storeInfo.deliveryZone.center.lat;
      const storeLng = storeInfo.deliveryZone.center.lng;
      const maxRadius = storeInfo.deliveryZone.radiusKm || 3;

      const dist = calculateDistanceKm(storeLat, storeLng, customerCoords.lat, customerCoords.lng);
      const serviceable = dist <= maxRadius;
      const eta = serviceable ? estimateDeliveryTime(dist) : '';

      return { distance: dist, serviceable, eta };
    },
    [storeInfo]
  );

  const selectLocation = useCallback(
    (newCoords, addressDetails = {}) => {
      setCoords(newCoords);
      const addrStr = addressDetails.short || addressDetails.formatted || addressDetails.address || 'Selected location';
      setAddress(addrStr);
      setLocality(addressDetails.locality || '');
      setCity(addressDetails.city || '');

      const { distance, serviceable, eta } = checkServiceability(newCoords);
      setDistanceKm(distance);
      setIsServiceable(serviceable);
      setDeliveryTimeEstimate(eta);

      saveLocation({
        address: addrStr,
        locality: addressDetails.locality || '',
        city: addressDetails.city || '',
        coords: newCoords,
        distanceKm: distance,
        isServiceable: serviceable,
        deliveryTimeEstimate: eta,
      });
    },
    [checkServiceability]
  );

  const detectCurrentLocation = useCallback(async () => {
    setLoadingLocation(true);
    try {
      const pos = await getCurrentPosition();
      const geoResult = await reverseGeocode(pos.lat, pos.lng);
      selectLocation({ lat: pos.lat, lng: pos.lng }, {
        formatted: geoResult.formatted,
        short: geoResult.short,
        locality: geoResult.locality,
        city: geoResult.city,
      });
      return { coords: pos, address: geoResult };
    } catch (err) {
      throw err;
    } finally {
      setLoadingLocation(false);
    }
  }, [selectLocation]);

  // Recalculate serviceability when storeInfo loads
  useEffect(() => {
    if (storeInfo && coords) {
      const { distance, serviceable, eta } = checkServiceability(coords);
      setDistanceKm(distance);
      setIsServiceable(serviceable);
      setDeliveryTimeEstimate(eta);
    }
  }, [storeInfo, coords, checkServiceability]);

  return (
    <LocationContext.Provider
      value={{
        address,
        locality,
        city,
        coords,
        distanceKm,
        isServiceable,
        deliveryTimeEstimate,
        loadingLocation,
        storeInfo,
        detectCurrentLocation,
        selectLocation,
        checkServiceability,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);
