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

const providers = [
  { title: "Inrupt Pod Spaces", url: "https://broker.pod.inrupt.com/" },
  { title: "inrupt.net", url: "https://inrupt.net/" },
  { title: "solidcommunity.net", url: "https://solidcommunity.net/" },
  { title: "Solid Web", url: "https://solidweb.org/" },
  { title: "Trinpod", url: "https://trinpod.us/" },
  { title: "Oxford", url: "https://test.pod.ewada.ox.ac.uk" },
];

export default function Login() {
  const [currentUrl, setCurrentUrl] = useState("https://localhost:3000");
  const [provider, setProvider] = useState("");

  useEffect(() => {
    setCurrentUrl(window.location.origin);
  }, [setCurrentUrl]);

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
          Select your pod provider or input custom server
        </Typography>
        <Stack spacing={2} direction="row" sx={{ mt: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
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
          </Box>
          <TextField
            id="outlined-basic"
            label="Custom URL"
            variant="outlined"
            onChange={(event) => {
              setProvider(event.target.value);
            }}
          />
          <LoginButton
            authOptions={{ clientName: "solid calendar" }}
            oidcIssuer={provider}
            redirectUrl={currentUrl}
            onError={console.error}
          >
            <Button sx={{ mt: 1 }} variant="outlined">
              Log in
            </Button>
          </LoginButton>
        </Stack>
      </Container>
    </div>
  );
}
