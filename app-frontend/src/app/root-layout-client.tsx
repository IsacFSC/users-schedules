"use client";

import { AuthProvider } from "../context/AuthContext";
import React from "react";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "react-hot-toast"; // Import Toaster

import LayoutContent from "../components/LayoutContent"; // Import the new component

export default function RootLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <LayoutContent>{children}</LayoutContent>
        <Toaster /> {/* Render Toaster here */}
      </AuthProvider>
    </ThemeProvider>
  );
}