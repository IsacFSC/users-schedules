"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import UserAvatarDropdown from "./UserAvatarDropdown";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && (
        <div className="absolute top-4 right-4 z-50">
          <UserAvatarDropdown />
        </div>
      )}
      {children}
    </>
  );
}
