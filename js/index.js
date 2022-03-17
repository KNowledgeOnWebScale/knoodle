import {
  getPersonName,
  getRDFasJson,
  getMostRecentWebID,
  setMostRecentWebID
} from './utils';
import {
  getSelectedParticipantWebIDs,
  fetchParticipantWebIDs,
  setSelectedParticipantUrls, fetchDataOfParticipants, addParticipantToList
} from './participants';
import {findAndShowSlots} from "./slots";

window.onload = async () => {
  let solidFetch = solidClientAuthentication.fetch;
  const participants = {
    'dummy1': {
      name: 'Dummy 1',
      calendar: {
        url: 'test:dummy1',
        status: 'not-downloaded',
        data: undefined
      }
    },
    'dummy2': {
      name: 'Dummy 2',
      calendar: {
        url: 'test:dummy2',
        status: 'not-downloaded',
        data: undefined
      }
    }
  };
  const employeesUrl = 'https://data.knows.idlab.ugent.be/person/office/employees.ttl';

  loginAndFetch(null, employeesUrl, participants, solidFetch);

  document.getElementById('btn').addEventListener('click', async () => {
    document.getElementById('error').classList.add('hidden');
    document.getElementById('available-slots').classList.add('hidden');
    document.querySelector('#find-slots .loader').classList.remove('hidden');
    const urls = getSelectedParticipantWebIDs(participants);
    console.log(urls);

    if (urls.length < 2) {
      const $error = document.getElementById('error');
      $error.innerText = 'Please select at least 2 participants.';
      $error.classList.remove('hidden');
      document.querySelector('#find-slots .loader').classList.add('hidden');
    } else {
      findAndShowSlots(urls, solidFetch, participants);
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

  document.getElementById('log-in-btn').addEventListener('click', () => {
    clickLogInBtn(employeesUrl, participants, solidFetch)
  });
  document.getElementById('select-oidc-issuer-btn').addEventListener('click', () => {
    clickSelectOIDCIssuerBtn(employeesUrl, participants, solidFetch)
  });
  document.getElementById('show-personal-slots-btn').addEventListener('click', () => {
    const webId = getMostRecentWebID();
    findAndShowSlots([webId], solidFetch, participants);
    setSelectedParticipantUrls(participants, [webId]);
  });

  const webIDInput = document.getElementById('webid');
  webIDInput.value = getMostRecentWebID();
  webIDInput.addEventListener("keyup", ({key}) => {
    if (key === "Enter") {
      clickLogInBtn(employeesUrl, participants, solidFetch);
    }
  })
};

async function clickLogInBtn(employeesUrl, participants, solidFetch) {
  // Hide no OIDC issuer error
  document.getElementById('no-oidc-issuer-error').classList.add('hidden');

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
      "solid:oidcIssuer": {"@type": "@id"}
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
  } else {
    document.getElementById('no-oidc-issuer-error').classList.remove('hidden');
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
    console.log(`All participants' WebIDs fetched.`);

    const $validList = document.getElementById('participant-list');
    const $invalidList = document.getElementById('invalid-participants-list');
    $validList.innerHTML = '';
    $invalidList.innerHTML = '';

    addParticipantToList(participants, 'dummy1', solidFetch);
    addParticipantToList(participants, 'dummy2', solidFetch);
    await fetchDataOfParticipants(participants, solidFetch, addParticipantToList);
    console.log('All participants loaded.');

    document.querySelector('#participants .loader').classList.add('hidden');
    document.getElementById('find-slots').classList.remove('hidden');
  }
}

