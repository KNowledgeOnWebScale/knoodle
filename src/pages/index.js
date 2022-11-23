import Head from "next/head";
import { useEffect, useState } from "react";
import { useSession } from "@inrupt/solid-ui-react";
import { getPersonName } from "../utils/participantsHelper";
import { getRDFasJson } from "../utils/fetchHelper";
import { useBaseUrl } from "../context/BaseUrlContex";

export default function Home() {
  const { session, sessionRequestInProgress } = useSession();
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useBaseUrl();

  useEffect(() => {
    setBaseUrl(window.location.origin + window.location.pathname);
  }, [setBaseUrl]);

  useEffect(() => {
    const webID = session.info.webId;
    if (webID !== undefined) {
      const frame = {
        "@context": {
          "@vocab": "http://xmlns.com/foaf/0.1/",
          knows: "https://data.knows.idlab.ugent.be/person/office/#",
          schema: "http://schema.org/",
        },
        "@id": webID,
      };

      (async () => {
        const data = await getRDFasJson(webID, frame, fetch);
        setName(getPersonName(data) || webID);
      })();
    }
  }, [session.info.webId]);

  if (sessionRequestInProgress) {
    console.log(sessionRequestInProgress);
    return <p>Loading...</p>;
  }

  return (
    <div>
      <Head>
        <title>Solid Calendar</title>
        <meta name="description" content="Calendar using solid protocol" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {session.info.isLoggedIn ? (
          <>
            <p>Welcome {name}!</p>
            <h3>Availability Page</h3>
            <p>View or edit your schedules on this page</p>
            <h3>Contacts Page</h3>
            <p>View your contacts and arrange meetings</p>
            <h3>Meetings Page</h3>
            <p>
              View or edit your booked meetings that have been booked through
              solid calendar
            </p>
          </>
        ) : (
          <>
            <h3>What is this app?</h3>
            <p>
              KNoodle is KNoWS' Solid-based alternative to Doodle. It allows you
              to find time slots that work for different people, by using their
              availability calendar which is made available through a Solid pod.
            </p>
            <p>To get started, login/sign up with a pod provider!</p>
          </>
        )}
      </main>
    </div>
  );
}
