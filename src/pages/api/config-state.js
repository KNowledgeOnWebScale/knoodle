import prisma from "../../../lib/prisma";

export default async function handler(request, response) {
  let webid = request.query.webid;

  const result = await prisma.user.findUnique({
    where: {
      webid: webid,
    },
  });
  console.log(result);
  if (result == null) {
    response.status(200).json({ user: false });
    return;
  }

  if (result["ics_url"] == null) {
    response.status(200).json({ user: true, ics: false });
    return;
  }

  response.status(200).json({ user: true, ics: true });
}
