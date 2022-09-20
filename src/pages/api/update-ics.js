import prisma from "../../../lib/prisma";

export default async function handler(request, response) {
  let { ics, webid } = JSON.parse(request.body);

  const result = await prisma.user.upsert({
    where: {
      webid: webid,
    },
    update: {
      ics_url: ics,
    },
    create: {
      webid: webid,
      ics_url: ics,
    },
  });
  console.log(result);

  response.status(200).json(result);
}
