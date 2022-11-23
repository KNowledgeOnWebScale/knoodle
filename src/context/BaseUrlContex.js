import { useContext, createContext, useState } from "react";

const baseUrlContext = createContext();

export function useBaseUrl() {
  return useContext(baseUrlContext);
}

export function BaseUrlProvider({ children }) {
  const [baseUrl, setBaseUrl] = useState(
    "https://localhost:3000"
  );

  return (
    <baseUrlContext.Provider value={[baseUrl, setBaseUrl]}>
      {children}
    </baseUrlContext.Provider>
  );
}
