"use client";

import { usePathname, useRouter } from "next/navigation";
import "./adminNavbar.css";

export default function AdminNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    router.push("/login");
  };

  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <nav className="admin-navbar">

      <div className="admin-nav-container">

        {/* LOGO */}

        <div
          className="admin-logo"
          onClick={() => router.push("/dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              router.push("/dashboard");
            }
          }}
        >
          <span className="admin-logo-icon">
            🛍️
          </span>

          <span className="admin-logo-text">
            ShopEase Admin
          </span>
        </div>


        {/* ADMIN NAVIGATION */}

        
        <div className="admin-nav-actions">

          <span className="admin-label">
            👑 Admin
          </span>

          <button
            className="admin-home-button"
            onClick={() => router.push("/")}
          >
            Home
          </button>

          <button
            className="admin-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>

    </nav>
  );
}