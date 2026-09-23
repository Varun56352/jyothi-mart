'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, MapPin, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useLocation } from '@/context/LocationContext';

// Dynamically import GoogleMapPicker to prevent SSR issues
const GoogleMapPicker = dynamic(() => import('./GoogleMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-gray-100 flex flex-col items-center justify-center space-y-2">
      <Loader2 className="w-8 h-8 text-[#0C831F] animate-spin" />
      <span className="text-xs font-bold text-gray-500">Loading Google Maps...</span>
    </div>
  ),
});

export default function LocationPickerModal({ isOpen, onClose }) {
  const {
    coords,
    storeInfo,
    isServiceable,
    distanceKm,
    deliveryTimeEstimate,
    selectLocation,
    checkServiceability,
  } = useLocation();

  const [localCoords, setLocalCoords] = useState(coords);
  const [localServiceable, setLocalServiceable] = useState(isServiceable);
  const [localDistance, setLocalDistance] = useState(distanceKm);
  const [localEta, setLocalEta] = useState(deliveryTimeEstimate);
  const [localAddress, setLocalAddress] = useState('');
  const [localLocality, setLocalLocality] = useState('');
  const [localCity, setLocalCity] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalCoords(coords);
      setLocalServiceable(isServiceable);
      setLocalDistance(distanceKm);
      setLocalEta(deliveryTimeEstimate);
    }
  }, [isOpen, coords, isServiceable, distanceKm, deliveryTimeEstimate]);

  const handleLocationChange = useCallback(
    (lat, lng, geo) => {
      const newCoords = { lat, lng };
      setLocalCoords(newCoords);
      if (geo) {
        setLocalAddress(geo.short || geo.formatted);
        setLocalLocality(geo.locality || '');
        setLocalCity(geo.city || '');
      }
      const { distance, serviceable, eta } = checkServiceability(newCoords);
      setLocalDistance(distance);
      setLocalServiceable(serviceable);
      setLocalEta(eta);
    },
    [checkServiceability]
  );

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
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shadow-2xs z-30">
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 leading-tight">Select Delivery Location</h2>
          <p className="text-[11px] text-gray-500">Drag map to pin your exact doorstep</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Real Google Map with Blinkit Center Pin */}
      <div className="flex-1 relative">
        <GoogleMapPicker
          initialCoords={localCoords}
          storeCenter={storeCenter}
          radiusKm={radiusKm}
          onLocationChange={handleLocationChange}
        />
      </div>

      {/* Bottom Blinkit Delivery Details Card */}
      <div className="px-4 py-3.5 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-30 safe-area-pb">
        {localCoords ? (
          <>
            {/* Formatted Address */}
            <div className="flex items-start gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-full bg-green-50 text-[#0C831F] flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-gray-900 truncate">
                  {localLocality || 'Selected Location'}
                </h4>
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                  {localAddress || `${localCoords.lat.toFixed(5)}, ${localCoords.lng.toFixed(5)}`}
                </p>
              </div>
            </div>

            {/* Serviceability Banner */}
            {localServiceable ? (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-[#0C831F] flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#0C831F]">Delivering to your location</p>
                  <p className="text-[11px] text-green-700">
                    {localDistance !== null && localDistance !== undefined ? `${localDistance} km away` : ''}
                    {localEta ? ` · Delivery in ${localEta}` : ' · Delivery in 10-15 mins'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-700">Outside Delivery Zone</p>
                  <p className="text-[11px] text-red-600">
                    {localDistance ? `${localDistance} km away — ` : ''}We deliver within {radiusKm} km of Jyothi Mart
                  </p>
                </div>
              </div>
            )}

            {/* Confirm Location Button */}
            <button
              onClick={handleConfirm}
              disabled={!localServiceable}
              className={`w-full py-3.5 rounded-2xl text-sm font-bold transition active:scale-[0.98] shadow-md flex items-center justify-center gap-2 ${
                localServiceable
                  ? 'bg-[#0C831F] text-white hover:bg-green-700 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>{localServiceable ? 'Confirm & Set Location' : 'Choose a Serviceable Location'}</span>
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 text-[#0C831F] animate-spin mx-auto mb-1.5" />
            <p className="text-xs text-gray-500 font-medium">Detecting your location on Google Maps...</p>
          </div>
        )}
      </div>
    </div>
  );
}
