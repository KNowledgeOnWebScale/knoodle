import { DateTime } from "luxon";
import { RRule, rrulestr } from "rrule";
import { eventTTL } from "./resources/events-ttl";
import { getAvailableSlots } from "./availability-store";

const ICAL = require("ical.js");
const md5 = require("md5");

async function IcsToJson(ics) {
  const response = await fetch(ics);
  const data = await response.text();

  const jcalData = ICAL.parse(data);
  let events = [];
  const vcalendar = new ICAL.Component(jcalData);
  const vevents = vcalendar.getAllSubcomponents("vevent");

  for (const vevent of vevents) {
    let summary = vevent.getFirstPropertyValue("summary");

    if (!summary) {
      summary = "Calendar Event";
    }

    let startDate = vevent.getFirstPropertyValue("dtstart");
    let endDate = vevent.getFirstPropertyValue("dtend");

    if (!startDate || !endDate) continue;

    startDate = new Date(startDate);
    endDate = new Date(endDate);

    const event = {
      title: summary,
      startDate,
      endDate,
      hash: md5(summary + startDate + endDate),
    };

    if (vevent.hasProperty("description"))
      event.description = vevent.getFirstPropertyValue("description");
    if (vevent.hasProperty("url"))
      event.url = vevent.getFirstPropertyValue("url");
    if (vevent.hasProperty("location"))
      event.location = vevent.getFirstPropertyValue("location");
    if (vevent.hasProperty("uid"))
      event.originalUID = vevent.getFirstPropertyValue("uid");
    if (vevent.hasProperty("recurrence-id"))
      event.originalRecurrenceID =
        vevent.getFirstPropertyValue("recurrence-id");

    events.push(event);

    if (vevent.getFirstPropertyValue("rrule")) {
      const recurringEvents = getRecurringEvents(
        event,
        vevent.getFirstPropertyValue("rrule")
      );
      events = events.concat(recurringEvents);
    }
  }

  removeChangedEventsFromRecurringEvents(events);

  const calendar = {
    name: vcalendar.getFirstPropertyValue("x-wr-calname"),
    events,
  };

  if (!calendar?.name?.trim().length) {
    console.error("calendar has no name!");
  }

  return calendar;
}

async function jsonToRdf(calendar) {
  const resultRDF = await fetch("https://rml.io/api/rmlmapper/execute", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rml: eventTTL,
      sources: { "data.json": JSON.stringify(calendar) },
    }),
  });

  const rdfJson = await resultRDF.json();
  if (rdfJson["output"]) {
    return rdfJson["output"];
  }
  return "";
}

export async function convertIcsToRdf(ics) {
  const calendarJson = await IcsToJson(ics);

  const events = calendarJson.events;
  console.log(events);

  events.forEach((event) => {
    event.startDate = new Date(event.startDate);
    event.endDate = new Date(event.endDate);
  });

  const minimumSlotDuration = 30;
  const slotStartDate = new Date();
  const defaultAvailability = [
    { startTime: { hour: 11, minutes: 0 }, endTime: { hour: 19, minutes: 0 } },
  ];

  let slots = getAvailableSlots(
    "test",
    events,
    defaultAvailability,
    minimumSlotDuration,
    slotStartDate,
    { weekend: [0, 6] }
  );

  calendarJson.events = slots;

  const calendarRdf = await jsonToRdf(calendarJson);
  console.log(calendarJson);
  console.log(calendarRdf);
  return calendarRdf;
}

/**
 * This function returns the recurring events for the original event.
 * Only one year of future events are returned, starting from today or the start date of the original event,
 * whatever is most recent.
 * @param originalEvent - The original event.
 * @param rrule - The RRULE (coming from ICS) for the original event.
 */
function getRecurringEvents(originalEvent, rrule) {
  const today = new Date();
  let rule = rrulestr(`RRULE:${rrule}`);
  const origOptions = rule.origOptions;
  const originalStartDate = new Date(originalEvent.startDate);
  origOptions.dtstart = originalStartDate;

  rule = new RRule(origOptions);

  const currentDate = new Date(
    (today < originalStartDate ? originalStartDate : today).getTime()
  );
  let todayPlusOneMonth = new Date(
    currentDate.setMonth(currentDate.getMonth() + 1)
  );
  //todayPlusOneYear.setFullYear(todayPlusOneYear.getFullYear() + 1);

  let allStartDates = rule.between(today, todayPlusOneMonth, true);

  if (
    allStartDates.length > 0 &&
    allStartDates[0].getTime() === originalStartDate.getTime()
  ) {
    allStartDates.shift();
  }

  allStartDates = allStartDates.map((date) => {
    let temp = DateTime.fromJSDate(date);

    if (temp.isInDST !== DateTime.fromJSDate(originalStartDate).isInDST) {
      if (temp.isInDST) {
        temp = temp.minus({ hours: 1 });
      } else {
        temp = temp.plus({ hours: 1 });
      }
    }

    return temp.toJSDate();
  });

  const differenceMs =
    originalEvent.endDate.getTime() - originalStartDate.getTime();
  const recurringEvents = [];

  allStartDates.forEach((startDate) => {
    const endDate = new Date();
    endDate.setTime(startDate.getTime() + differenceMs);

    const recurringEvent = JSON.parse(JSON.stringify(originalEvent));
    recurringEvent.startDate = startDate;
    recurringEvent.endDate = endDate;

    recurringEvents.push(recurringEvent);
  });

  return recurringEvents;
}

/**
 * This method removes instances of recurring events that have been changed,
 * based on RECURRING-ID and UID.
 * The attributes "originalUID" and "originalRecurrenceID" are removed from all events in the process.
 * @param events - The events that are checked and where events are removed if needed.
 */
function removeChangedEventsFromRecurringEvents(events) {
  events.forEach((event) => {
    if (event.originalRecurrenceID) {
      let i = 0;

      while (
        i < events.length &&
        !(
          events[i].originalUID === events[i].originalUID &&
          events[i].startDate.toISOString() ===
            new Date(event.originalRecurrenceID).toISOString()
        )
      ) {
        i++;
      }

      if (i < events.length) {
        events[i].toBeRemoved = true;
      }
    }
  });

  for (let i = 0; i < events.length; i++) {
    if (events[i].toBeRemoved) {
      events.splice(i, 1);
      i--;
    } else {
      delete events[i].originalRecurrenceID;
      delete events[i].originalUID;
    }
  }
}
