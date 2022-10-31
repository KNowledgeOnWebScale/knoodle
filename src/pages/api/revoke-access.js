import prisma from "../../../lib/prisma";

export default async function handler(request, response) {
  let { ics, webid } = JSON.parse(request.body);

  const result = await prisma.user.delete({
    where: {
      webid: webid,
    },
  });
  console.log(result);

  response.status(200).json(result);
}
