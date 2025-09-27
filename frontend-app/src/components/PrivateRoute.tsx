
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { ReactNode, useEffect } from "react";

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  // Check if user has a valid role
  if (user && user.role && !["ADMIN", "LEADER", "USER"].includes(user.role)) {
    router.push("/login");
    return null;
  }

  return <>{children}</>;
};

export default PrivateRoute;
