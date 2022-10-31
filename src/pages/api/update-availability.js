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
  createAcl,
  setPublicDefaultAccess,
  setPublicResourceAccess,
  saveAclFor,
  saveSolidDatasetAt,
  hasResourceAcl,
  getSolidDatasetWithAcl,
  universalAccess,
  setAgentDefaultAccess,
  setAgentResourceAccess,
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

    let success = await updateAvailability(webid, authFetch, calendarRdf);
    if (success) {
      response.status(200).json(calendarRdf);
    } else {
      response.status(400).json("");
    }
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

const updatePodStorageSpace = async (webID, authFetch) => {
  const storageLocation = webID.substring(0, webID.indexOf("profile") + 8);
  const response = await authFetch(webID, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/sparql-update",
    },
    body: `
    PREFIX space: <http://www.w3.org/ns/pim/space#>
    INSERT DATA {
      <#me> space:storage <${storageLocation}>.
   }`,
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
  await updatePodStorageSpace(webID, authFetch);

  const mypods = await getPodUrlAll(webID, { fetch: authFetch });
  const SELECTED_POD = mypods[0];
  const availabilityUrl = `${SELECTED_POD}availability`;
  console.log("My availability url: ");
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
      console.log("Creating a solid dataset...");
      myAvailabilityCalendar = createSolidDataset();
    } else {
      console.error(error.message);
    }
  }
  try {
    console.log("Saving dataset...");
    await saveSolidDatasetAt(availabilityUrl, myAvailabilityCalendar, {
      fetch: authFetch,
    });

    const READ_ACCESS = {
      read: true,
      write: false,
      append: false,
      control: false,
    };

    const FULL_ACCESS = {
      read: true,
      write: true,
      append: true,
      control: true,
    };
    console.log("Updating availability data...");
    await updatePodAvailabilityPut(availabilityUrl, authFetch, rdf);
    console.log("Updating Web ID URL...");
    await updateWebIdAvailability(availabilityUrl, webID, authFetch);

    console.log("Fetching solid dataset with acl...");
    const availabilityWithAcl = await getSolidDatasetWithAcl(availabilityUrl, {
      fetch: authFetch,
    });

    console.log("Setting up acl...");
    if (!hasResourceAcl(availabilityWithAcl)) {
      console.log("Creating acl...");
      let calendarAcl = createAcl(availabilityWithAcl);
      calendarAcl = setPublicDefaultAccess(calendarAcl, READ_ACCESS);
      calendarAcl = setPublicResourceAccess(calendarAcl, READ_ACCESS);

      // Set full access for the user itself
      calendarAcl = setAgentDefaultAccess(calendarAcl, webID, FULL_ACCESS);
      calendarAcl = setAgentResourceAccess(calendarAcl, webID, FULL_ACCESS);

      await saveAclFor(availabilityWithAcl, calendarAcl, { fetch: authFetch });
    } else {
      console.log("Has acl already!");
      universalAccess
        .setPublicAccess(
          availabilityUrl,
          { read: true, write: false },
          { fetch: authFetch }
        )
        .then((newAccess) => {
          if (newAccess === null) {
            console.log("Could not load access details for this Resource.");
          } else {
            console.log("Returned Public Access:: ", JSON.stringify(newAccess));
          }
        });
    }
    console.log("Finished creating/updating pod!");
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
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
