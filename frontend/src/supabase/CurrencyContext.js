// src/context/CurrencyContext.js
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const CurrencyContext = createContext();

const countryToCurrency = {
  US: "USD",
  IN: "INR",
  GB: "GBP",
  EU: "EUR",
  CA: "CAD",
  AU: "AUD",
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const response = await axios.get("https://ipapi.co/json/");
        const countryCode = response.data.country_code;
        const detectedCurrency = countryToCurrency[countryCode] || "USD";
        setCurrency(detectedCurrency);
        localStorage.setItem("currency", detectedCurrency);
      } catch (error) {
        console.error("Failed to detect country:", error);
        setCurrency("USD");
      } finally {
        setLoading(false);
      }
    };

    const storedCurrency = localStorage.getItem("currency");
    if (storedCurrency) {
      setCurrency(storedCurrency);
      setLoading(false);
    } else {
      detectCurrency();
    }
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);