import rdfParser from "rdf-parse";
import dayjs from 'dayjs';
import jsonld from 'jsonld'
import { ReadableWebToNodeStream } from 'readable-web-to-node-stream';

dayjs.extend(require('dayjs/plugin/isSameOrAfter'));

const dummyData = {
  'test:dummy1': getDummyAvailabilityDates(),
  'test:dummy2': getDummyAvailabilityDates(2),
  'test:dummy1-vacation': getDummyVacationDays(),
  'test:dummy2-vacation': getDummyVacationDays(3)
};

export function getPersonName(person) {
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

export function getRDFasJson(url, frame, fetch) {
  if (!fetch) {
    throw new Error('No fetch function is provided.');
  }

  if (url.startsWith('test:')) {
    return dummyData[url];
  }

  return new Promise(async (resolve, reject) => {
    // mostly taken from ldfetch
    //We like quads, so preference to serializations that we can parse fast with quads
    //Then comes JSON-LD, which is slower to parse
    //Then comes rdf/xml, turtle and n-triples, which we support in a fast manner, but it doesn’t contain named graphs
    //We also support HTML, but that’s really slow
    //We also support N3 and parse it quite fast, but we won’t do anything special with the N3 rules, so put it to low q
    var accept = 'application/trig;q=1.0,application/n-quads,application/ld+json;q=0.9,application/rdf+xml;q=0.8,text/turtle,application/n-triples';

    const myInit = {
      method: 'GET',
      headers: { 'accept': accept },
      mode: 'cors',
      cache: 'default'
    };

    try {
      const response = await fetch(url, myInit);

      if (response.status !== 200) {
        throw new Error(await response.text());
      }

      const quads = [];
      rdfParser.parse(new ReadableWebToNodeStream(response.body), { contentType: response.headers.get('content-type').split(';')[0], baseIRI: response.url })
        .on('data', (quad) => quads.push(quad))
        .on('error', (error) => reject(error))
        .on('end', async () => {
          resolve(await frameFromQuads(quads, frame));
        });
    } catch (e) {
      console.error(e);
      reject(e);
    }
  })
}

async function frameFromQuads(quads, frame) {
  var objects = { "@graph": [] };
  var graphs = {};
  for (var triple of quads) {
    let subjectURI = triple.subject.value;
    let objectURI = triple.object.value;
    //Json-LD lib uses underscores when blanknode
    if (triple.subject.termType === 'BlankNode') {
      subjectURI = '_:' + triple.subject.value;
    }
    if (triple.object.termType === 'BlankNode') {
      objectURI = '_:' + triple.object.value;
    }

    if (triple.graph.value && !graphs[triple.graph.value])
      graphs[triple.graph.value] = { "@id": triple.graph.value, "@graph": [] };

    var obj = {
      "@id": subjectURI,
    };
    if (triple.object.termType === 'Literal') {
      obj[triple.predicate.value] = { "@value": triple.object.value };
      if (triple.predicate.language)
        obj[triple.predicate.value]["@language"] = triple.object.language;
      if (triple.object.datatype)
        obj[triple.predicate.value]["@type"] = triple.object.datatype.value;

      if (triple.object.datatype.value === 'http://www.w3.org/2001/XMLSchema#string') {
        obj[triple.predicate.value] = triple.object.value;
      }
    } else if (triple.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
      obj["@type"] = objectURI;
    } else {
      obj[triple.predicate.value] = { "@id": objectURI };
    }
    if (!triple.graph.value) {
      objects["@graph"].push(obj);
    } else {
      let graphURI = triple.graph.value;
      if (triple.graph.termType === 'BlankNode') {
        graphURI = '_:' + triple.graph.value;
      }
      graphs[graphURI]["@graph"].push(obj);
    }
  }
  objects["@graph"].push(Object.values(graphs));
  return jsonld.frame(objects, frame);
}

export function getMostRecentWebID() {
  return window.localStorage.getItem('mostRecentWebID');
}

export function setMostRecentWebID(webId) {
  return window.localStorage.setItem('mostRecentWebID', webId);
}

export function removePastSlots(slots) {
  return slots.filter(slot => {
    const endDate = dayjs(slot.endDate);
    return endDate.isAfter(new Date());
  });
}

function getDummyAvailabilityDates(extra = 0) {
  const today = dayjs();

  const result = [];

  for (let i = 0; i < 7; i++) {
    const startDate = today
      .add(i + extra, 'day')
      .hour(9)
      .toISOString();

    const endDate = today
      .add(i + extra, 'day')
      .hour(17)
      .toISOString();

    result.push({ '@id': 'dummy' + (i + extra), startDate, endDate });
  }

  return result;
}

/**
 * This function returns 3 dummy vacation days.
 * @param extra - Normally, the days starts tomorrow, but with this parameter you can shift that. Default is 0.
 * @returns {{days: *[]}}
 */
function getDummyVacationDays(extra = 0) {
  const today = dayjs();

  const result = [];

  for (let i = 0; i < 3; i++) {
    const date = today
      .add(i + 1 + extra, 'day')
      .format('YYYY-MM-DD');
    result.push({ '@id': 'dummy' + (i + extra), date, partOfDay: 'knows:FullDay' });
  }

  return {days: result};
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function downloadAvailabilityCalendar(webid, participants, solidFetch) {
  participants[webid].availabilityCalendar.status = 'downloading';

  const frame = {
    "@context": {"@vocab": "http://schema.org/"},
    "@type": "Event"
  };

  const url = participants[webid].availabilityCalendar.url;

  try {
    const data = await getRDFasJson(url, frame, solidFetch);
    participants[webid].availabilityCalendar.data = data['@graph'] || data;
    participants[webid].availabilityCalendar.status = 'downloaded';
  } catch (e) {
    let error;

    if (e.includes && e.includes('ForbiddenHttpError')) {
      error = new Error('Forbidden to access: ' + url);
      error.url = url;
    } else {
      error = new Error(`${e.message}: ${url}`);
      error.url = url;
    }

    participants[webid].availabilityCalendar.error = error;
    participants[webid].availabilityCalendar.status = 'download-failed';
  }

  console.log(participants[webid]);
}

/**
 * This method downloads a vacation calendar.
 * @param webid - The WebID from which the vacation calendar has to be downloaded.
 * @param participants - The loaded participants.
 * @param solidFetch - The (Solid) fetch method to be used for HTTP calls.
 * @returns {Promise<void>}
 */
export async function downloadVacationCalendar(webid, participants, solidFetch) {
  const url = participants[webid].vacationCalendar.url;

  if (!url) {
    throw new Error(`Can't download vacation calendar for ${webid} because url is not available.`);
  }

  participants[webid].vacationCalendar.status = 'downloading';

  const frame = {
    "@context": {
      "@vocab": "https://data.knows.idlab.ugent.be/person/office/#",
      "knows": "https://data.knows.idlab.ugent.be/person/office/#",
      "xsd": "http://www.w3.org/2001/XMLSchema#",
      "knows:date": {
        "@type": "xsd:date"
      },
      "partOfDay": {"@type": "@id"}
    },
    "@id": url,
    "@type": "VacationCalendar",
    "days": [{}]
  };

  try {
    const data = await getRDFasJson(url, frame, solidFetch);

    if (!Array.isArray(data.days)) {
      data.days = [data.days];
    }

    participants[webid].vacationCalendar.data = cleanUpVacationDays(data.days);
    participants[webid].vacationCalendar.status = 'downloaded';
  } catch (e) {
    let error;

    if (e.includes && e.includes('ForbiddenHttpError')) {
      error = new Error('Forbidden to access: ' + url);
      error.url = url;
    } else {
      error = new Error(`${e.message}: ${url}`);
      error.url = url;
    }

    participants[webid].vacationCalendar.error = error;
    participants[webid].vacationCalendar.status = 'download-failed';
  }

  console.log(participants[webid].vacationCalendar);
}

/**
 * This function returns the cleaned up vacation days.
 * It sanitizes the part of the day and removes vacation days that already have passed.
 * @param days - The vacation days that need to be cleaned.
 * @returns {*} - An array of vacation days.
 */
function cleanUpVacationDays(days) {
  const today = dayjs();

  days.forEach(day => {
    day.partOfDay = day.partOfDay.replace('knows:', '');
    day.partOfDay = day.partOfDay.replace('FullDay', 'Full day');
  });

  return days.filter(day => dayjs(day.date).isSameOrAfter(today));
}
