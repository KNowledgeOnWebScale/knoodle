import {downloadCalendar, removePastSlots, sleep} from "./utils";
import {intersect} from "./intersection";
import dayjs from "dayjs";
import {getParticipantViaCalendarUrl} from "./participants";
import {google, outlook, office365, yahoo, ics} from "calendar-link";

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
  document.getElementById('add-slot').classList.add('hidden');
  document.getElementById('desired-slot-message').classList.remove('hidden');

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

      $tr.addEventListener('click', () => {
        showCalendarLinksForSlot(slot.startDate, slot.endDate);
      });

      $tbody.appendChild($tr);
    });
  }

  document.getElementById('available-slots').classList.remove('hidden');
  document.querySelector('#find-slots .loader').classList.add('hidden');
}

let timeInputHasListener = false;
const event = {
  title: 'Meeting'
}

function showCalendarLinksForSlot(startDate, endDate) {
  event.start = startDate;
  event.end = endDate;

  document.getElementById('finale-date').innerText = dayjs(startDate).format('dddd YYYY-MM-DD');

  const $startTime = document.getElementById('final-slot-start-time');
  const $endTime = document.getElementById('final-slot-end-time');

  $startTime.value = dayjs(startDate).format('HH:mm');
  $endTime.value = dayjs(endDate).format('HH:mm');

  const googleLink = document.querySelector('#google-calendar a');
  googleLink.setAttribute('href', google(event));
  googleLink.setAttribute('target', '_blank');

  const outlookLink = document.querySelector('#outlook a');
  outlookLink.setAttribute('href', outlook(event));
  outlookLink.setAttribute('target', '_blank');

  const officeLink = document.querySelector('#office365 a');
  officeLink.setAttribute('href', office365(event));
  officeLink.setAttribute('target', '_blank');

  const otherApp = document.querySelector('#other-app a');
  otherApp.setAttribute('href', ics(event));
  otherApp.setAttribute('download', 'meeting.ics');

  if (!timeInputHasListener) {
    timeInputHasListener = false;

    function change(e) {
      const time = e.target.value;
      const hour = parseInt(time.split(':')[0]);
      const minutes = parseInt(time.split(':')[1]);

      if (e.target.id.includes('start')) {
        startDate = dayjs(event.start).hour(hour);
        startDate = dayjs(startDate).minute(minutes);
        event.start = startDate.toDate();
      } else {
        endDate = dayjs(event.end).hour(hour);
        endDate = dayjs(endDate).minute(minutes);
        event.end = endDate.toDate();
      }

      googleLink.setAttribute('href', google(event));
      outlookLink.setAttribute('href', outlook(event));
      officeLink.setAttribute('href', office365(event));
      otherApp.setAttribute('href', ics(event));
    }

    //$startTime.replaceWith($startTime.cloneNode(false));
    $startTime.addEventListener('change', change);
    //$endTime.replaceWith($endTime.cloneNode(false));
    $endTime.addEventListener('change', change);
  }


  document.getElementById('add-slot').classList.remove('hidden');
  document.getElementById('desired-slot-message').classList.add('hidden');
}