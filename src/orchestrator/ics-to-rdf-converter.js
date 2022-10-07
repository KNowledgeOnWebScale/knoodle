import { DateTime } from "luxon";
import { RRule, rrulestr } from "rrule";
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
  console.log(calendar);
  return calendar;
}

async function jsonToRdf(calendar) {
  const eventTTL = `@prefix rr: <http://www.w3.org/ns/r2rml#>.
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
  @prefix fnml: <http://semweb.mmlab.be/ns/fnml#>.
  @prefix fno: <https://w3id.org/function/ontology#>.
  @prefix d2rq: <http://www.wiwiss.fu-berlin.de/suhl/bizer/D2RQ/0.1#>.
  @prefix void: <http://rdfs.org/ns/void#>.
  @prefix dc: <http://purl.org/dc/terms/>.
  @prefix foaf: <http://xmlns.com/foaf/0.1/>.
  @prefix rml: <http://semweb.mmlab.be/ns/rml#>.
  @prefix ql: <http://semweb.mmlab.be/ns/ql#>.
  @prefix : <http://mapping.example.com/>.
  
  :rules_000 a void:Dataset;
      void:exampleResource :map_calendar_000.
  :map_calendar_000 rml:logicalSource :source_000.
  :source_000 a rml:LogicalSource;
      rml:source "data.json";
      rml:iterator "$";
      rml:referenceFormulation ql:JSONPath.
  :map_calendar_000 a rr:TriplesMap;
      rdfs:label "calendar".
  :s_000 a rr:SubjectMap.
  :map_calendar_000 rr:subjectMap :s_000.
  :s_000 rr:template "http://example.com/calendar/{name}".
  :pom_000 a rr:PredicateObjectMap.
  :map_calendar_000 rr:predicateObjectMap :pom_000.
  :pm_000 a rr:PredicateMap.
  :pom_000 rr:predicateMap :pm_000.
  :pm_000 rr:constant <http://schema.org/name>.
  :pom_000 rr:objectMap :om_000.
  :om_000 a rr:ObjectMap;
      rml:reference "name";
      rr:termType rr:Literal.
  :pom_001 a rr:PredicateObjectMap.
  :map_calendar_000 rr:predicateObjectMap :pom_001.
  :pm_001 a rr:PredicateMap.
  :pom_001 rr:predicateMap :pm_001.
  :pm_001 rr:constant <http://schema.org/event>.
  :pom_001 rr:objectMap :om_001.
  :rules_000 void:exampleResource :map_events_000.
  :map_events_000 rml:logicalSource :source_001.
  :source_001 a rml:LogicalSource;
      rml:source "data.json";
      rml:iterator "$.events[*]";
      rml:referenceFormulation ql:JSONPath.
  :map_events_000 a rr:TriplesMap;
      rdfs:label "events".
  :s_001 a rr:SubjectMap.
  :map_events_000 rr:subjectMap :s_001.
  :s_001 rr:template "http://example.com/event/{hash}".
  :pom_002 a rr:PredicateObjectMap.
  :map_events_000 rr:predicateObjectMap :pom_002.
  :pm_002 a rr:PredicateMap.
  :pom_002 rr:predicateMap :pm_002.
  :pm_002 rr:constant rdf:type.
  :pom_002 rr:objectMap :om_002.
  :om_002 a rr:ObjectMap;
      rr:constant "http://schema.org/Event";
      rr:termType rr:IRI.
  :pom_003 a rr:PredicateObjectMap.
  :map_events_000 rr:predicateObjectMap :pom_003.
  :pm_003 a rr:PredicateMap.
  :pom_003 rr:predicateMap :pm_003.
  :pm_003 rr:constant <http://schema.org/name>.
  :pom_003 rr:objectMap :om_003.
  :om_003 a rr:ObjectMap;
      rml:reference "title";
      rr:termType rr:Literal.
  :pom_004 a rr:PredicateObjectMap.
  :map_events_000 rr:predicateObjectMap :pom_004.
  :pm_004 a rr:PredicateMap.
  :pom_004 rr:predicateMap :pm_004.
  :pm_004 rr:constant <http://schema.org/startDate>.
  :pom_004 rr:objectMap :om_004.
  :om_004 a rr:ObjectMap;
      rml:reference "startDate";
      rr:termType rr:Literal.
  :pom_005 a rr:PredicateObjectMap.
  :map_events_000 rr:predicateObjectMap :pom_005.
  :pm_005 a rr:PredicateMap.
  :pom_005 rr:predicateMap :pm_005.
  :pm_005 rr:constant <http://schema.org/endDate>.
  :pom_005 rr:objectMap :om_005.
  :om_005 a rr:ObjectMap;
      rml:reference "endDate";
      rr:termType rr:Literal.
  :pom_006 a rr:PredicateObjectMap.
  :map_events_000 rr:predicateObjectMap :pom_006.
  :pm_006 a rr:PredicateMap.
  :pom_006 rr:predicateMap :pm_006.
  :pm_006 rr:constant <http://schema.org/description>.
  :pom_006 rr:objectMap :om_006.
  :om_006 a rr:ObjectMap;
      rml:reference "description";
      rr:termType rr:Literal.
  :pom_007 a rr:PredicateObjectMap.
  :map_events_000 rr:predicateObjectMap :pom_007.
  :pm_007 a rr:PredicateMap.
  :pom_007 rr:predicateMap :pm_007.
  :pm_007 rr:constant <http://schema.org/url>.
  :pom_007 rr:objectMap :om_007.
  :om_007 a rr:ObjectMap;
      rml:reference "url";
      rr:termType rr:Literal.
  :pom_008 a rr:PredicateObjectMap.
  :map_events_000 rr:predicateObjectMap :pom_008.
  :pm_008 a rr:PredicateMap.
  :pom_008 rr:predicateMap :pm_008.
  :pm_008 rr:constant <http://schema.org/location>.
  :pom_008 rr:objectMap :om_008.
  :om_008 a rr:ObjectMap;
      rml:reference "location";
      rr:termType rr:Literal.
  :om_001 a rr:ObjectMap;
      rr:parentTriplesMap :map_events_000.
  `;

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
  const calendarRdf = await jsonToRdf(calendarJson);
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
