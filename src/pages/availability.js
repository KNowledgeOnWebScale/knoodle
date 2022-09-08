import CustomCalendar from "../components/CustomCalendar";
import Box from "@mui/material/Box";

export default function Availability() {
  return (
    <>
      <h3>View your availability:</h3>
      <Box sx={{ height: "80vh", mx: 3 }}>
        <CustomCalendar
          availableEvents={[]}
          vacationEvents={[]}
          clickEvent={() => {}}
        />
      </Box>
    </>
  );
}
