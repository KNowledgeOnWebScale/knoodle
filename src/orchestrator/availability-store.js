import _ from "lodash";
import { DateTime } from "luxon";
import { setHours, setMinutes } from "date-fns";
import { createHash } from "crypto";

function hash(str) {
  return createHash("md5").update(str).digest("hex");
}

export function inWeekend(date, weekend) {
  const wnd = weekend ?? [0, 6];
  const day = date.getUTCDay();
  return wnd.some((w) => w === day);
}

export function nextDay(date, days = 1) {
  const [year, month, day] = getUtcComponents(date || new Date());
  return utcDate(year, month, day + days);
}

export function utcDate(year, month, days) {
  return new Date(Date.UTC(year, month, days));
}

export function setZoneTime(zone, date, hour, minute) {
  return DateTime.fromJSDate(date)
    .setZone(zone)
    .set({ hour, minute })
    .toJSDate();
}

export function roundEventTimes(event, minutes = 15, expand = true) {
  const startDate = roundTimeStamp(event.startDate, minutes, !expand);
  const endDate = roundTimeStamp(event.endDate, minutes, expand);
  if (startDate !== event.startDate || endDate !== event.endDate)
    event = { ...event, startDate, endDate };
  return event;
}

export function roundTimeStamp(
  date = new Date(),
  minutes = 15,
  roundUp = false
) {
  const diff = date.getMinutes() % minutes;
  if (diff !== 0) {
    const shift = (roundUp ? minutes - diff : -diff) * 60 * 1000;
    date = new Date(Number(date) + shift);
  }
  return date;
}

export function getDuration(options) {
  return (Number(options.endDate) - Number(options.startDate)) / (60 * 1000);
}

export function getUtcComponents(date = new Date()) {
  return [date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()];
}

export function subtractEvents(events, subtract) {
  // Order events and parts to be subtracted so we only need one pass
  events = _.orderBy(events, ["endDate", "startDate"], ["desc", "desc"]);
  subtract = _.orderBy(subtract, ["startDate", "endDate"], ["desc", "asc"]);

  // Subtract all parts one by one
  const difference = [];
  while (events.length > 0 && subtract.length > 0) {
    // Events that end before the subtracted part are unaffected
    const { startDate, endDate } = subtract.pop();
    while (events.length > 0 && _.last(events).endDate <= startDate)
      difference.push(events.pop());

    // Trim events that overlap
    const tails = [];
    while (events.length > 0 && _.last(events).startDate < endDate) {
      const event = events.pop();
      // Event tail overlaps with subtracted part; trim it
      if (event.startDate < startDate)
        difference.push({ ...event, endDate: startDate });
      // Event head overlaps with subtracted part; trim it
      if (event.endDate > endDate)
        tails.push({ ...event, startDate: endDate, uid: `${event.uid}-tail` });
    }
    // Re-add trimmed tails for possible subtraction by other parts
    events.push(..._.orderBy(tails, ["endDate"], ["desc"]));
  }

  // Add all remaining non-overlapping events
  difference.push(...events);
  return difference;
}

/**
 *
 * @param baseUrl
 * @param busyEvents
 * @param availabilitySlots - Array of default availability slots.
 * @param minimumSlotDuration - Minimum duration of a slot.
 * @param options - Optional options that can be set
 */
export function getAvailableSlots(
  baseUrl,
  busyEvents,
  availabilitySlots,
  minimumSlotDuration,
  now,
  options
) {
  // Always consider a fixed range
  const startDate = options?.startDate ?? nextDay(now, 0);
  const endDate = options?.endDate ?? nextDay(startDate, 14);

  const slots =
    options?.slots ??
    getSlots(startDate, endDate, baseUrl, availabilitySlots, now, options);

  // Subtract unavailabilities
  let available = subtractEvents(slots, busyEvents);
  available = available.map((e) => roundEventTimes(e, 30, false));
  available = available.filter((e) => getDuration(e) >= minimumSlotDuration);
  // available.forEach((event) => {
  //   event.uid = `${baseUrl}slots#${hash(event.uid)}`;
  // });

  return available;
}

/**
 * Generate slots for given dates.
 * @param startDate - Start date of the slots.
 * @param endDate - End date of the slots.
 * @param baseUrl - The url used to generate urls for the slots.
 * @param availabilitySlots - Array of default availability slots.
 * @param stampDate - The date at which the slots are generated.
 * @param options - Optional options that can be set
 */
export function getSlots(
  startDate,
  endDate,
  baseUrl,
  availabilitySlots,
  stampDate,
  options
) {
  const slots = [];
  startDate = setHours(startDate, 23);
  startDate = setMinutes(startDate, 59);
  endDate = setHours(endDate, 23);
  endDate = setMinutes(endDate, 59);
  // endDate = new Date(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());

  for (let date = startDate; date < endDate; date = nextDay(date)) {
    slots.push(
      ...createSlots(date, baseUrl, availabilitySlots, stampDate, options)
    );
  }

  return slots;
}

/**
 * This method generates slots for a given date.
 * @param date - The date for which slots are generated.
 * @param baseUrl - The url used to generate urls for the slots.
 * @param availabilitySlots - Array of default availability slots.
 * @param stampDate - The date at which the slots are generated.
 * @param options - Optional options that can be set
 */
export function createSlots(
  date,
  baseUrl,
  availabilitySlots,
  stampDate,
  options
) {
  const slots = [];

  if (!inWeekend(date, options?.weekend)) {
    availabilitySlots.forEach((slot) => {
      const { startTime, endTime } = slot;
      slots.push(
        createSlot(
          date,
          startTime,
          endTime,
          baseUrl,
          stampDate,
          options?.timezone
        )
      );
    });
  }

  return slots;
}

export function createSlot(
  date,
  startTime,
  endTime,
  baseUrl,
  stampDate,
  timezone
) {
  const zone = timezone ?? "Europe/Brussels";
  const startDate = setZoneTime(zone, date, startTime.hour, startTime.minutes);
  const endDate = setZoneTime(zone, date, endTime.hour, endTime.minutes);
  return {
    // uid: `${baseUrl}slots#${hash("" + startDate + endDate)}`,
    // stampDate,
    startDate,
    endDate,
    title: "Available for meetings",
    hash: `${baseUrl}slots#${hash("" + startDate + endDate)}`,
  };
}
