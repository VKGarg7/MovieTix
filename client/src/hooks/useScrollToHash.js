import { useEffect } from "react";

const useScrollToHash = (currentHash, hash, ready) => {
  useEffect(() => {
    if (currentHash === hash && ready) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentHash, hash, ready]);
};

export default useScrollToHash;
