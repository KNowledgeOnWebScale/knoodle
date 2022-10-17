import React, { useEffect, useState } from "react";
import { getRDFasJson } from "../utils/fetchHelper";
import { useSession } from "@inrupt/solid-ui-react";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import OneLineForm from "./OneLineForm";
import Review from "./ConfigReview";
import SignUpForm from "./SignUpForm";
import { useSnackbar } from "notistack";

const steps = ["Allow access", "Calendar .ics config", "Review"];

const theme = createTheme();

export default function Configuration() {
  const [activeStep, setActiveStep] = useState(0);
  const { session } = useSession();
  const webID = session.info.webId;
  const solidFetch = session.fetch;
  const [issuer, setIssuer] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const [configStatus, setConfigStatus] = useState({ user: false, ics: false });

  useEffect(() => {
    async function getIssuer() {
      const frame = {
        "@context": {
          "@vocab": "http://xmlns.com/foaf/0.1/",
          knows: "https://data.knows.idlab.ugent.be/person/office/#",
          schema: "http://schema.org/",
          solid: "http://www.w3.org/ns/solid/terms#",
          "solid:oidcIssuer": { "@type": "@id" },
        },
        "@id": webID,
      };

      const result = await getRDFasJson(webID, frame, solidFetch);
      const oidcIssuer = result["solid:oidcIssuer"];
      setIssuer(oidcIssuer);
    }
    if (!issuer && session.info.isLoggedIn) {
      getIssuer();
      getConfigState();
    }
  }, []);

  const getConfigState = async () => {
    const response = await fetch(
      "/api/config-state?" + new URLSearchParams({ webid: webID }).toString()
    );
    const data = await response.json();
    setConfigStatus(data);
    if (data["user"] && data["ics"]) {
      setActiveStep(2);
    }
  };

  const updateIcs = async (ics) => {
    if (!ics.endsWith(".ics")) {
      enqueueSnackbar("Invalid .ics url (url should end with .ics)", {
        variant: "error",
      });
      return;
    }
    const response = await fetch("/api/update-ics", {
      method: "PUT",
      body: JSON.stringify({
        ics: ics,
        webid: webID,
      }),
    });

    if (response.status == 200) {
      enqueueSnackbar("Success!", { variant: "success" });
      setConfigStatus({ ...configStatus, ics: true });
    }

    const response_text = await response.json();
  };

  const generateToken = async (email, password) => {
    const response = await fetch("/api/generate-token", {
      method: "POST",
      // The email/password fields are those of your account.
      // The name field will be used when generating the ID of your token.
      body: JSON.stringify({
        webid: webID,
        email: email,
        password: password,
        issuer: issuer,
        name: "my-token",
      }),
    });

    if (response.status >= 400 && response.status < 600) {
      enqueueSnackbar("Invalid login credentials", { variant: "error" });
      return;
    }

    if (response.status == 200) {
      setConfigStatus({ ...configStatus, user: true });
      enqueueSnackbar("Success!", { variant: "success" });
    }

    const response_json = await response.json();
    console.log(response_json);
  };

  const updateAvailability = async () => {
    const response = await fetch("/api/update-availability", {
      method: "PUT",
      body: JSON.stringify({
        webid: webID,
        issuer: issuer,
      }),
    });
    const calendarData = await response.json();
    //console.log(calendarData);
  };

  function getStepContent(step) {
    switch (step) {
      case 0:
        return <SignUpForm trigger={generateToken} />;
      case 1:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Update .ics
            </Typography>
            <Typography variant="subtitle1">
              Paste your secret address in iCal format. You can find it it your
              google calendar settings.
            </Typography>
            <OneLineForm
              id="secret"
              label="secret address in iCal format"
              trigger={updateIcs}
              required={true}
              buttonText={"Update"}
            />
          </>
        );
      case 2:
        return (
          <Review
            updateAvailability={updateAvailability}
            configStatus={configStatus}
          />
        );
      default:
        throw new Error("Unknown step");
    }
  }

  return (
    <>
      {session.info.isLoggedIn && (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Container component="main" maxWidth="md" sx={{ mb: 4 }}>
            <Paper
              variant="outlined"
              sx={{ my: { xs: 3, md: 2 }, p: { xs: 2, md: 3 } }}
            >
              <Typography component="h1" variant="h4" align="center">
                Knoodle Configuration
              </Typography>
              <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <>
                {activeStep === steps.length ? (
                  <>
                    <Typography variant="h5" gutterBottom>
                      Your configuration is all set!
                    </Typography>
                    <Typography variant="subtitle1">
                      Go schedule some meetings in knoodle!
                    </Typography>
                  </>
                ) : (
                  <>
                    {getStepContent(activeStep)}
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      {activeStep !== 0 && (
                        <Button
                          onClick={() => setActiveStep(activeStep - 1)}
                          sx={{ mt: 3, ml: 1 }}
                        >
                          Back
                        </Button>
                      )}
                      {activeStep !== steps.length - 1 && (
                        <Button
                          variant="contained"
                          onClick={() => setActiveStep(activeStep + 1)}
                          sx={{ mt: 3, ml: 1 }}
                        >
                          {"Next"}
                        </Button>
                      )}
                    </Box>
                  </>
                )}
              </>
            </Paper>
          </Container>
        </ThemeProvider>
      )}
    </>
  );
}
