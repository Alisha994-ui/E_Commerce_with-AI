"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ children }) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("access") ||
      localStorage.getItem("token");

    if (!token) {
      setIsAuthenticated(false);
      setChecking(false);

      router.replace("/login");

      return;
    }

    setIsAuthenticated(true);
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
        }}
      >
        Checking authentication...
      </div>
    );
  }

  // Agar login nahi hai
  if (!isAuthenticated) {
    return null;
  }

  return children;
}