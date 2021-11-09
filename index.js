let solidFetch = undefined;
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

window.onload = async () => {
  loginAndFetch();

  document.getElementById('btn').addEventListener('click', async () => {
    document.getElementById('error').classList.add('hidden');
    document.getElementById('available-slots').classList.add('hidden');
    document.querySelector('#find-slots .loader').classList.remove('hidden');
    const urls = getSelectedParticipantUrls();
    console.log(urls);

    if (urls.length < 2) {
      const $error = document.getElementById('error');
      $error.innerText = 'Please select at least 2 participants.';
      $error.classList.remove('hidden');
      document.querySelector('#find-slots .loader').classList.add('hidden');
    } else {
      const slots = await findSlots(urls);
      showSlots(slots);
    }
  });

  document.getElementById('log-in-btn').addEventListener('click', async () => {
    // Get web id
    const webId = document.getElementById('webid').value;

    // Get issuer
    const frame = {
      "@context": {
        "@vocab": "http://xmlns.com/foaf/0.1/",
        "knows": "https://data.knows.idlab.ugent.be/person/office/#",
        "schema": "http://schema.org/",
        "solid": "http://www.w3.org/ns/solid/terms#"
      },
      "@type": "Person"
    };

    const result = await getRDFasJson(webId, frame, fetch);
    const oidcIssuer = result[0]['solid:oidcIssuer']['@id'];

    // Login and fetch
    if (oidcIssuer) {
      loginAndFetch(oidcIssuer);
    }
  });

  async function findSlots(urls) {
    const calendars = [];

    const frame = {
      "@context": {"@vocab": "http://schema.org/"},
      "@type": "Event"
    };

    for (let i = 0; i < urls.length; i++) {
      const data = await getRDFasJson(urls[i], frame, solidFetch);
      calendars.push(data);
    }

    return intersect(...calendars);
  }

  function showSlots(slots) {
    const $tbody = document.querySelector('#slots tbody');
    $tbody.innerHTML = '';

    slots.forEach(slot => {
      const $tr = document.createElement('tr');
      const $from = document.createElement('td');
      const startDate = dayjs(slot.startDate);
      $from.innerText = startDate.format('dddd YYYY-MM-DD HH:mm');
      $tr.appendChild($from);

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

    document.getElementById('available-slots').classList.remove('hidden');
    document.querySelector('#find-slots .loader').classList.add('hidden');
  }

  function getSelectedParticipantUrls() {
    const urls = [];
    const webids = Object.keys(participants);

    webids.forEach(id => {
      if (document.getElementById(id).checked) {
        urls.push(participants[id].calendar);
      }
    });

    return urls;
  }
};

const employeesUrl = 'https://data.knows.idlab.ugent.be/person/office/employees.ttl';
const dummyData = {
  'test:dummy1': [{
    "@id": 'dummy',
    "endDate": "2021-11-05T10:00:00.000Z",
    "startDate": "2021-11-05T09:00:00.000Z"
  }, {
    "@id": 'dummy2',
    "endDate": "2021-11-05T14:00:00.000Z",
    "startDate": "2021-11-05T13:00:00.000Z"
  }],
  'test:dummy2': [
    {
      "@id": 'dummy',
      "endDate": "2021-11-05T10:00:00.000Z",
      "startDate": "2021-11-05T09:30:00.000Z"
    }, {
      "@id": 'dummy2',
      "endDate": "2021-11-05T14:00:00.000Z",
      "startDate": "2021-11-05T13:30:00.000Z"
    }]
}

async function loginAndFetch(oidcIssuer) {
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
    const frame = {
      "@context": {
        "@vocab": "http://xmlns.com/foaf/0.1/",
        "knows": "https://data.knows.idlab.ugent.be/person/office/#",
        "schema": "http://schema.org/",
      },
      "@type": "Person"
    };

    const result = await getRDFasJson(solidClientAuthentication.getDefaultSession().info.webId, frame, fetch);
    const name = getPersonName(result[0]) || solidClientAuthentication.getDefaultSession().info.webId;

    document.getElementById('current-user').innerText = 'Welcome ' + name;
    document.getElementById('current-user').classList.remove('hidden');
    document.getElementById('webid-form').classList.add('hidden');
    solidFetch = solidClientAuthentication.fetch;
    document.getElementById('participants').classList.remove('hidden');
    document.querySelector('#participants .loader').classList.remove('hidden');

    await fetchParticipantWebIDs(solidFetch);
    console.log('participants web ids fetched');
    await fetchDataOfWebIDs(solidFetch);
    console.log('data of web ids fetched');
    populateParticipants();

    document.querySelector('#participants .loader').classList.add('hidden');
    document.getElementById('find-slots').classList.remove('hidden');
  }
}

async function fetchParticipantWebIDs(fetch) {
  const frame = {
    "@context": {
      "@vocab": "http://schema.org/"
    },
    "employee": {}
  };

  const result = await getRDFasJson(employeesUrl, frame, fetch);
  const ids = result[0].employee.map(a => a['@id']);

  ids.forEach(id => {
    participants[id] = {};
  });

  console.log(participants);
}

async function fetchDataOfWebIDs(fetch) {
  const webids = Object.keys(participants);
  const frame = {
    "@context": {
      "@vocab": "http://xmlns.com/foaf/0.1/",
      "knows": "https://data.knows.idlab.ugent.be/person/office/#",
      "schema": "http://schema.org/"
    },
    "@type": "Person"
  };

  for (let i = 0; i < webids.length; i++) {
    const id = webids[i];

    if (id.startsWith('http')) {
      try {
        const result = await getRDFasJson(id, frame, fetch);
        let calendar = undefined;

        if (result.length === 0) {
          participants[id].error = 'No results in JSON-LD';
          return;
        }

        if (result[0]['knows:hasAvailabilityCalendar'] && result[0]['knows:hasAvailabilityCalendar']['schema:url']) {
          calendar = result[0]['knows:hasAvailabilityCalendar']['schema:url'];
        }

        participants[id] = {
          name: getPersonName(result[0]) || id,
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

function populateParticipants() {
  const dataArray = sortParticipants();
  console.log(dataArray);
  const $list = document.getElementById('participant-list');
  $list.innerHTML = '';

  dataArray.forEach(data => {
    const id = data.id;
    const $div = document.createElement('div');
    const $input = document.createElement('input');
    $input.setAttribute('type', 'checkbox');
    $input.setAttribute('id', id);
    $input.setAttribute('name', id);

    if (data.error || !data.calendar) {
      $input.setAttribute('disabled', true);
    }

    $div.appendChild($input);

    const $label = document.createElement('label');
    $label.setAttribute('for', id);
    $label.innerText = data.name || id;

    if (data.error) {
      $label.innerText += ' (Error: ' + data.error + ')';
    } else if (!data.calendar) {
      $label.innerText += ' (No availability calendar found.)'
    }

    $div.appendChild($label);

    $list.appendChild($div);
  });
}

function sortParticipants() {
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

function getRDFasJson(url, frame, fetch) {
  if (!fetch) {
    throw new Error('No fetch function is provided.');
  }

  if (url.startsWith('test:')) {
    return dummyData[url];
  }

  return new Promise(async (resolve, reject) => {
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'text/turtle');
    const myInit = {
      method: 'GET',
      headers: {'accept': 'text/turtle'},
      mode: 'cors',
      cache: 'default'
    };

    try {
      const response = await fetch(url, myInit);
      const turtle = await response.text();
      //console.log(turtle);
      const parser = new N3.Parser({format: 'text/turtle', baseIRI: url});
      const quads = [];
      parser.parse(turtle, (error, quad, prefixes) => {
        if (error) {
          reject(error);
        } else if (quad) {
          quads.push(quad);
        } else {
          const writer = new N3.Writer({format: 'application/n-quads'});
          writer.addQuads(quads);
          writer.end(async (error, result) => {
            if (error) {
              reject(error);
            } else {
              // console.log(result);
              try {
                let doc = await jsonld.fromRDF(result, {format: 'application/n-quads'});
                doc = await jsonld.frame(doc, frame)
                resolve(doc['@graph']);
              } catch (err) {
                reject('JSON-LD conversion error');
              }
            }
          });
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

function getPersonName(person) {
  if (person.name) {
    return person.name['@value']
  } else if (person.givenName) {
    return person.givenName['@value'] + ' ' + person.familyName['@value']
  }
}