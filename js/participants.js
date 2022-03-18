import {downloadCalendar, getPersonName, getRDFasJson} from "./utils";

export async function fetchParticipantWebIDs(employeesUrl, participants, fetch) {
  const frame = {
    "@context": {
      "@vocab": "http://schema.org/"
    },
    "employee": {}
  };

  const result = await getRDFasJson(employeesUrl, frame, fetch);
  const ids = result.employee.map(a => a['@id']);

  ids.forEach(id => {
    participants[id] = {};
  });

  console.log(participants);
}

export function sortParticipants(participants) {
  const temp = [];

  const webids = Object.keys(participants);
  webids.forEach(id => {
    const data = JSON.parse(JSON.stringify(participants[id]));
    data.id = id;
    temp.push(data);
  });

  temp.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    } else {
      return 0;
    }
  });

  return temp;
}

export function setSelectedParticipantUrls(allParticipants, selectedParticipants) {
  const webids = Object.keys(allParticipants);

  webids.forEach(id => {
    if (document.getElementById(id)) {
      document.getElementById(id).checked = selectedParticipants.includes(id);
    }
  });
}

export function getSelectedParticipantWebIDs(participants) {
  const urls = [];
  const webids = Object.keys(participants);

  webids.forEach(id => {
    if (document.getElementById(id)?.checked) {
      urls.push(id);
    }
  });

  return urls;
}

export function getParticipantViaCalendarUrl(url, participants) {
  const webids = Object.keys(participants);
  let i = 0;

  while (i < webids.length && participants[webids[i]].calendar.url !== url) {
    i++;
  }

  if (i < webids.length) {
    return webids[i];
  }

  return null;
}

export async function fetchDataOfParticipants(participants, solidFetch, callback) {
  const webids = Object.keys(participants);

  for (let i = 0; i < webids.length; i++) {
    const id = webids[i];

    if (id.startsWith('http')) {
      try {
        const frame = {
          "@context": {
            "@vocab": "http://xmlns.com/foaf/0.1/",
            "knows": "https://data.knows.idlab.ugent.be/person/office/#",
            "schema": "http://schema.org/"
          },
          "@id": id
        };

        const result = await getRDFasJson(id, frame, fetch);
        let calendar = undefined;

        if (result.length === 0) {
          participants[id].error = 'No results in JSON-LD';
          return;
        }

        if (result['knows:hasAvailabilityCalendar'] && result['knows:hasAvailabilityCalendar']['schema:url']) {
          calendar = result['knows:hasAvailabilityCalendar']['schema:url'];
        }

        participants[id] = {
          name: getPersonName(result) || id,
          calendar: {
            url: calendar,
            status: 'not-downloaded'
          }
        };
      } catch (e) {
        if (e.includes && e.includes('conversion')) {
          participants[id].error = e;
        } else {
          participants[id].error = 'Unable to fetch data.'
        }
      }

      if (callback) {
        callback(participants, id, solidFetch);
      }
    }
  }
}

let invalidParticipants = 0;

export function addParticipantToList(participants, id, solidFetch) {
  const participant = participants[id];
  const $validList = document.getElementById('participant-list');
  const $invalidList = document.getElementById('invalid-participants-list');

  if (participant.error || !participant.calendar.url) {
    invalidParticipants++;
    const $li = document.createElement('li');
    $li.innerText = participant.name || id;

    if (participant.error) {
      $li.innerText += ' (Error: ' + participant.error + ')';
    } else {
      $li.innerText += ' (No availability calendar found.)'
    }

    $invalidList.appendChild($li);

    document.getElementById('invalid-participants').classList.remove('hidden');
    document.getElementById('invalid-participants-count').innerText = invalidParticipants;

  } else {
    const $div = document.createElement('div');
    const $input = document.createElement('input');
    $input.setAttribute('type', 'checkbox');
    $input.setAttribute('id', id);
    $input.setAttribute('name', id);

    $div.appendChild($input);

    const $label = document.createElement('label');
    $label.setAttribute('for', id);
    $label.innerText = participant.name || id;
    $div.appendChild($label);

    $validList.appendChild($div);

    const checkbox = document.getElementById(id);
    checkbox.addEventListener('change', () => {
      const webid = checkbox.name;

      if (checkbox.checked && participants[webid].calendar.status === 'not-downloaded') {
        downloadCalendar(webid, participants, solidFetch);
      }
    });
  }
}