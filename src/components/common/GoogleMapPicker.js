'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Crosshair, Loader2, Plus, Minus, Search, MapPin } from 'lucide-react';
import { loadGoogleMapsScript } from '@/lib/googleMapsLoader';
import { reverseGeocode, getCurrentPosition } from '@/lib/geoUtils';

export default function GoogleMapPicker({
  initialCoords,
  storeCenter,
  radiusKm = 3,
  onLocationChange,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const circleRef = useRef(null);
  const warehouseMarkerRef = useRef(null);
  const userDotMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    let isMounted = true;

    loadGoogleMapsScript()
      .then((googleMaps) => {
        if (!isMounted || !mapContainerRef.current) return;

        const startCenter = initialCoords || storeCenter || { lat: 18.8256, lng: 78.9135 };

        // Clean modern Google Maps styling with deep zoom 18 for doorstep precision
        const mapOptions = {
          center: { lat: startCenter.lat, lng: startCenter.lng },
          zoom: 18,
          disableDefaultUI: true,
          zoomControl: false,
          gestureHandling: 'greedy',
          clickableIcons: false,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
            {
              featureType: 'transit',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        };

        const map = new googleMaps.Map(mapContainerRef.current, mapOptions);
        mapRef.current = map;

        // Warehouse Delivery Circle
        if (storeCenter?.lat && storeCenter?.lng) {
          const circle = new googleMaps.Circle({
            strokeColor: '#0C831F',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: '#0C831F',
            fillOpacity: 0.08,
            map,
            center: { lat: storeCenter.lat, lng: storeCenter.lng },
            radius: (Number(radiusKm) || 3) * 1000,
          });
          circleRef.current = circle;

          // Warehouse Marker
          const warehouseSvg = '<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="16" fill="#0C831F" stroke="#ffffff" stroke-width="3"/><path d="M12 15L18 10L24 15V24H12V15Z" fill="white"/><rect x="15.5" y="19" width="5" height="5" fill="#0C831F"/></svg>';

          const warehouseMarker = new googleMaps.Marker({
            position: { lat: storeCenter.lat, lng: storeCenter.lng },
            map,
            title: 'Jyothi Mart Warehouse',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(warehouseSvg),
              scaledSize: new googleMaps.Size(36, 36),
              anchor: new googleMaps.Point(18, 18),
            },
          });
          warehouseMarkerRef.current = warehouseMarker;
        }

        // Setup Dragging Listeners for the Fixed Blinkit Center Pin
        map.addListener('dragstart', () => {
          setIsDragging(true);
        });

        map.addListener('idle', async () => {
          setIsDragging(false);
          const center = map.getCenter();
          if (center && onLocationChange) {
            const lat = center.lat();
            const lng = center.lng();
            const geo = await reverseGeocode(lat, lng);
            onLocationChange(lat, lng, geo);
          }
        });

        // Setup Google Places Autocomplete on the search input
        if (searchInputRef.current && window.google?.maps?.places) {
          const autocomplete = new window.google.maps.places.Autocomplete(
            searchInputRef.current,
            {
              componentRestrictions: { country: 'in' },
              fields: ['geometry', 'formatted_address', 'name', 'address_components'],
            }
          );
          autocompleteRef.current = autocomplete;

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
              map.panTo(place.geometry.location);
              map.setZoom(17);
            }
          });
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to initialize Google Maps:', err);
        if (isMounted) {
          setLoadError(err.message || 'Error loading Google Maps');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update circle radius if props change
  useEffect(() => {
    if (circleRef.current && radiusKm) {
      circleRef.current.setRadius((Number(radiusKm) || 3) * 1000);
    }
  }, [radiusKm]);

  // Center on coordinates when initialCoords change
  useEffect(() => {
    if (mapRef.current && initialCoords?.lat && initialCoords?.lng) {
      mapRef.current.panTo({ lat: initialCoords.lat, lng: initialCoords.lng });
    }
  }, [initialCoords?.lat, initialCoords?.lng]);

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() - 1);
    }
  };

  const handleLocateMe = async () => {
    setLocatingUser(true);
    try {
      const pos = await getCurrentPosition();
      if (mapRef.current && window.google?.maps) {
        const gMaps = window.google.maps;
        mapRef.current.panTo({ lat: pos.lat, lng: pos.lng });
        mapRef.current.setZoom(18);

        // User blue GPS dot
        if (!userDotMarkerRef.current) {
          userDotMarkerRef.current = new gMaps.Marker({
            position: { lat: pos.lat, lng: pos.lng },
            map: mapRef.current,
            icon: {
              path: gMaps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
            zIndex: 10,
          });
        } else {
          userDotMarkerRef.current.setPosition({ lat: pos.lat, lng: pos.lng });
        }

        // GPS accuracy circle
        if (pos.accuracy && pos.accuracy < 1000) {
          if (!accuracyCircleRef.current) {
            accuracyCircleRef.current = new gMaps.Circle({
              map: mapRef.current,
              center: { lat: pos.lat, lng: pos.lng },
              radius: pos.accuracy,
              fillColor: '#4285F4',
              fillOpacity: 0.12,
              strokeColor: '#4285F4',
              strokeOpacity: 0.4,
              strokeWeight: 1,
            });
          } else {
            accuracyCircleRef.current.setCenter({ lat: pos.lat, lng: pos.lng });
            accuracyCircleRef.current.setRadius(pos.accuracy);
          }
        }
      }
    } catch (err) {
      console.warn('Locate error:', err);
    } finally {
      setLocatingUser(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden bg-gray-100 flex flex-col">
      {/* Google Places Search Bar floating on top of map */}
      <div className="absolute top-3 left-3 right-3 z-20">
        <div className="relative shadow-md rounded-2xl bg-white flex items-center border border-gray-200">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for area, apartment, street name..."
            className="w-full pl-10 pr-4 py-3 text-xs bg-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0C831F]"
          />
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-30 space-y-3">
          <Loader2 className="w-8 h-8 text-[#0C831F] animate-spin" />
          <p className="text-xs font-bold text-gray-700">Loading Google Maps...</p>
        </div>
      )}

      {/* Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 text-center z-30">
          <p className="text-xs text-red-600 font-bold mb-2">Google Maps failed to load</p>
          <p className="text-[11px] text-gray-500">{loadError}</p>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* THE BLINKIT CENTER PIN (Fixed dead-center of screen)       */}
      {/* ────────────────────────────────────────────────────────── */}
      {!loading && !loadError && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-20 flex flex-col items-center">
          {/* Tooltip Bubble */}
          <div
            className={`mb-1 bg-gray-900 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${
              isDragging ? '-translate-y-2 scale-105 opacity-90' : 'translate-y-0 scale-100 opacity-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Order will be delivered here</span>
          </div>

          {/* Blinkit Pin */}
          <div
            className={`transition-transform duration-200 ease-out ${
              isDragging ? '-translate-y-3 scale-110' : 'translate-y-0 scale-100'
            }`}
          >
            <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
              <path
                d="M20 0C8.954 0 0 8.954 0 20C0 32.5 17.5 46.5 19.12 47.79C19.64 48.2 20.36 48.2 20.88 47.79C22.5 46.5 40 32.5 40 20C40 8.954 31.046 0 20 0Z"
                fill="#0C831F"
              />
              <circle cx="20" cy="20" r="8" fill="white" />
              <circle cx="20" cy="20" r="4" fill="#0C831F" />
            </svg>
          </div>

          {/* Pin Drop Shadow */}
          <div
            className={`w-3.5 h-1.5 bg-black/40 rounded-full blur-[1px] transition-all duration-200 ${
              isDragging ? 'scale-50 opacity-20' : 'scale-100 opacity-70'
            }`}
          />
        </div>
      )}

      {/* Floating Controls: Locate Me + Zoom */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col space-y-2">
        {/* Locate Me (GPS) */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locatingUser}
          className="w-11 h-11 bg-white hover:bg-gray-50 text-gray-800 rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
          title="Locate me"
          aria-label="Locate me using GPS"
        >
          {locatingUser ? (
            <Loader2 className="w-5 h-5 text-[#0C831F] animate-spin" />
          ) : (
            <Crosshair className="w-5 h-5 text-[#0C831F]" />
          )}
        </button>

        {/* Zoom Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 border-b border-gray-100 cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
