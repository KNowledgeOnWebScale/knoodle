import {downloadVacationCalendar, sleep} from "./utils";
import dayjs from "dayjs";


export async function fetchAndShowVacationDays(webid, participants, solidFetch) {
  document.getElementById('add-slot').classList.add('hidden');
  document.getElementById('desired-slot-message').classList.add('hidden');
  document.getElementById('available-slots').classList.add('hidden');

  const {days, error} = await fetchVacationDays(webid, participants, solidFetch);

  if (error) {
    const $error = document.getElementById('error');
    $error.innerText = `${error.message} (Vacation calendar of ${participants[webid].name} (${webid}))`;
    $error.classList.remove('hidden');
    //document.querySelector('#find-slots .loader').classList.add('hidden');
  } else {
    showVacationDays(days);
  }
}

async function fetchVacationDays(webid, participants, solidFetch) {
  let error = undefined;

  while (participants[webid].vacationCalendar.status === 'downloading') {
    await sleep(250);
  }

  if (participants[webid].vacationCalendar.status === 'not-downloaded') {
    await downloadVacationCalendar(webid, participants, solidFetch);
  }

  if (participants[webid].vacationCalendar.status === 'download-failed') {
    error = participants[webid].vacationCalendar.error;
  }

  let days = undefined;

  if (!error) {
    days = participants[webid].vacationCalendar.data;
  }

  return {days, error}
}

function showVacationDays(days) {
  if (days.length === 0) {
    document.getElementById('no-vacation-days-message').classList.remove('hidden');
    document.getElementById('vacation-days-container').classList.add('hidden');
  } else {
    document.getElementById('no-vacation-days-message').classList.add('hidden');
    document.getElementById('vacation-days-container').classList.remove('hidden');

    const $tbody = document.querySelector('#vacation-days tbody');
    $tbody.innerHTML = '';

    days.sort((a, b) => {
      if (a.date < b.date) {
        return -1;
      } else if (a.date > b.date) {
        return 1;
      } else {
        return 0;
      }
    });

    days.forEach(vacationDay => {
      const $tr = document.createElement('tr');

      const $vacationDate = document.createElement('td');
      const vacationDayDate = dayjs(vacationDay.date);
      $vacationDate.innerText = vacationDayDate.format('dddd YYYY-MM-DD');
      $tr.appendChild($vacationDate);

      const $partOfDay = document.createElement('td');
      $partOfDay.innerText = vacationDay.partOfDay;
      $tr.appendChild($partOfDay);

      $tbody.appendChild($tr);
    });
  }
}