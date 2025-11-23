// src/supabase/CurrencyContext.js
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

const BASE_CURRENCY = "INR";

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState("USD");

  // public loading flag used around the app
  const [loading, setLoading] = useState(true);

  // internal detection + FX loading
  const [detecting, setDetecting] = useState(true);
  const [fxLoading, setFxLoading] = useState(false);

  const [rates, setRates] = useState({ [BASE_CURRENCY]: 1 });
  const [lastFetched, setLastFetched] = useState(null);

  // --- Detect currency from IP or localStorage ---
  useEffect(() => {
    localStorage.removeItem("currency");
    const detectCurrency = async () => {
      try {
        setDetecting(true);
        const response = await axios.get("https://ipapi.co/json/");
        const countryCode = response.data.country_code;
        const detectedCurrency = countryToCurrency[countryCode] || "INR";
        setCurrency(detectedCurrency);
        localStorage.setItem("currency", detectedCurrency);
      } catch (error) {
        setCurrency("INR");
      } finally {
        setDetecting(false);
      }
    };

    const storedCurrency = localStorage.getItem("currency");
    if (storedCurrency) {
      setCurrency(storedCurrency);
      setDetecting(false);
    } else {
      detectCurrency();
    }
  }, []);

  // --- Fetch FX rate from INR -> selected currency ---
  useEffect(() => {
    if (detecting) return;

    // If user currency is base INR, no FX needed
    if (!currency || currency === BASE_CURRENCY) {
      setFxLoading(false);
      return;
    }

    const now = Date.now();
    // cache for 60 minutes
    if (lastFetched && now - lastFetched < 60 * 60 * 1000 && rates[currency]) {
      setFxLoading(false);
      return;
    }

    const fetchRate = async () => {
      try {
        setFxLoading(true);
        const res = await axios.get("https://api.frankfurter.app/latest", {
          params: {
            from: BASE_CURRENCY,
            to: currency,
          }
        });

        const rate = res?.data?.rates?.[currency];
        if (rate) {
          setRates((prev) => ({
            ...prev,
            [currency]: rate,
          }));
          setLastFetched(Date.now());
        }
      } catch (err) {
        const fallbackRates = {
          USD: 0.01190,
          EUR: 0.01120,
          GBP: 0.00980,
          CAD: 0.01650,
          AUD: 0.01810,
        };
        if (fallbackRates[currency]) {
          setRates(prev => ({ ...prev, [currency]: fallbackRates[currency] }));
          setLastFetched(Date.now());
        }
      } finally {
        setFxLoading(false);
      }
    };

    fetchRate();
  }, [currency, detecting, lastFetched, rates]);

  // --- Helper: convert from INR to active currency ---
  const convertFromINR = (amountInINR) => {
    const n = Number(amountInINR || 0);
    if (!Number.isFinite(n)) return 0;

    if (!currency || currency === BASE_CURRENCY) return n;

    const rate = rates[currency];
    if (!rate) return n; // fallback: show INR amount

    return n * rate;
  };

  // tie old `loading` flag to detection + fx
  useEffect(() => {
    setLoading(detecting || fxLoading);
  }, [detecting, fxLoading]);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        loading, // same key you already use
        baseCurrency: BASE_CURRENCY,
        convertFromINR,
        rates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
