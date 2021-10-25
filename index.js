window.onload = async () => {
  const participants = {
    'https://pieterheyvaert.com/#me': {},
    'https://data.knows.idlab.ugent.be/person/givdwiel/#me': {},
    'https://data.knows.idlab.ugent.be/person/do-not-exist/#me': {},
    'dummy1': {
      name: 'Dummy 1',
      calendar: 'test:dummy1'
    },
    'dummy2': {
      name: 'Dummy 2',
      calendar: 'test:dummy2'
    }
  };

  document.getElementById('btn').addEventListener('click', () => {
    const urls = getSelectedParticipantUrls();
    console.log(urls);
    findSlots(urls);
  });

  await fetchWebIDs();
  populateParticipants();

  async function fetchWebIDs() {
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

    const slots = intersect(...calendars);
    const $ul = document.createElement('ul');

    slots.forEach(slot => {
      const $li = document.createElement('li');
      $li.innerText = `${dayjs(slot.startDate).format('dddd YYYY-MM-DD HH:mm')} - ${dayjs(slot.endDate).format('dddd YYYY-MM-DD HH:mm')}`;
      $ul.appendChild($li);
    });

    document.getElementById('slots').innerHTML = '';
    document.getElementById('slots').appendChild($ul);
  }

  function populateParticipants() {
    const webids = Object.keys(participants);
    const $list = document.getElementById('participant-list');
    $list.innerHTML = '';

    webids.forEach(id => {
      const data = participants[id];
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
                console.log(result);
                let doc = await jsonld.fromRDF(result, {format: 'application/n-quads'});
                doc = await jsonld.frame(doc, frame)
                resolve(doc['@graph']);
              }
            });
          }
        });
      } catch (e) {
        reject(err);
      }
    });
  }
};