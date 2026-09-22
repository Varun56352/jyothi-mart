'use client';
import { createContext, useContext, useState } from 'react';

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [address, setAddress] = useState('Koramangala, Bangalore');
  const [coords, setCoords] = useState({ lat: 12.9352, lng: 77.6245 });

  const setManualAddress = (newAddress, newCoords) => {
    setAddress(newAddress);
    setCoords(newCoords);
  };

  return (
    <LocationContext.Provider value={{ address, coords, setManualAddress }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);
