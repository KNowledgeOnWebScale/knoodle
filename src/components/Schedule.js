import React, { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import PeopleDrawer from "../components/PeopleDrawer";
import { useUrl } from "../context/UrlContext";
import { useSession } from "@inrupt/solid-ui-react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CustomTimePicker from "./TimePicker";
import CustomCalendar from "./CustomCalendar";
import { intersect } from "../utils/dates";
import {
  fetchContacts,
  fetchParticipantWebIdData,
} from "../utils/participantsHelper";
import { createAvailabilityEvents } from "../utils/calendarHelper";
import OneLineForm from "./OneLineForm";
import { useSnackbar } from "notistack";
import {
  downloadSelectedAvailability,
  downloadSelectedVacation,
} from "../utils/calendarHelper";

const participants = {
  dummy1: {
    name: "Dummy 1",
    availabilityCalendar: {
      url: "test:dummy1",
      status: "not-downloaded",
      data: undefined,
    },
    vacationCalendar: {
      url: "test:dummy1-vacation",
      status: "not-downloaded",
      data: undefined,
    },
  },
  dummy2: {
    name: "Dummy 2",
    availabilityCalendar: {
      url: "test:dummy2",
      status: "not-downloaded",
      data: undefined,
    },
    vacationCalendar: {
      url: "test:dummy2-vacation",
      status: "not-downloaded",
      data: undefined,
    },
  },
};

export default function Schedule() {
  const { session } = useSession();
  const solidFetch = session.fetch;
  const [contactUrl, setContactUrl] = useUrl();
  const { enqueueSnackbar } = useSnackbar();

  const [validParticipants, setValidParticipants] = useState([]);
  const [invalidParticipants, setInvalidParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [vacationEvents, setVacationEvents] = useState([]);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const clickEvent = (e) => {
    let { start, end } = e;
    setStartTime(start);
    setEndTime(end);
  };

  const createVacationEvents = (slots) => {
    let events = [];
    for (let e of slots) {
      events.push({
        title: "Vacation",
        type: "vacation",
        allDay: true,
        start: new Date(e["date"]),
        end: new Date(e["date"]),
      });
    }
    setAvailableEvents([]);
    setVacationEvents(events);
  };

  const showVacation = async () => {
    if (selectedParticipants.length == 0) {
      enqueueSnackbar("Select a contact to check availability/holiday", {
        variant: "info",
      });
      return;
    }
    if (selectedParticipants.length != 1) {
      enqueueSnackbar(
        "Choose exactly 1 contact to display their holiday days",
        {
          variant: "info",
        }
      );
      return;
    }

    let error = await downloadSelectedVacation(
      selectedParticipants,
      participants,
      solidFetch
    );

    let days = undefined;
    let webid = selectedParticipants[0];
    if (!error) {
      days = participants[webid].vacationCalendar.data;
      createVacationEvents(days);
    } else {
      enqueueSnackbar("Something went wrong when downloading contact data...", {
        variant: "info",
      });
    }
  };

  const showAvailability = async () => {
    if (selectedParticipants.length == 0) {
      enqueueSnackbar("Select a contact to check availability/holiday", {
        variant: "info",
      });
      return;
    }
    let { calendars, error } = await downloadSelectedAvailability(
      selectedParticipants,
      participants,
      solidFetch
    );

    let slots = undefined;
    if (!error) {
      if (calendars.length > 1) {
        slots = intersect(...calendars);
      } else {
        slots = calendars[0];
      }
      createAvailabilityEvents(slots, setAvailableEvents, setVacationEvents);
    } else {
      console.error("Download error: ", error);
      enqueueSnackbar("Something went wrong when downloading contact data...", {
        variant: "info",
      });
    }
  };

  const fetchFriend = async (webId) => {
    participants[webId] = {};

    await fetchParticipantWebIdData(participants, solidFetch, null, null);
    let { calendars, error } = await downloadSelectedAvailability(
      [webId],
      participants,
      solidFetch
    );

    if (error != undefined || calendars == null) {
      enqueueSnackbar("Something went wrong when downloading contact data...", {
        variant: "error",
      });
      return;
    }

    if (Object.keys(participants[webId]).length != 0) {
      createAvailabilityEvents(calendars[0], setAvailableEvents, null);
    }
    enqueueSnackbar("Fetched friend calendar data!", {
      variant: "success",
    });
  };

  return (
    <>
      {session.info.isLoggedIn && (
        <Box height="100vh" width="100%" display="flex">
          <Grid container spacing={4}>
            <Grid item xs={9}>
              <Stack
                spacing={2}
                direction="row"
                justifyContent="center"
                alignItems="center"
                sx={{ mb: 3 }}
              >
                <Button
                  variant="outlined"
                  onClick={() => {
                    showAvailability();
                  }}
                >
                  Find availability
                </Button>
                <Button
                  onClick={() => {
                    showVacation();
                  }}
                  variant="outlined"
                >
                  Show vacation days
                </Button>
              </Stack>
              <OneLineForm
                id="inputWebId"
                label="Input webId of friend"
                trigger={(webId) => fetchFriend(webId)}
                required={false}
                buttonText="Fetch"
              />
              <Box sx={{ height: "60%" }}>
                <CustomCalendar
                  availableEvents={availableEvents}
                  vacationEvents={vacationEvents}
                  clickEvent={clickEvent}
                />
              </Box>
              <Box sx={{ m: 5 }} />
              <CustomTimePicker
                startTime={startTime}
                setStartTime={setStartTime}
                endTime={endTime}
                setEndTime={setEndTime}
              />
              <Box sx={{ m: 5 }} />
            </Grid>

            <Grid item xs={3}>
              <PeopleDrawer
                getContacts={() => {
                  fetchContacts(
                    participants,
                    solidFetch,
                    setValidParticipants,
                    setInvalidParticipants,
                    contactUrl
                  );
                }}
                validParticipants={validParticipants}
                invalidParticipants={invalidParticipants}
                selectedParticipants={selectedParticipants}
                setSelectedParticipants={setSelectedParticipants}
              />
            </Grid>
          </Grid>
        </Box>
      )}
    </>
  );
}
