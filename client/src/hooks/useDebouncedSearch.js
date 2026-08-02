import { useEffect, useState } from "react";

const useDebouncedSearch = (delayMs = 300) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput.trim()), delayMs);
    return () => clearTimeout(timer);
  }, [searchInput, delayMs]);

  return [searchInput, setSearchInput, searchTerm];
};

export default useDebouncedSearch;
