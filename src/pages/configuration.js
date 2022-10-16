import React, { useState } from "react";
import CustomAlert from "../components/Alert";
import Configuration from "../components/Configuration";

export default function Meetings() {
  const [showInvalidIcs, setShowInvalidIcs] = useState(false);
  const [showInvalidAccess, setShowInvalidAccess] = useState(false);

  return (
    <>
      <CustomAlert
        severity="error"
        message="Invalid .ics url (url should end with .ics)"
        showAlert={showInvalidIcs}
        setAlert={setShowInvalidIcs}
      />
      <Configuration
        setShowInvalidIcs={setShowInvalidIcs}
        setShowInvalidAccess={setShowInvalidAccess}
      />
    </>
  );
}
