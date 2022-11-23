import "../../styles/globals.css";
import Head from "next/head";
import { SessionProvider } from "@inrupt/solid-ui-react";
import Header from "../components/Header";
import CustomDrawer from "../components/CustomDrawer";
import Toolbar from "@mui/material/Toolbar";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { BaseUrlProvider } from "../context/BaseUrlContex"

function MyApp({ Component, pageProps }) {
  return (
    <BaseUrlProvider>
      <SessionProvider restorePreviousSession={true}>
        <Head>
          <title>Solid Calendar</title>
        </Head>
        <Box sx={{ display: "flex" }}>
          <CssBaseline />
          <Header title="Solid Calendar" />
          <CustomDrawer />
          <Box sx={{ flexGrow: 1, pt: 3, pl: 3 }}>
            <Toolbar />
            <Component {...pageProps} />
          </Box>
        </Box>
      </SessionProvider>
    </BaseUrlProvider>
  );
}

export default MyApp;
