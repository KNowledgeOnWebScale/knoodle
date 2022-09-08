import * as React from "react";
import Toolbar from "@mui/material/Toolbar";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ContactsIcon from "@mui/icons-material/Contacts";
import GroupsIcon from "@mui/icons-material/Groups";
import HomeIcon from "@mui/icons-material/Home";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useRouter } from "next/router";

const drawerWidth = 200;

function CustomDrawer(props) {
  const router = useRouter();

  return (
    <React.Fragment>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {["Homepage", "Availability", "Schedule Meeting", "Meetings"].map(
              (text, index) => (
                <ListItem key={text} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      if (text == "Homepage") router.push("/");
                      else if (text == "Schedule Meeting")
                        router.push("/schedule-meeting");
                      else router.push("/" + text.toLowerCase());
                    }}
                  >
                    <ListItemIcon>
                      {index === 0 && <HomeIcon />}
                      {index === 1 && <EventAvailableIcon />}
                      {index === 2 && <GroupsIcon />}
                      {index === 3 && <ContactsIcon />}
                    </ListItemIcon>
                    <ListItemText primary={text} />
                  </ListItemButton>
                </ListItem>
              )
            )}
          </List>
        </Box>
      </Drawer>
    </React.Fragment>
  );
}

export default CustomDrawer;
