import * as React from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

export default function SignUpForm({ trigger }) {
  const handleSubmit = async (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    console.log(data.get("email"));
    let email = data.get("email");
    let password = data.get("password");

    trigger(email, password);
  };

  return (
    <>
      <Typography variant="subtitle1">
        Don't have an availability calendar yet? Enter your email and password
        to allow knoodle to fetch availability calendar from google calendar and
        store it into your pod.
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              id="email"
              name="email"
              label="Email"
              fullWidth
              autoComplete="email"
              variant="standard"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              id="password"
              name="password"
              label="Password"
              type="password"
              fullWidth
              autoComplete="current-password"
              variant="standard"
            />
            <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2 }}>
              Generate token
            </Button>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
