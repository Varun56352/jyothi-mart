'use client';

let googleMapsPromise = null;

export function loadGoogleMapsScript(apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not defined'));
  
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  const key = apiKey || 'AIzaSyCoTlnSpjVx1nAv70I_SWmPN0T5zCusb68';

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src*=maps.googleapis.com]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.google.maps));
        existing.addEventListener('error', (e) => reject(e));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=' + key + '&libraries=places,geometry';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps script loaded but window.google.maps not found'));
        }
      };
      script.onerror = () => {
        googleMapsPromise = null;
        reject(new Error('Failed to load Google Maps script'));
      };
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}
