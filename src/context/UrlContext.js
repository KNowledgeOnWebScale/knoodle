import { useContext, createContext, useState } from "react";

const urlContext = createContext();

export function useUrl() {
  return useContext(urlContext);
}

export function UrlProvider({ children }) {
  const [contactUrl, setContactUrl] = useState(
    "https://data.knows.idlab.ugent.be/person/office/employees.ttl"
  );

  return (
    <urlContext.Provider value={[contactUrl, setContactUrl]}>
      {children}
    </urlContext.Provider>
  );
}
