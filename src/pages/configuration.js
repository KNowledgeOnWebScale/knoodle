import SignUpForm from "../components/SignUpForm";
import OneLineForm from "../components/OneLineForm";
import { useUrl } from "../context/UrlContext";
import { useSession } from "@inrupt/solid-ui-react";

export default function Meetings() {
  const { session } = useSession();
  const webID = session.info.webId;
  console.log("my webid! ", webID);
  const [url, setUrl] = useUrl();

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
          <SignUpForm webid={webID} />
          <p>
            2. Enter your secret address in iCal format:
            (https://support.google.com/calendar/answer/37648#private&zippy=%2Cget-your-calendar-view-only)
          </p>
          <OneLineForm id="secret" label="Secret Address" trigger={updateIcs} />
        </>
      )}
    </>
  );
}
