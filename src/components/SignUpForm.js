import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

export default function SignUpForm({ webid, issuer }) {
  const handleSubmit = async (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    let email = data.get("email");
    let password = data.get("password");

    const response = await fetch("/api/generate-token", {
      method: "POST",
      // headers: {
      //   Authentication:
      //     "Basic " + Buffer.from(email + ":" + password).toString("base64"),
      // },
      // The email/password fields are those of your account.
      // The name field will be used when generating the ID of your token.
      body: JSON.stringify({
        webid: webid,
        email: email,
        password: password,
        issuer: issuer,
        name: "my-token",
      }),
    });

    const response_text = await response.json();
    console.log(response_text);
  };

  return (
    <Box
      sx={{
        mx: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
        />
        {/* <FormControlLabel
          control={<Checkbox value="remember" color="primary" />}
          label="Remember me"
        /> */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          Sign In
        </Button>
      </Box>
    </Box>
  );
}
