import React from "react";
import "../styles/globals.css";
import { Provider } from "~/components/Provider";

const MyApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja">
      <head></head>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
};

export default MyApp;
