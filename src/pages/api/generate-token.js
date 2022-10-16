import fetch from "node-fetch";
import prisma from "../../../lib/prisma";

export default async function handler(request, response) {
  let { email, password, webid, issuer } = JSON.parse(request.body);

  const token_response = await fetch(issuer + "idp/credentials/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    // The email/password fields are those of your account.
    // The name field will be used when generating the ID of your token.
    body: JSON.stringify({
      email: email,
      password: password,
      name: "my-token",
    }),
  });

  const { id, secret } = await token_response.json();
  console.log("my id: ", id, "my secret: ", secret);

  const result = await prisma.user.upsert({
    where: {
      webid: webid,
    },
    update: {
      token_id: id,
      token_secret: secret,
    },
    create: {
      webid: webid,
      token_id: id,
      token_secret: secret,
    },
  });
  console.log(result);
  //response.json(result);

  response.status(200).json(result);
}
