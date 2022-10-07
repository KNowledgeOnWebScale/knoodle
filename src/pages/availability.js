import CustomCalendar from "../components/CustomCalendar";
import { fetchParticipantWebIdData } from "../utils/participantsHelper";
import { downloadSelectedAvailability } from "../utils/calendarHelper";
import { useSession } from "@inrupt/solid-ui-react";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";

export default function Availability() {
  const { session } = useSession();
  const solidFetch = session.fetch;
  const webId = session.info.webId;
  const participants = {};
  const [availableEvents, setAvailableEvents] = useState([]);

  const createAvailabilityEvents = (slots) => {
    let events = [];
    for (let e of slots) {
      events.push({
        title: "Available",
        type: "availability",
        start: new Date(e["startDate"]),
        end: new Date(e["endDate"]),
      });
    }
    console.log(events);
    setAvailableEvents(events);
  };

  useEffect(() => {
    async function getAvailability() {
      participants[webId] = {};

      await fetchParticipantWebIdData(participants, solidFetch, null, null);
      let { calendars } = await downloadSelectedAvailability(
        [webId],
        participants,
        solidFetch
      );

      if (Object.keys(participants[webId]).length != 0) {
        createAvailabilityEvents(calendars[0]);
      }
    }
    getAvailability();
  }, []);

  return (
    <>
      <h3>View your availability:</h3>
      <Box sx={{ height: "80vh", mx: 3 }}>
        <CustomCalendar
          availableEvents={availableEvents}
          vacationEvents={[]}
          clickEvent={() => {}}
        />
      </Box>
    </>
  );
}
