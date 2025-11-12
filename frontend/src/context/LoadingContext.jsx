import React, { createContext, useContext, useState } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';

const LoadingContext = createContext(undefined);

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ setLoading }}>
      {children}
      <LoadingOverlay isLoading={loading} />
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};