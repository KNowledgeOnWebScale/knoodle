import React, { useState, useEffect } from "react";
import { LoginButton } from "@inrupt/solid-ui-react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { getRDFasJson } from "../utils/fetchHelper";
import {
  handleIncomingRedirect,
  login,
} from "@inrupt/solid-client-authn-browser";
import { useBaseUrl } from "../context/BaseUrlContex";

const providers = [
  { title: "Inrupt Pod Spaces", url: "https://broker.pod.inrupt.com/" },
  { title: "inrupt.net", url: "https://inrupt.net/" },
  { title: "solidcommunity.net", url: "https://solidcommunity.net/" },
  { title: "Solid Web", url: "https://solidweb.org/" },
  { title: "Trinpod", url: "https://trinpod.us/" },
  { title: "Oxford", url: "https://test.pod.ewada.ox.ac.uk" },
];

export default function Login() {
  const [baseUrl, setBaseUrl] = useBaseUrl();
  const [provider, setProvider] = useState("");
  const [inputWebId, setInputWebId] = useState("");

  async function getProviderFromWebId(webId, fetch) {
    // Get issuer
    const frame = {
      "@context": {
        "@vocab": "http://xmlns.com/foaf/0.1/",
        knows: "https://data.knows.idlab.ugent.be/person/office/#",
        schema: "http://schema.org/",
        solid: "http://www.w3.org/ns/solid/terms#",
        "solid:oidcIssuer": { "@type": "@id" },
      },
      "@id": webId,
    };

    const result = await getRDFasJson(webId, frame, fetch);
    const oidcIssuer = result["solid:oidcIssuer"];
    return oidcIssuer;
  }

  return (
    <div>
      <Container maxWidth="sm">
        <Typography component="h2" variant="h5" color="inherit" noWrap>
          Sign in
        </Typography>
        <Typography
          component="h2"
          variant="body1"
          color="inherit"
          noWrap
          sx={{ flex: 1 }}
        >
          Enter your pod provider URL
        </Typography>
        <Stack
          spacing={2}
          direction="column"
          alignItems="center"
          sx={{ mt: 2 }}
        >
          {/* <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="demo-simple-select-label">
              Select pod provider
            </InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={provider}
              label="Select pod provider"
              onChange={(event) => {
                setProvider(event.target.value);
              }}
            >
              {providers.map((item, idx) => (
                <MenuItem key={idx} value={item["url"]}>
                  {item["title"]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box display="flex" alignItems="center" justifyContent="center">
            or
          </Box> */}
          <TextField
            id="outlined-basic"
            fullWidth
            label="Pod Provider URL"
            variant="outlined"
            onChange={(event) => {
              setProvider(event.target.value);
            }}
          />

          <LoginButton
            authOptions={{ clientName: "solid calendar" }}
            oidcIssuer={provider}
            redirectUrl={baseUrl}
            onError={console.error}
          >
            <Button sx={{ mt: 1, mb: 2 }} variant="outlined">
              Log in
            </Button>
          </LoginButton>
        </Stack>
        <Box display="flex" alignItems="center" justifyContent="center">
          ... or enter your web ID
        </Box>
        <Stack
          spacing={2}
          direction="column"
          alignItems="center"
          sx={{ mt: 2 }}
        >
          <TextField
            id="outlined-basic"
            label="Web ID"
            fullWidth
            variant="outlined"
            onChange={async (event) => {
              setInputWebId(event.target.value);
            }}
          />
          <Button
            sx={{ mt: 1 }}
            variant="outlined"
            onClick={async () => {
              let prov = await getProviderFromWebId(inputWebId, fetch);
              await handleIncomingRedirect({
                url: currentUrl,
                restorePreviousSession: true,
              });
              await login({
                oidcIssuer: prov,
                redirectUrl: currentUrl,
                clientName: "KNoodle",
              });
            }}
          >
            Log in with Web ID
          </Button>
          <Typography
            component="h2"
            variant="body1"
            color="inherit"
            noWrap
            sx={{ flex: 1 }}
          >
            [NOTE: Please use a CSS based provider!]
          </Typography>
        </Stack>
      </Container>
    </div>
  );
}
