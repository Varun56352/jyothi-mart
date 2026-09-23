'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function LeafletMap({ customerCoords, storeCenter, radiusKm = 3, onDragEnd }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return; // already initialized
    if (!mapRef.current) return;

    const defaultCenter = customerCoords || storeCenter || { lat: 12.9352, lng: 77.6245 };
    const map = L.map(mapRef.current, {
      center: [defaultCenter.lat, defaultCenter.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control to bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Store marker + radius circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !storeCenter?.lat) return;

    // Remove old
    if (storeMarkerRef.current) map.removeLayer(storeMarkerRef.current);
    if (radiusCircleRef.current) map.removeLayer(radiusCircleRef.current);

    // Store marker (green circle)
    const storeIcon = L.divIcon({
      className: 'custom-store-marker',
      html: '<div style="width:20px;height:20px;background:#0C831F;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    storeMarkerRef.current = L.marker([storeCenter.lat, storeCenter.lng], {
      icon: storeIcon,
      interactive: false,
    })
      .addTo(map)
      .bindTooltip('Jyothi Mart', { permanent: false, direction: 'top', offset: [0, -12] });

    // Delivery radius circle
    radiusCircleRef.current = L.circle([storeCenter.lat, storeCenter.lng], {
      radius: radiusKm * 1000,
      color: '#0C831F',
      fillColor: '#0C831F',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '6 4',
    }).addTo(map);
  }, [storeCenter?.lat, storeCenter?.lng, radiusKm]);

  // Customer marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (customerMarkerRef.current) map.removeLayer(customerMarkerRef.current);

    if (!customerCoords?.lat) return;

    const customerIcon = L.divIcon({
      className: 'custom-customer-marker',
      html: '<div style="display:flex;flex-direction:column;align-items:center;"><div style="width:14px;height:14px;background:#EF4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div><div style="width:2px;height:8px;background:#EF4444;margin-top:-2px;"></div></div>',
      iconSize: [14, 24],
      iconAnchor: [7, 24],
    });

    customerMarkerRef.current = L.marker([customerCoords.lat, customerCoords.lng], {
      icon: customerIcon,
      draggable: true,
    }).addTo(map);

    customerMarkerRef.current.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      if (onDragEnd) onDragEnd(lat, lng);
    });

    map.setView([customerCoords.lat, customerCoords.lng], map.getZoom() < 14 ? 14 : map.getZoom());
  }, [customerCoords?.lat, customerCoords?.lng, onDragEnd]);

  return (
    <div ref={mapRef} className="w-full h-full" style={{ minHeight: '250px' }} />
  );
}
