import * as React from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useState } from "react";

export default function OneLineForm({
  id,
  label,
  trigger,
  required,
  buttonText,
  addFriend,
}) {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    trigger(data.get(id));
  };

  const [val, setVal] = useState("");

  return (
    <>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12}>
            <TextField
              required={required}
              id={id}
              name={id}
              label={label}
              onChange={(e) => {
                setVal(e.currentTarget.value);
              }}
              fullWidth
              variant="standard"
            />
            <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2 }}>
              {buttonText}
            </Button>
            <Button
              onClick={() => {
                addFriend(val);
              }}
              variant="contained"
              sx={{ mt: 3, mb: 2, ml: 3 }}
            >
              {"Add Friend"}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
