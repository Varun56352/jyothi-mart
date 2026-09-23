'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Crosshair, MapPin, Search, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useLocation } from '@/context/LocationContext';
import { searchPlaces, reverseGeocode } from '@/lib/geoUtils';

// Dynamically import the map to avoid SSR issues with Leaflet
const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false, loading: () => <div className="w-full h-64 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div> });

export default function LocationPickerModal({ isOpen, onClose }) {
  const {
    coords,
    storeInfo,
    isServiceable,
    distanceKm,
    deliveryTimeEstimate,
    loadingLocation,
    detectCurrentLocation,
    selectLocation,
    checkServiceability,
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [localCoords, setLocalCoords] = useState(coords);
  const [localServiceable, setLocalServiceable] = useState(isServiceable);
  const [localDistance, setLocalDistance] = useState(distanceKm);
  const [localEta, setLocalEta] = useState(deliveryTimeEstimate);
  const [localAddress, setLocalAddress] = useState('');
  const [localLocality, setLocalLocality] = useState('');
  const [localCity, setLocalCity] = useState('');
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setLocalCoords(coords);
      setLocalServiceable(isServiceable);
      setLocalDistance(distanceKm);
      setLocalEta(deliveryTimeEstimate);
      setGpsError('');
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, coords, isServiceable, distanceKm, deliveryTimeEstimate]);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchPlaces(q);
      setSearchResults(results);
      setSearching(false);
    }, 400);
  };

  const handleSelectSearchResult = async (place) => {
    setSearchResults([]);
    setSearchQuery('');
    const newCoords = { lat: place.lat, lng: place.lng };
    setLocalCoords(newCoords);
    const geo = await reverseGeocode(place.lat, place.lng);
    setLocalAddress(geo.short || geo.formatted);
    setLocalLocality(geo.locality);
    setLocalCity(geo.city);
    const { distance, serviceable, eta } = checkServiceability(newCoords);
    setLocalDistance(distance);
    setLocalServiceable(serviceable);
    setLocalEta(eta);
  };

  const handleDetectGPS = async () => {
    setGpsError('');
    try {
      const result = await detectCurrentLocation();
      setLocalCoords(result.coords);
      setLocalAddress(result.address.short || result.address.formatted);
      setLocalLocality(result.address.locality);
      setLocalCity(result.address.city);
      const { distance, serviceable, eta } = checkServiceability(result.coords);
      setLocalDistance(distance);
      setLocalServiceable(serviceable);
      setLocalEta(eta);
    } catch (err) {
      setGpsError(err.message);
    }
  };

  const handleMapDrag = useCallback(async (lat, lng) => {
    const newCoords = { lat, lng };
    setLocalCoords(newCoords);
    const geo = await reverseGeocode(lat, lng);
    setLocalAddress(geo.short || geo.formatted);
    setLocalLocality(geo.locality);
    setLocalCity(geo.city);
    const { distance, serviceable, eta } = checkServiceability(newCoords);
    setLocalDistance(distance);
    setLocalServiceable(serviceable);
    setLocalEta(eta);
  }, [checkServiceability]);

  const handleConfirm = () => {
    if (localCoords) {
      selectLocation(localCoords, {
        short: localAddress,
        formatted: localAddress,
        locality: localLocality,
        city: localCity,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  const storeCenter = storeInfo?.deliveryZone?.center;
  const radiusKm = storeInfo?.deliveryZone?.radiusKm || 3;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">Choose delivery location</h2>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer">
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* GPS + Search */}
      <div className="px-4 py-3 space-y-2.5 bg-gray-50 border-b border-gray-200">
        <button
          onClick={handleDetectGPS}
          disabled={loadingLocation}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border-2 border-[#0C831F] text-[#0C831F] rounded-xl text-xs font-bold hover:bg-green-50 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {loadingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
          <span>{loadingLocation ? 'Detecting...' : 'Use Current Location'}</span>
        </button>

        {gpsError && (
          <p className="text-[11px] text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
            {gpsError}
          </p>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search for area, street name..."
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#0C831F]"
          />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
            {searchResults.map((place, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSearchResult(place)}
                className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-700 line-clamp-2">{place.short || place.displayName}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative min-h-[200px]">
        <LeafletMap
          customerCoords={localCoords}
          storeCenter={storeCenter}
          radiusKm={radiusKm}
          onDragEnd={handleMapDrag}
        />
      </div>

      {/* Bottom Status Card */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] safe-area-pb">
        {localCoords ? (
          <>
            {localAddress && (
              <div className="flex items-start gap-2 mb-2.5">
                <MapPin className="w-4 h-4 text-[#0C831F] flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-gray-800 line-clamp-2">{localAddress}</p>
              </div>
            )}

            {localServiceable ? (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-[#0C831F] flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#0C831F]">Delivery available</p>
                  <p className="text-[11px] text-green-700">
                    {localDistance ? `${localDistance} km away` : ''}{localEta ? ` · Est. ${localEta}` : ''}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-700">Outside delivery area</p>
                  <p className="text-[11px] text-red-600">
                    {localDistance ? `${localDistance} km away — ` : ''}We deliver within {radiusKm} km
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={!localServiceable}
              className={`w-full py-3 rounded-xl text-sm font-bold transition active:scale-[0.98] ${
                localServiceable
                  ? 'bg-[#0C831F] text-white hover:bg-green-700 shadow-md cursor-pointer'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {localServiceable ? 'Confirm Location' : 'Location not serviceable'}
            </button>
          </>
        ) : (
          <p className="text-center text-xs text-gray-500 py-4">
            Use GPS or search to select your delivery location
          </p>
        )}
      </div>
    </div>
  );
}
