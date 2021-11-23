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