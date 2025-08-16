import { useState, useEffect } from "react";

/**
 * useSearch - reusable search hook
 * @param {Array} data - the original array to filter
 * @param {string} query - the search string
 * @param {Array} keys - optional, which object keys to search in
 * @returns {Array} filteredData
 */
export default function useSearch(data, query, keys = []) {
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    if (!query) {
      setFilteredData(data);
      return;
    }

    const lowerQuery = query.toLowerCase();

    const filtered = data.filter((item) => {
      // If keys specified, search only in those keys
      if (keys.length > 0) {
        return keys.some((key) =>
          String(item[key]).toLowerCase().includes(lowerQuery)
        );
      }

      // Otherwise, search all values
      return Object.values(item).some((value) =>
        String(value).toLowerCase().includes(lowerQuery)
      );
    });

    setFilteredData(filtered);
  }, [data, query, keys]);

  return filteredData;
}
