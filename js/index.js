import { getPersonName, getParticipantViaCalendarUrl, getRDFasJson, getSelectedParticipantUrls, fetchParticipantWebIDs, sortParticipants, getMostRecentWebID, setMostRecentWebID, removePastSlots } from './utils'
import { intersect } from './intersection'
import dayjs from 'dayjs';

window.onload = async () => {
  let solidFetch = solidClientAuthentication.fetch;
  const participants = {
    'dummy1': {
      name: 'Dummy 1',
      calendar: 'test:dummy1'
    },
    'dummy2': {
      name: 'Dummy 2',
      calendar: 'test:dummy2'
    }
  };
  const employeesUrl = 'https://data.knows.idlab.ugent.be/person/office/employees.ttl';

  loginAndFetch(null, employeesUrl, participants, solidFetch);

  document.getElementById('btn').addEventListener('click', async () => {
    document.getElementById('error').classList.add('hidden');
    document.getElementById('available-slots').classList.add('hidden');
    document.querySelector('#find-slots .loader').classList.remove('hidden');
    const urls = getSelectedParticipantUrls(participants);
    console.log(urls);

    if (urls.length < 2) {
      const $error = document.getElementById('error');
      $error.innerText = 'Please select at least 2 participants.';
      $error.classList.remove('hidden');
      document.querySelector('#find-slots .loader').classList.add('hidden');
    } else {
      const { slots, error } = await findSlots(urls, solidFetch);

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
  });

  document.getElementById('see-invalid-participants-btn').addEventListener('click', () => {
    document.getElementById('invalid-participants-list').classList.remove('hidden');
    document.getElementById('hide-invalid-participants-btn').classList.remove('hidden');
    document.getElementById('see-invalid-participants-btn').classList.add('hidden');
  });

  document.getElementById('hide-invalid-participants-btn').addEventListener('click', () => {
    document.getElementById('invalid-participants-list').classList.add('hidden');
    document.getElementById('hide-invalid-participants-btn').classList.add('hidden');
    document.getElementById('see-invalid-participants-btn').classList.remove('hidden');
  });

  document.getElementById('log-in-btn').addEventListener('click', () => { clickLogInBtn(employeesUrl, participants, solidFetch) });
  document.getElementById('select-oidc-issuer-btn').addEventListener('click', () => { clickSelectOIDCIssuerBtn(employeesUrl, participants, solidFetch) });

  const webIDInput = document.getElementById('webid');
  webIDInput.value = getMostRecentWebID();
  webIDInput.addEventListener("keyup", ({ key }) => {
    if (key === "Enter") {
      clickLogInBtn(employeesUrl, participants, solidFetch);
    }
  })
};

async function clickLogInBtn(employeesUrl, participants, solidFetch) {
  // Get web id
  const webId = document.getElementById('webid').value;
  setMostRecentWebID(webId);

  // Get issuer
  const frame = {
    "@context": {
      "@vocab": "http://xmlns.com/foaf/0.1/",
      "knows": "https://data.knows.idlab.ugent.be/person/office/#",
      "schema": "http://schema.org/",
      "solid": "http://www.w3.org/ns/solid/terms#",
      "solid:oidcIssuer": { "@type": "@id" }
    },
    "@id": webId
  };

  const result = await getRDFasJson(webId, frame, fetch);
  const oidcIssuer = result['solid:oidcIssuer'];

  if (Array.isArray(oidcIssuer)) {
    // Ask user to select desired OIDC issuer.
    showOIDCIssuerForm(oidcIssuer);
  }

  // Login and fetch
  if (oidcIssuer) {
    loginAndFetch(oidcIssuer, employeesUrl, participants, solidFetch);
  }
}

function clickSelectOIDCIssuerBtn(employeesUrl, participants, solidFetch) {
  const selectedIssuer = document.getElementById('oidc-issuers').value;

  loginAndFetch(selectedIssuer, employeesUrl, participants, solidFetch);
}

function showOIDCIssuerForm(availableIssuers) {
  const $form = document.getElementById('oidc-issuer-form');
  $form.classList.remove('hidden');

  const $select = document.getElementById('oidc-issuers');
  $select.innerHTML = '';
  availableIssuers.forEach(issuer => {
    const $option = document.createElement('option');
    $option.setAttribute('value', issuer);
    $option.innerText = issuer;
    $select.appendChild($option);
  });

  document.getElementById('log-in-btn').classList.add('hidden');
  document.getElementById('webid').setAttribute('disabled', true);
}

async function loginAndFetch(oidcIssuer, employeesUrl, participants, solidFetch) {
  // 1. Call the handleIncomingRedirect() function to complete the authentication process.
  //   If the page is being loaded after the redirect from the Solid Identity Provider
  //      (i.e., part of the authentication flow), the user's credentials are stored in-memory, and
  //      the login process is complete. That is, a session is logged in
  //      only after it handles the incoming redirect from the Solid Identity Provider.
  //   If the page is not being loaded after a redirect from the Solid Identity Provider,
  //      nothing happens.
  await solidClientAuthentication.handleIncomingRedirect();

  // 2. Start the Login Process if not already logged in.
  if (!solidClientAuthentication.getDefaultSession().info.isLoggedIn) {
    if (oidcIssuer) {
      document.getElementById('current-user').classList.add('hidden');
      document.getElementById('webid-form').classList.remove('hidden');
      // The `login()` redirects the user to their identity provider;
      // i.e., moves the user away from the current page.
      await solidClientAuthentication.login({
        // Specify the URL of the user's Solid Identity Provider; e.g., "https://broker.pod.inrupt.com" or "https://inrupt.net"
        oidcIssuer,
        // Specify the URL the Solid Identity Provider should redirect to after the user logs in,
        // e.g., the current page for a single-page app.
        redirectUrl: window.location.href,
        // Pick an application name that will be shown when asked
        // to approve the application's access to the requested data.
        clientName: "KNoodle"
      });
    }
  } else {
    const webid = solidClientAuthentication.getDefaultSession().info.webId;
    const frame = {
      "@context": {
        "@vocab": "http://xmlns.com/foaf/0.1/",
        "knows": "https://data.knows.idlab.ugent.be/person/office/#",
        "schema": "http://schema.org/",
      },
      "@id": webid
    };

    const result = await getRDFasJson(webid, frame, fetch);
    const name = getPersonName(result) || webid;

    document.getElementById('current-user').innerText = 'Welcome ' + name;
    document.getElementById('current-user').classList.remove('hidden');
    document.getElementById('webid-form').classList.add('hidden');
    document.getElementById('participants').classList.remove('hidden');
    document.querySelector('#participants .loader').classList.remove('hidden');

    await fetchParticipantWebIDs(employeesUrl, participants, solidFetch);
    console.log('participants web ids fetched');
    await fetchDataOfWebIDs(participants, solidFetch);
    console.log('data of web ids fetched');
    const invalidParticipantsCount = populateParticipants(participants);

    if (invalidParticipantsCount > 0) {
      document.getElementById('invalid-participants').classList.remove('hidden');
      document.getElementById('invalid-participants-count').innerText = invalidParticipantsCount;
    }

    document.querySelector('#participants .loader').classList.add('hidden');
    document.getElementById('find-slots').classList.remove('hidden');
  }
}

async function fetchDataOfWebIDs(participants, fetch) {
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
          calendar
        };
      } catch (e) {
        if (e.includes && e.includes('conversion')) {
          participants[id].error = e;
        } else {
          participants[id].error = 'Unable to fetch data.'
        }
      }
    }
  }
}

function populateParticipants(participants) {
  const dataArray = sortParticipants(participants);
  const $validList = document.getElementById('participant-list');
  const $invalidList = document.getElementById('invalid-participants-list');
  $validList.innerHTML = '';
  $invalidList.innerHTML = '';
  let invalidParticipants = 0;

  dataArray.forEach(data => {
    const id = data.id;

    if (data.error || !data.calendar) {
      invalidParticipants++;
      const $li = document.createElement('li');
      $li.innerText = data.name || id;

      if (data.error) {
        $li.innerText += ' (Error: ' + data.error + ')';
      } else {
        $li.innerText += ' (No availability calendar found.)'
      }

      $invalidList.appendChild($li);
    } else {
      const $div = document.createElement('div');
      const $input = document.createElement('input');
      $input.setAttribute('type', 'checkbox');
      $input.setAttribute('id', id);
      $input.setAttribute('name', id);

      $div.appendChild($input);

      const $label = document.createElement('label');
      $label.setAttribute('for', id);
      $label.innerText = data.name || id;
      $div.appendChild($label);

      $validList.appendChild($div);
    }
  });

  return invalidParticipants;
}

async function findSlots(urls, solidFetch) {
  const calendars = [];

  const frame = {
    "@context": { "@vocab": "http://schema.org/" },
    "@type": "Event"
  };

  let error = undefined;

  for (let i = 0; i < urls.length; i++) {
    try {
      const data = await getRDFasJson(urls[i], frame, solidFetch);
      calendars.push(data['@graph'] || data);
    } catch (e) {
      if (e.includes && e.includes('ForbiddenHttpError')) {
        error = new Error('Forbidden to access: ' + urls[i]);
        error.url = urls[i];
      } else {
        error = new Error(`${e.message}: ${urls[i]}`);
        error.url = urls[i];
      }

      break;
    }
  }

  let slots = undefined;

  if (!error) {
    slots = intersect(...calendars);
  }

  return { slots, error }
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