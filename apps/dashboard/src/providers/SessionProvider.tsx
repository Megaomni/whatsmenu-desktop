"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";

type sessionProps = {
  children: React.ReactNode;
};
function NextAuthSessionProvider({ children }: sessionProps) {
  return <SessionProvider refetchInterval={0}>{children}</SessionProvider>;
}

export default NextAuthSessionProvider;
