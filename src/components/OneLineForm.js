import * as React from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

export default function OneLineForm({ id, label, trigger }) {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    trigger(data.get(id));
  };

  return (
    <>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12}>
            <TextField
              required
              id={id}
              name={id}
              label={label}
              fullWidth
              variant="standard"
            />
            <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2 }}>
              Update
            </Button>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
