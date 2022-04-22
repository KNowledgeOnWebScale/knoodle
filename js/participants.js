import {downloadAvailabilityCalendar, downloadVacationCalendar, getPersonName, getRDFasJson} from "./utils";

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

export function getParticipantViaAvailabilityCalendarUrl(url, participants) {
  const webids = Object.keys(participants);
  let i = 0;

  while (i < webids.length && participants[webids[i]].availabilityCalendar.url !== url) {
    i++;
  }

  if (i < webids.length) {
    return webids[i];
  }

  return null;
}

export function getParticipantEmails(webids, participants) {
  const emails = [];

  webids.forEach(webid => {
    if (participants[webid].email) {
      emails.push(participants[webid].email);
    }
  });

  return emails;
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
            "schema": "http://schema.org/",
            "vcard": "http://www.w3.org/2006/vcard/ns#"
          },
          "@id": id
        };

        const result = await getRDFasJson(id, frame, fetch);

        if (result.length === 0) {
          participants[id].error = 'No results in JSON-LD';
          return;
        }

        let availabilityCalendar = undefined;
        let vacationCalendar = undefined;

        if (result['knows:hasAvailabilityCalendar'] && result['knows:hasAvailabilityCalendar']['schema:url']) {
          availabilityCalendar = result['knows:hasAvailabilityCalendar']['schema:url'];
        }

        if (result['knows:hasVacationCalendar']) {
          vacationCalendar = result['knows:hasVacationCalendar']['@id'];
        }

        let email = result['mbox'] || result['vcard:hasEmail'];

        if (email) {
          if (email['@id']) {
            email = email['@id'];
          }

          email = email.replace('mailto:', '');
        }

        participants[id] = {
          name: getPersonName(result) || id,
          availabilityCalendar: {
            url: availabilityCalendar,
            status: 'not-downloaded'
          },
          vacationCalendar: {
            url: vacationCalendar,
            status: 'not-downloaded'
          },
          email
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

  if (participant.error || !participant.availabilityCalendar.url) {
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

      if (checkbox.checked) {
        if (participants[webid].availabilityCalendar.status === 'not-downloaded') {
          downloadAvailabilityCalendar(webid, participants, solidFetch);
        }

        if (participants[webid].vacationCalendar.status === 'not-downloaded') {
          downloadVacationCalendar(webid, participants, solidFetch);
        }
      }
    });
  }
}