"use client";
import type { ReactNode } from "react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

export const Provider = ({ children }: { children: ReactNode }) => {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
};
