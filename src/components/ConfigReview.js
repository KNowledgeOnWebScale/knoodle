import * as React from "react";
import Typography from "@mui/material/Typography";
import OneLineForm from "./OneLineForm";
import { useUrl } from "../context/UrlContext";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

export default function Review({ updateAvailability }) {
  const [url, setUrl] = useUrl();

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Configuration review
      </Typography>
      <Typography variant="subtitle1">Allow access: Set up!</Typography>
      <Typography variant="subtitle1">.ics config: Set up!</Typography>
      <Box sx={{ pt: 3, pb: 5 }}>
        <Button variant="contained">Revoke knoodle access to calendar</Button>

        <Button onClick={updateAvailability}>Update Availability</Button>
      </Box>

      <Typography variant="h6" gutterBottom>
        Change default contact list:
      </Typography>
      <OneLineForm id="url" label="URL" trigger={setUrl} />
    </>
  );
}
