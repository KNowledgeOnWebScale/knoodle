import React, { useState } from "react";
import Toolbar from "@mui/material/Toolbar";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

const drawerWidth = 250;

function PeopleDrawer({
  getContacts,
  validParticipants,
  invalidParticipants,
  selectedParticipants,
  setSelectedParticipants,
}) {
  const [invalidToggle, setInvalidToggle] = useState(false);

  const handleCheck = (event, id) => {
    let updatedList = [...selectedParticipants];
    if (event.target.checked) {
      updatedList = [...selectedParticipants, id];
    } else {
      updatedList.splice(selectedParticipants.indexOf(id), 1);
    }
    setSelectedParticipants(updatedList);
  };

  return (
    <>
      <Box m="auto">
        <Button
          variant="outlined"
          onClick={() => {
            getContacts();
          }}
        >
          Retrieve contacts
        </Button>
      </Box>
      <Box sx={{ pl: 2 }}>
        <FormGroup>
          {validParticipants.map((item) => (
            <FormControlLabel
              sx={{ margin: 0 }}
              control={<Checkbox />}
              label={item.name}
              key={item.id}
              onClick={(e) => {
                handleCheck(e, item.id);
              }}
            />
          ))}
        </FormGroup>
        <div>
          <h4>Invalid participants: {invalidParticipants.length}</h4>
          {invalidToggle ? (
            <Button
              onClick={() => setInvalidToggle(false)}
              size="small"
              variant="outlined"
            >
              Hide
            </Button>
          ) : (
            <Button
              onClick={() => setInvalidToggle(true)}
              size="small"
              variant="outlined"
            >
              Show
            </Button>
          )}
          {invalidToggle && (
            <FormGroup>
              {invalidParticipants.map((item) => (
                <FormControlLabel
                  disabled
                  sx={{}}
                  control={<Checkbox />}
                  label={item.name + item.error}
                  key={item.id}
                />
              ))}
            </FormGroup>
          )}
        </div>
      </Box>
    </>
  );
}

export default PeopleDrawer;
