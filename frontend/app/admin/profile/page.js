
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "./profile.css";
import { apiFetch } from "@/app/components/apiFetch";

function AdminProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Logged-in user
  const [user, setUser] = useState(null);

  // Current tab
  const [activeTab, setActiveTab] = useState("account");

  // Account form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  // Password form data
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Loading state
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // GET USER FROM LOCAL STORAGE
  // --------------------------------------------------

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      // Only admin/staff can access this page
      if (!parsedUser.is_staff) {
        router.replace("/");
        return;
      }

      setUser(parsedUser);

      // Fill account form
      setFormData({
        firstName:
          parsedUser.first_name ||
          parsedUser.firstName ||
          parsedUser.username?.split(" ")[0] ||
          "",

        lastName:
          parsedUser.last_name ||
          parsedUser.lastName ||
          "",

        email:
          parsedUser.email || "",
      });

    } catch (error) {
      console.error("Invalid user data:", error);

      localStorage.removeItem("user");

      router.replace("/login");
    }
  }, [router]);

  // --------------------------------------------------
  // GET ACTIVE TAB FROM URL
  // --------------------------------------------------

  useEffect(() => {
    const tab = searchParams.get("tab");

    if (tab === "password") {
      setActiveTab("password");
    } else {
      setActiveTab("account");
    }
  }, [searchParams]);

  // --------------------------------------------------
  // CHANGE TAB
  // --------------------------------------------------

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    router.push(`/admin/profile?tab=${tab}`);
  };

  // --------------------------------------------------
  // ACCOUNT INPUT CHANGE
  // --------------------------------------------------

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // --------------------------------------------------
  // PASSWORD INPUT CHANGE
  // --------------------------------------------------

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  // --------------------------------------------------
  // SAVE ACCOUNT / PASSWORD
  // --------------------------------------------------

  const handleSave = async (e) => {
    e.preventDefault();

    if (!user) return;

    setLoading(true);

    try {
      // ==================================================
      // ACCOUNT TAB
      // ==================================================

      if (activeTab === "account") {
        await apiFetch(`/admin-users/${user.id}/`, {
          method: "PATCH",
          body: JSON.stringify(formData),
        });

        // Update user in frontend
        const updatedUser = {
          ...user,

          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
        };

        // Update localStorage
        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );

        // Update React state
        setUser(updatedUser);

        alert("Profile updated successfully!");
      }

      // ==================================================
      // PASSWORD TAB
      // ==================================================

      else if (activeTab === "password") {

        // Check empty password
        if (!passwordData.newPassword) {
          alert("Please enter a new password!");
          return;
        }

        // Check confirm password
        if (!passwordData.confirmPassword) {
          alert("Please confirm your password!");
          return;
        }

        // Check passwords match
        if (
          passwordData.newPassword !==
          passwordData.confirmPassword
        ) {
          alert("Passwords do not match!");
          return;
        }

        // Minimum password length
        if (passwordData.newPassword.length < 8) {
          alert(
            "Password must be at least 8 characters!"
          );
          return;
        }

        // Call password API
        await apiFetch(
          `/admin-password/${user.id}/`,
          {
            method: "PATCH",

            body: JSON.stringify({
              password: passwordData.newPassword,
            }),
          }
        );

        alert("Password updated successfully!");

        // Clear password fields
        setPasswordData({
          newPassword: "",
          confirmPassword: "",
        });
      }

    } catch (error) {
      console.error("Update error:", error);

      alert("Update failed!");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="profile-page">

      {/* ================= HEADER ================= */}

      <div className="profile-page-header">

        <div>
          <h1>Edit Profile</h1>
        </div>

        <div className="breadcrumb">

          <span
            onClick={() =>
              router.replace("/dashboard")
            }
            style={{ cursor: "pointer" }}
          >
            🏠
          </span>

          <span>›</span>

          <span>Edit Profile</span>

        </div>

      </div>

      {/* ================= PROFILE CARD ================= */}

      <div className="profile-card">

        {/* ================= LEFT TABS ================= */}

        <div className="profile-tabs">

          <div className="profile-tabs-title">
            Profile Information
          </div>

          {/* ACCOUNT TAB */}

          <button
            type="button"
            className={
              activeTab === "account"
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() =>
              handleTabChange("account")
            }
          >
            Account
          </button>

          {/* PASSWORD TAB */}

          <button
            type="button"
            className={
              activeTab === "password"
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() =>
              handleTabChange("password")
            }
          >
            New Password
          </button>

        </div>

        {/* ================= RIGHT CONTENT ================= */}

        <div className="profile-content">

          {/* ==================================================
              ACCOUNT TAB
          ================================================== */}

          {activeTab === "account" && (
            <>
              <h2>Account</h2>

              <div className="profile-line" />

              <form onSubmit={handleSave}>

                {/* FIRST NAME */}

                <div className="form-row">

                  <label>
                    First Name <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* LAST NAME */}

                <div className="form-row">

                  <label>
                    Last Name <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* EMAIL */}

                <div className="form-row">

                  <label>
                    Email <span>*</span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* SAVE */}

                <button
                  type="submit"
                  className="save-profile-btn"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>

              </form>
            </>
          )}

          {/* ==================================================
              PASSWORD TAB
          ================================================== */}

          {activeTab === "password" && (
            <>
              <h2>New Password</h2>

              <div className="profile-line" />

              <form
                onSubmit={handleSave}
                className="password-form"
              >

                {/* NEW PASSWORD */}

                <div className="form-row">

                  <label>
                    New Password <span>*</span>
                  </label>

                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    required
                  />

                </div>

                {/* CONFIRM PASSWORD */}

                <div className="form-row">

                  <label>
                    Confirm Password <span>*</span>
                  </label>

                  <input
                    type="password"
                    name="confirmPassword"
                    value={
                      passwordData.confirmPassword
                    }
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                  />

                </div>

                {/* SAVE PASSWORD */}

                <button
                  type="submit"
                  className="save-profile-btn"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>

              </form>
            </>
          )}

        </div>

      </div>

    </div>
  );
}

// useSearchParams() needs a Suspense boundary for `next build`.
export default function AdminProfilePage() {
  return (
    <Suspense fallback={null}>
      <AdminProfileContent />
    </Suspense>
  );
}
