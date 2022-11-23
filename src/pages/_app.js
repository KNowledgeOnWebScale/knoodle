import "../../styles/globals.css";
import Head from "next/head";
import { SessionProvider } from "@inrupt/solid-ui-react";
import Header from "../components/Header";
import CustomDrawer from "../components/CustomDrawer";
import Toolbar from "@mui/material/Toolbar";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { UrlProvider } from "../context/UrlContext";
import { SnackbarProvider } from "notistack";
import { BaseUrlProvider } from "../context/BaseUrlContex";

function MyApp({ Component, pageProps }) {
  return (
    <BaseUrlProvider>
      <UrlProvider>
        <SessionProvider restorePreviousSession={true}>
          <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
            <Head>
              <title>Solid Calendar</title>
            </Head>
            <Box sx={{ display: "flex" }}>
              <CssBaseline />
              <Header title="KNoodle" />
              <CustomDrawer />
              <Box sx={{ flexGrow: 1, pt: 3, pl: 3 }}>
                <Toolbar />
                <Component {...pageProps} />
              </Box>
            </Box>
          </SnackbarProvider>
        </SessionProvider>
      </UrlProvider>
    </BaseUrlProvider>
  );
}

export default MyApp;
