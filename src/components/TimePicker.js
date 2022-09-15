import React from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import Button from "@mui/material/Button";
import { google } from "calendar-link";

export default function CustomTimePicker({
  startTime,
  setStartTime,
  endTime,
  setEndTime,
}) {
  const addToCal = () => {
    const event = {
      title: "Meeting scheduled using solid",
      start: startTime,
      end: endTime,
    };
    window.open(google(event));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <h4>Set the start and end time:</h4>
      <Stack spacing={3}>
        <DateTimePicker
          label="Meeting Start Date"
          inputVariant="outlined"
          value={startTime}
          onChange={setStartTime}
          renderInput={(params) => <TextField {...params} />}
        />
        <DateTimePicker
          label="Meeting End Date"
          inputVariant="outlined"
          value={endTime}
          onChange={setEndTime}
          renderInput={(params) => <TextField {...params} />}
        />
      </Stack>
      <h4>Select your calendar:</h4>
      <Button
        onClick={(e) => {
          addToCal();
        }}
        sx={{ mb: 4 }}
        variant="outlined"
      >
        Schedule meeting using Google Calendar
      </Button>
    </LocalizationProvider>
  );
}
