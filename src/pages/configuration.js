import SignUpForm from "../components/SignUpForm";
import OneLineForm from "../components/OneLineForm";
import { useUrl } from "../context/UrlContext";
import { useSession } from "@inrupt/solid-ui-react";
import Button from "@mui/material/Button";
import { getRDFasJson } from "../utils/fetchHelper";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";

export default function Meetings() {
  const { session } = useSession();
  const webID = session.info.webId;
  const solidFetch = session.fetch;
  const [url, setUrl] = useUrl();
  const [issuer, setIssuer] = useState("");

  useEffect(() => {
    async function getIssuer() {
      const frame = {
        "@context": {
          "@vocab": "http://xmlns.com/foaf/0.1/",
          knows: "https://data.knows.idlab.ugent.be/person/office/#",
          schema: "http://schema.org/",
          solid: "http://www.w3.org/ns/solid/terms#",
          "solid:oidcIssuer": { "@type": "@id" },
        },
        "@id": webID,
      };

      const result = await getRDFasJson(webID, frame, solidFetch);
      const oidcIssuer = result["solid:oidcIssuer"];
      setIssuer(oidcIssuer);
    }
    if (!issuer) {
      getIssuer();
    }
  }, []);

  const updateUrl = (url) => {
    setUrl(url);
  };

  const updateIcs = async (ics) => {
    const response = await fetch("/api/update-ics", {
      method: "PUT",
      body: JSON.stringify({
        ics: ics,
        webid: webID,
      }),
    });

    const response_text = await response.json();
    console.log(response_text);
  };

  const updateAvailability = async () => {
    // const calendarText = await convertIcsToRdf();
    // console.log(calendarText);
    const response = await fetch("/api/update-availability", {
      method: "PUT",
      body: JSON.stringify({
        webid: webID,
        issuer: issuer,
      }),
    });
    const calendarData = await response.json();
    console.log(calendarData);
  };

  return (
    <>
      {session.info.isLoggedIn && (
        <>
          <h3>Knoodle configurations</h3>
          <p>Change contacts URL:</p>
          <OneLineForm id="url" label="URL" trigger={updateUrl} />
          <p>
            Don't have an availability calendar yet? Allow knoodle to fetch
            availability calendar from google and store it into your pod:
          </p>
          <p>
            1. Enter your email and password used to login to allow the
            orchestrator have access to your pod:
          </p>
          <SignUpForm webid={webID} issuer={issuer} />
          <p>
            2. Enter your secret address in iCal format:
            (https://support.google.com/calendar/answer/37648#private&zippy=%2Cget-your-calendar-view-only)
          </p>
          <OneLineForm id="secret" label="Secret Address" trigger={updateIcs} />
          <Box
            sx={{
              mx: 4,
              my: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Button onClick={updateAvailability}>Update Availability</Button>
          </Box>
        </>
      )}
    </>
  );
}
