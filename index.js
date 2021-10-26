window.onload = async () => {
  const employeesUrl = 'https://data.knows.idlab.ugent.be/person/office/employees.ttl';
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

  document.getElementById('btn').addEventListener('click', async () => {
    document.getElementById('error').classList.add('hidden');
    document.getElementById('available-slots').classList.add('hidden');
    document.getElementById('loader').classList.remove('hidden');
    const urls = getSelectedParticipantUrls();
    console.log(urls);

    if (urls.length < 2) {
      const $error = document.getElementById('error');
      $error.innerText = 'Please select at least 2 participants.';
      $error.classList.remove('hidden');
      document.getElementById('loader').classList.add('hidden');
    } else {
      const slots = await findSlots(urls);
      showSlots(slots);
    }
  });

  await fetchParticipantWebIDs();
  console.log('participants web ids fetched');
  await fetchDataOfWebIDs();
  console.log('data of web ids fetched');
  populateParticipants();

  async function fetchParticipantWebIDs() {
    const frame = {
      "@context": {
        "@vocab": "http://schema.org/"
      },
      "employee": {}
    };

    const result = await getRDFasJson(employeesUrl, frame);
    console.log(result);
    const ids = result[0].employee.map(a => a['@id']);

    ids.forEach(id => {
      participants[id] = {};
    });

    console.log(participants);
  }

  async function fetchDataOfWebIDs() {
    const webids = Object.keys(participants);
    console.log(webids);
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
          console.log(id);
          const result = await getRDFasJson(id, frame);
          console.log(result);

          let calendar = undefined;
          let name = undefined;

          if (result.length === 0) {
            participants[id].error = 'No results in JSON-LD';
            return;
          }

          if (result[0]['knows:hasAvailabilityCalendar'] && result[0]['knows:hasAvailabilityCalendar']['schema:url']) {
            calendar = result[0]['knows:hasAvailabilityCalendar']['schema:url'];
          }

          if (result[0].name) {
            name = result[0].name['@value']
          } else if (result[0].givenName) {
            name = result[0].givenName['@value'] + ' ' + result[0].familyName['@value']
          }

          participants[id] = {
            name,
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

    console.log(participants);
  }

  async function findSlots(urls) {
    const calendars = [];

    const frame = {
      "@context": {"@vocab": "http://schema.org/"},
      "@type": "Event"
    };

    for (let i = 0; i < urls.length; i++) {
      const data = await getRDFasJson(urls[i], frame);
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
    document.getElementById('loader').classList.add('hidden');
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

  const dummyData = {
    'test:dummy1': [{
      "@id": 'dummy',
      "endDate": "2021-10-29T10:00:00.000Z",
      "startDate": "2021-10-29T09:00:00.000Z"
    }, {
      "@id": 'dummy2',
      "endDate": "2021-10-29T14:00:00.000Z",
      "startDate": "2021-10-29T13:00:00.000Z"
    }],
    'test:dummy2': [
      {
        "@id": 'dummy',
        "endDate": "2021-10-29T10:00:00.000Z",
        "startDate": "2021-10-29T09:30:00.000Z"
      }, {
        "@id": 'dummy2',
        "endDate": "2021-10-29T14:00:00.000Z",
        "startDate": "2021-10-29T13:30:00.000Z"
      }]
  }

  function getRDFasJson(url, frame) {
    if (url.startsWith('test:')) {
      return dummyData[url];
    }

    return new Promise(async (resolve, reject) => {
      const myHeaders = new Headers();
      myHeaders.append('Accept', 'text/turtle');
      const myInit = {
        method: 'GET',
        headers: myHeaders,
        mode: 'cors',
        cache: 'default'
      };
      let myRequest = new Request(url);

      try {
        const response = await fetch(myRequest, myInit);
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
};