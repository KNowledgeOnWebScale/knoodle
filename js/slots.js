import {downloadCalendar, removePastSlots, sleep} from "./utils";
import {intersect} from "./intersection";
import dayjs from "dayjs";
import {getParticipantViaCalendarUrl} from "./participants";

export async function findAndShowSlots(urls, solidFetch, participants) {
  const {slots, error} = await findSlots(urls, participants, solidFetch);

  if (error) {
    const $error = document.getElementById('error');
    const participantWebId = getParticipantViaCalendarUrl(error.url, participants);
    $error.innerText = `${error.message} (Calendar of ${participants[participantWebId].name} (${participantWebId}))`;
    $error.classList.remove('hidden');
    document.querySelector('#find-slots .loader').classList.add('hidden');
  } else {
    showSlots(slots);
  }
}

async function findSlots(urls, participants, solidFetch) {
  const calendars = [];
  let error = undefined;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    while (participants[url].calendar.status === 'downloading') {
      await sleep(250);
    }

    if (participants[url].calendar.status === 'not-downloaded') {
      await downloadCalendar(url, participants, solidFetch);
    }

    if (participants[url].calendar.status === 'download-failed') {
      error = participants[url].calendar.error;
      break;
    }

    calendars.push(participants[url].calendar.data);
  }

  let slots = undefined;

  if (!error) {
    if (calendars.length > 1) {
      slots = intersect(...calendars);
    } else {
      slots = calendars[0];
    }
  }

  return {slots, error}
}

function showSlots(slots) {
  if (slots.length === 0) {
    document.getElementById('no-slots-message').classList.remove('hidden');
    document.getElementById('slots').classList.add('hidden');

  } else {
    document.getElementById('no-slots-message').classList.add('hidden');
    document.getElementById('slots').classList.remove('hidden');

    const $tbody = document.querySelector('#slots tbody');
    $tbody.innerHTML = '';

    slots.sort((a, b) => {
      if (a.startDate < b.startDate) {
        return -1;
      } else if (a.startDate > b.startDate) {
        return 1;
      } else {
        return 0;
      }
    });

    slots = removePastSlots(slots);

    slots.forEach(slot => {
      const $tr = document.createElement('tr');

      const $fromDate = document.createElement('td');
      const startDate = dayjs(slot.startDate);
      $fromDate.innerText = startDate.format('dddd YYYY-MM-DD');
      $tr.appendChild($fromDate);

      const $fromHour = document.createElement('td');
      $fromHour.innerText = startDate.format('HH:mm');
      $tr.appendChild($fromHour);

      const $till = document.createElement('td');
      const endDate = dayjs(slot.endDate);

      $till.innerText = ' till ';
      if (endDate.isSame(startDate, 'day')) {
        $till.innerText += dayjs(slot.endDate).format('HH:mm');
      } else {
        $till.innerText += dayjs(slot.endDate).format('dddd YYYY-MM-DD HH:mm');
      }
      $tr.appendChild($till);

      $tbody.appendChild($tr);
    });
  }

  document.getElementById('available-slots').classList.remove('hidden');
  document.querySelector('#find-slots .loader').classList.add('hidden');
}