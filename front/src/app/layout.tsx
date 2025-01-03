import React from "react";
import "../styles/globals.css";
import { ChakraProvider } from "@chakra-ui/react";

const MyApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja">
      <head></head>
      <body>
        <ChakraProvider>{children}</ChakraProvider>
      </body>
    </html>
  );
};

export default MyApp;
