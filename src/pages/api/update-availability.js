import prisma from "../../../lib/prisma";
import { SCHEMA_INRUPT, RDF, AS } from "@inrupt/vocab-common-rdf";
import { convertIcsToRdf } from "../../orchestrator/ics-to-rdf-converter";
import fetch from "node-fetch";
import {
  createDpopHeader,
  generateDpopKeyPair,
  buildAuthenticatedFetch,
} from "@inrupt/solid-client-authn-core";
import {
  addUrl,
  addStringNoLocale,
  createSolidDataset,
  createThing,
  getPodUrlAll,
  getSolidDataset,
  getThingAll,
  getStringNoLocale,
  removeThing,
  saveSolidDatasetAt,
  setThing,
} from "@inrupt/solid-client";

export default async function handler(request, response) {
  let { webid, issuer } = JSON.parse(request.body);

  console.log("in handler, ", webid);

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
    //console.log(calendarJson);
    //console.log(JSON.stringify(calendarJson));
    response.status(200).json(calendarRdf);
  } else {
    console.log("Something wrong updating availability...");
    response.status(400);
  }

  // response.status(200).json(result);
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
  const temp_webID = "http://localhost:3000/profile/card#me";
  const mypods = await getPodUrlAll(webID, { fetch: authFetch });
  console.log("-------");
  const SELECTED_POD = mypods[0];
  const availabilityUrl = `${SELECTED_POD}availability`;
  console.log(availabilityUrl);
  console.log(rdf);

  // Fetch or create a new availability calendar
  let myAvailabilityCalendar;
  const temp_data = ["paris", "oxford", "london"];

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

  // // Add titles to the Dataset
  // let i = 0;
  // temp_data.forEach((title) => {
  //   if (title.trim() !== "") {
  //     let item = createThing({ name: "title" + i });
  //     item = addUrl(item, RDF.type, AS.Article);
  //     item = addStringNoLocale(item, SCHEMA_INRUPT.name, title);
  //     myAvailabilityCalendar = setThing(myAvailabilityCalendar, item);
  //     i++;
  //   }
  // });

  await updatePodAvailabilityPut(availabilityUrl, authFetch, rdf);
  await updateWebIdAvailability(availabilityUrl, webID, authFetch);

  // try {
  //   // Save the SolidDataset
  //   let savedAvailabilityCalendar = await saveSolidDatasetAt(
  //     availabilityUrl,
  //     myAvailabilityCalendar,
  //     { fetch: authFetch }
  //   );

  //   // Refetch the Reading List
  //   savedAvailabilityCalendar = await getSolidDataset(availabilityUrl, {
  //     fetch: authFetch,
  //   });

  //   let items = getThingAll(savedAvailabilityCalendar);

  //   let listcontent = "";
  //   for (let i = 0; i < items.length; i++) {
  //     let item = getStringNoLocale(items[i], SCHEMA_INRUPT.name);
  //     if (item !== null) {
  //       listcontent += item + "\n";
  //     }
  //   }

  //   console.log("fetched from solid pod: ");
  //   console.log(listcontent);
  // } catch (error) {
  //   console.log(error);
  // }
};

const getAccessToken = async (id, secret, issuer) => {
  const dpopKey = await generateDpopKeyPair();
  // Both the ID and the secret need to be form-encoded.
  const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
  // This URL can be found by looking at the "token_endpoint" field at
  // http://localhost:3000/.well-known/openid-configuration
  // if your server is hosted at http://localhost:3000/.
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

  // This is the Access token that will be used to do an authenticated request to the server.
  // The JSON also contains an "expires_in" field in seconds,
  // which you can use to know when you need request a new Access token.
  const { access_token: accessToken } = await access_token_response.json();

  // The DPoP key needs to be the same key as the one used in the previous step.
  // The Access token is the one generated in the previous step.
  const authFetch = await buildAuthenticatedFetch(fetch, accessToken, {
    dpopKey,
  });
  return authFetch;
};
