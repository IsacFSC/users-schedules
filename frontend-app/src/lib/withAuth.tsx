"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Role } from "../common/types"; // Assuming you have a types file for roles

interface WithAuthOptions {
  allowedRoles?: Role[];
}

const withAuth = (
  WrappedComponent: React.ComponentType,
  options?: WithAuthOptions
) => {
  const AuthComponent = (props: any) => {
    const { isAuthenticated, userRole, isLoading } = useAuth(); // Get isLoading
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) { // Only perform checks after loading is complete
        if (!isAuthenticated) {
          router.push("/login");
        } else if (options?.allowedRoles && userRole && !options.allowedRoles.includes(userRole)) {
          // Optionally redirect to an unauthorized page or login
          router.push("/login"); // Redirect to login for unauthorized roles
        }
      }
    }, [isAuthenticated, userRole, isLoading, router, options?.allowedRoles]);

    if (isLoading) {
      return null; // Or a loading spinner while authentication status is being determined
    }

    if (!isAuthenticated || (options?.allowedRoles && userRole && !options.allowedRoles.includes(userRole))) {
      return null; // Or a loading spinner
    }

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;
