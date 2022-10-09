import dayjs from "dayjs";
import { getRDFasJson } from "./fetchHelper";
dayjs.extend(require("dayjs/plugin/isSameOrAfter"));

const dummyData = {
  "test:dummy1": getDummyAvailabilityDates(),
  "test:dummy2": getDummyAvailabilityDates(2),
  "test:dummy1-vacation": getDummyVacationDays(),
  "test:dummy2-vacation": getDummyVacationDays(3),
};

export const createAvailabilityEvents = (
  slots,
  setAvailableEvents,
  setVacationEvents
) => {
  let events = [];
  for (let e of slots) {
    if (Array.isArray(e["startDate"]) && Array.isArray(e["endDate"])) {
      if (e["startDate"].length == e["endDate"].length) {
        for (let i = 0; i < e["startDate"].length; i++) {
          events.push({
            title: "Available",
            type: "availability",
            start: new Date(e["startDate"][i]),
            end: new Date(e["endDate"][i]),
          });
        }
      }
    } else {
      events.push({
        title: "Available",
        type: "availability",
        start: new Date(e["startDate"]),
        end: new Date(e["endDate"]),
      });
    }
  }

  if (setAvailableEvents) {
    setAvailableEvents(events);
  }
  if (setVacationEvents) {
    setVacationEvents([]);
  }
};

export async function downloadSelectedAvailability(
  selectedParticipants,
  participants,
  solidFetch
) {
  const calendars = [];
  let error = undefined;

  for (let webid of selectedParticipants) {
    // Download calendar
    try {
      if (
        participants[webid].availabilityCalendar.status === "not-downloaded"
      ) {
        await downloadAvailabilityCalendar(webid, participants, solidFetch);
      }
    } catch (e) {
      console.log(e);
      error = "Could not download availability calendar";
    }

    if (Object.keys(participants[webid]).length === 0) {
      return { calendars: null, error: null };
    }

    if (participants[webid].availabilityCalendar.status === "download-failed") {
      error = participants[webid].availabilityCalendar.error;
      break;
    }

    calendars.push(participants[webid].availabilityCalendar.data);
  }

  return { calendars, error };
}

export async function downloadSelectedVacation(
  selectedParticipants,
  participants,
  solidFetch
) {
  let error = undefined;

  let webid = selectedParticipants[0];
  try {
    let vacationStatus = participants[webid].vacationCalendar.status;
    if (
      vacationStatus === "not-downloaded" &&
      vacationStatus !== "download-failed"
    ) {
      await downloadVacationCalendar(webid, participants, solidFetch);
    }
  } catch (e) {
    error = "Could not download vacation calendar.";
  }

  if (participants[webid].vacationCalendar.status === "download-failed") {
    error =
      participants[webid].vacationCalendar.error ||
      "Could not download vacation calendar.";
  }

  return error;
}

export async function downloadAvailabilityCalendar(
  webid,
  participants,
  solidFetch
) {
  participants[webid].availabilityCalendar.status = "downloading";

  const frame = {
    "@context": { "@vocab": "http://schema.org/" },
    "@type": "Event",
  };

  const url = participants[webid].availabilityCalendar.url;

  try {
    let data;
    if (url.startsWith("test:")) {
      console.log("fetching dummy data...");
      data = dummyData[url];
    } else {
      data = await getRDFasJson(url, frame, solidFetch);
    }

    participants[webid].availabilityCalendar.data = data["@graph"] || data;
    participants[webid].availabilityCalendar.status = "downloaded";

    // This covers the case when no available slots are present in the response.
    if (!Array.isArray(participants[webid].availabilityCalendar.data)) {
      participants[webid].availabilityCalendar.data = [];
    }
  } catch (e) {
    let error;

    if (e.includes && e.includes("ForbiddenHttpError")) {
      error = new Error("Forbidden to access: " + url);
      error.url = url;
    } else {
      error = new Error(`${e.message}: ${url}`);
      error.url = url;
    }

    participants[webid].availabilityCalendar.error = error;
    participants[webid].availabilityCalendar.status = "download-failed";
  }

  console.log("Downloaded availability calendar for", webid);
  console.log(participants[webid]);
}

/**
 * This method downloads a vacation calendar.
 * @param webid - The WebID from which the vacation calendar has to be downloaded.
 * @param participants - The loaded participants.
 * @param solidFetch - The (Solid) fetch method to be used for HTTP calls.
 * @returns {Promise<void>}
 */
export async function downloadVacationCalendar(
  webid,
  participants,
  solidFetch
) {
  const url = participants[webid].vacationCalendar.url;

  if (!url) {
    participants[webid].vacationCalendar.status = "download-failed";
    throw new Error(
      `Can't download vacation calendar for ${webid} because url is not available.`
    );
  }

  participants[webid].vacationCalendar.status = "downloading";

  const frame = {
    "@context": {
      "@vocab": "https://data.knows.idlab.ugent.be/person/office/#",
      knows: "https://data.knows.idlab.ugent.be/person/office/#",
      xsd: "http://www.w3.org/2001/XMLSchema#",
      "knows:date": {
        "@type": "xsd:date",
      },
      partOfDay: { "@type": "@id" },
    },
    "@id": url,
    "@type": "VacationCalendar",
    days: [{}],
  };

  try {
    let data;
    if (url.startsWith("test:")) {
      data = dummyData[url];
    } else {
      data = await getRDFasJson(url, frame, solidFetch);
    }

    if (!Array.isArray(data.days)) {
      data.days = [data.days];
    }

    participants[webid].vacationCalendar.data = cleanUpVacationDays(data.days);
    participants[webid].vacationCalendar.status = "downloaded";
  } catch (e) {
    let error;

    if (e.includes && e.includes("ForbiddenHttpError")) {
      error = new Error("Forbidden to access: " + url);
      error.url = url;
    } else {
      error = new Error(`${e.message}: ${url}`);
      error.url = url;
    }

    participants[webid].vacationCalendar.error = error;
    participants[webid].vacationCalendar.status = "download-failed";
  }

  console.log("Downloaded vacation calendar for", webid);
  console.log(participants[webid].vacationCalendar);
}

/**
 * This function returns the cleaned up vacation days.
 * It sanitizes the part of the day and removes vacation days that already have passed.
 * @param days - The vacation days that need to be cleaned.
 * @returns {*} - An array of vacation days.
 */
function cleanUpVacationDays(days) {
  const today = dayjs();

  days.forEach((day) => {
    day.partOfDay = day.partOfDay.replace("knows:", "");
    day.partOfDay = day.partOfDay.replace("FullDay", "Full day");
  });

  return days.filter((day) => dayjs(day.date).isSameOrAfter(today));
}

function getDummyAvailabilityDates(extra = 0) {
  const today = dayjs();

  const result = [];

  for (let i = 0; i < 7; i++) {
    const startDate = today
      .add(i + extra, "day")
      .hour(9)
      .toISOString();

    const endDate = today
      .add(i + extra, "day")
      .hour(17)
      .toISOString();

    result.push({ "@id": "dummy" + (i + extra), startDate, endDate });
  }

  return result;
}

/**
 * This function returns 3 dummy vacation days.
 * @param extra - Normally, the days starts tomorrow, but with this parameter you can shift that. Default is 0.
 * @returns {{days: *[]}}
 */
function getDummyVacationDays(extra = 0) {
  const today = dayjs();

  const result = [];

  for (let i = 0; i < 3; i++) {
    const date = today.add(i + 1 + extra, "day").format("YYYY-MM-DD");
    result.push({
      "@id": "dummy" + (i + extra),
      date,
      partOfDay: "knows:FullDay",
    });
  }

  return { days: result };
}
