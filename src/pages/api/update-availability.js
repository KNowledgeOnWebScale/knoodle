import prisma from "../../../lib/prisma";
import { convertIcsToRdf } from "../../orchestrator/ics-to-rdf-converter";
import fetch from "node-fetch";
import {
  createDpopHeader,
  generateDpopKeyPair,
  buildAuthenticatedFetch,
} from "@inrupt/solid-client-authn-core";
import {
  createSolidDataset,
  getPodUrlAll,
  getSolidDataset,
  getThingAll,
  removeThing,
} from "@inrupt/solid-client";

export default async function handler(request, response) {
  let { webid, issuer } = JSON.parse(request.body);

  const data = await prisma.user.findUnique({
    where: {
      webid: webid,
    },
  });
  if (data["token_id"] && data["token_secret"] && data["ics_url"]) {
    const id = data["token_id"];
    const secret = data["token_secret"];
    const ics = data["ics_url"];
    let authFetch = await getAccessToken(id, secret, issuer);
    const calendarRdf = await convertIcsToRdf(ics);

    await updateAvailability(webid, authFetch, calendarRdf);
    response.status(200).json(calendarRdf);
  } else {
    console.log("Something wrong updating availability...");
    response.status(400);
  }
}

const updatePodAvailabilityPut = async (availabilityUrl, authFetch, rdf) => {
  const response = await authFetch(availabilityUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "text/turtle",
    },
    body: rdf,
  });
};

const updateWebIdAvailability = async (availabilityUrl, webID, authFetch) => {
  const response = await authFetch(webID, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/sparql-update",
    },
    body: `
    PREFIX schema: <http://schema.org/>
    PREFIX knows: <https://data.knows.idlab.ugent.be/person/office/#>
    INSERT DATA {
      <#me> knows:hasAvailabilityCalendar <#availability-calendar>.
      <#availability-calendar> schema:url "${availabilityUrl}".
   }`,
  });
};

const updateAvailability = async (webID, authFetch, rdf) => {
  const mypods = await getPodUrlAll(webID, { fetch: authFetch });
  const SELECTED_POD = mypods[0];
  const availabilityUrl = `${SELECTED_POD}availability`;
  console.log(availabilityUrl);

  // Fetch or create a new availability calendar
  let myAvailabilityCalendar;

  try {
    // Attempt to retrieve the availability calendar in case it already exists.
    myAvailabilityCalendar = await getSolidDataset(availabilityUrl, {
      fetch: authFetch,
    });

    // Clear the list to override the whole list
    let items = getThingAll(myAvailabilityCalendar);
    items.forEach((item) => {
      myAvailabilityCalendar = removeThing(myAvailabilityCalendar, item);
    });
  } catch (error) {
    if (typeof error.statusCode === "number" && error.statusCode === 404) {
      // if not found, create a new SolidDataset (i.e., the reading list)
      console.log("Creating a dataset...");
      myAvailabilityCalendar = createSolidDataset();
    } else {
      console.error(error.message);
    }
  }

  await updatePodAvailabilityPut(availabilityUrl, authFetch, rdf);
  await updateWebIdAvailability(availabilityUrl, webID, authFetch);
};

const getAccessToken = async (id, secret, issuer) => {
  const dpopKey = await generateDpopKeyPair();
  // Both the ID and the secret need to be form-encoded.
  const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
  const tokenUrl = issuer + ".oidc/token";
  const access_token_response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      // The header needs to be in base64 encoding.
      authorization: `Basic ${Buffer.from(authString).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
      dpop: await createDpopHeader(tokenUrl, "POST", dpopKey),
    },
    body: "grant_type=client_credentials&scope=webid",
  });

  const { access_token: accessToken } = await access_token_response.json();
  const authFetch = await buildAuthenticatedFetch(fetch, accessToken, {
    dpopKey,
  });
  return authFetch;
};
