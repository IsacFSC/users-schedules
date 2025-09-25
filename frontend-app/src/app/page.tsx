"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, userRole } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      // Redirect based on role if already authenticated
      switch (userRole) {
        case "ADMIN":
          router.push("/admin-dashboard");
          break;
        case "LEADER":
          router.push("/leader-dashboard");
          break;
        case "USER":
          router.push("/user-dashboard");
          break;
        default:
          router.push("/login"); // Fallback if role is unknown
      }
    }
  }, [isAuthenticated, userRole, router]);

  return <p>Loading...</p>;
}