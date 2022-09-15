import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

export default function OneLineForm({ id, label }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      id: data.get(id),
    });
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
        <Grid container spacing={4}>
          <Grid item xs={9}>
            <TextField
              margin="normal"
              fullWidth
              id={id}
              label={label}
              name={id}
              autoComplete={id}
              autoFocus
            />
          </Grid>
          <Grid item xs={3}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Submit
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
