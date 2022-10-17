import * as React from "react";
import Typography from "@mui/material/Typography";
import OneLineForm from "./OneLineForm";
import { useUrl } from "../context/UrlContext";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

export default function Review({ updateAvailability, configStatus }) {
  const [url, setUrl] = useUrl();

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Configuration review
      </Typography>
      <Box style={{ display: "flex", alignItems: "baseline" }}>
        <Typography sx={{ fontWeight: "bold" }} variant="subtitle1">
          Allow Access:{" "}
        </Typography>
        <Typography>&nbsp;</Typography>
        {configStatus.user ? (
          <Typography variant="subtitle1" color="green">
            Set up!
          </Typography>
        ) : (
          <Typography variant="subtitle1" color="red">
            Not set up
          </Typography>
        )}
      </Box>
      <Box style={{ display: "flex", alignItems: "baseline" }}>
        <Typography sx={{ fontWeight: "bold" }} variant="subtitle1">
          .ics config:{" "}
        </Typography>
        <Typography>&nbsp;</Typography>
        {configStatus.ics ? (
          <Typography variant="subtitle1" color="green">
            Set up!
          </Typography>
        ) : (
          <Typography variant="subtitle1" color="red">
            Not set up
          </Typography>
        )}
      </Box>

      <Typography variant="h6" gutterBottom sx={{ pt: 3 }}>
        Change default contact list:
      </Typography>
      <Typography variant="subtitle1">
        The "retrieve contacts" button in the schedule meeting page is currently
        tied to the Ghent research team contacts -
        https://data.knows.idlab.ugent.be/person/office/employees.ttl. To
        configure a custom one paste a url below:
      </Typography>
      <OneLineForm
        id="url"
        label="URL (optional)"
        trigger={setUrl}
        required={false}
        buttonText={"update"}
      />
      <Box sx={{ pt: 3 }} display="flex" flexDirection="column">
        <Typography variant="subtitle1">
          Click this to revoke knoodle's access to your calendar. This will not
          delete any existing data.
        </Typography>
        <Button variant="contained">Revoke knoodle access to calendar</Button>
        <Typography sx={{ pt: 3 }} variant="subtitle1">
          Click this to have knoodle generate your availability:
        </Typography>
        <Button onClick={updateAvailability}>
          Confirm & Generate availability
        </Button>
      </Box>
    </>
  );
}
