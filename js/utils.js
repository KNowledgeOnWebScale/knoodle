function getPersonName(person) {
  if (person.name) {
    if (Array.isArray(person.name)) {
      return person.name[0]['@value'];
    } else {
      return person.name['@value'];
    }
  } else if (person.givenName) {
    if (Array.isArray(person.givenName)) {
      return person.givenName[0]['@value'] + ' ' + person.familyName[0]['@value']
    } else {
      return person.givenName['@value'] + ' ' + person.familyName['@value'];
    }
  }
}

function getParticipantViaCalendarUrl(url, participants) {
  const webids = Object.keys(participants);
  let i = 0;

  while (i < webids.length && participants[webids[i]].calendar !== url) {
    i ++;
  }

  if (i < webids.length) {
    return webids[i];
  }

  return null;
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

      if (response.status !== 200) {
        reject(await response.text());
        return;
      }

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
                resolve(doc);
              } catch (err) {
                reject('JSON-LD conversion error');
              }
            }
          });
        }
      });
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
}

function getSelectedParticipantUrls(participants) {
  const urls = [];
  const webids = Object.keys(participants);

  webids.forEach(id => {
    if (document.getElementById(id)?.checked) {
      urls.push(participants[id].calendar);
    }
  });

  return urls;
}

async function fetchParticipantWebIDs(fetch, employeesUrl) {
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

function sortParticipants(participants) {
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

function getMostRecentWebID() {
  return window.localStorage.getItem('mostRecentWebID');
}

function setMostRecentWebID(webId) {
  return window.localStorage.setItem('mostRecentWebID', webId);
}

function removePastSlots(slots) {
  return slots.filter(slot => {
    const endDate = dayjs(slot.endDate);
    return endDate.isAfter(new Date());
  });
}

function getDummyDates(extra = 0) {
 const today = dayjs();

 const result = [];

 for (let i = 0; i < 7; i ++) {
   const startDate = today
     .add(i + extra, 'day')
     .hour(9)
     .toISOString();

   const endDate = today
     .add(i + extra, 'day')
     .hour(17)
     .toISOString();

   result.push({'@id': 'dummy' + (i + extra), startDate, endDate});
 }

 return result;
}