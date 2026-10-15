const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Pages that cannot be used without an account.
const PROTECTED_PATHS = ["/cart", "/profile", "/dashboard", "/admin"];

function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("authChanged"));
}

export async function apiFetch(endpoint, options = {}) {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");

  const makeRequest = (token) => {
    const headers = { ...(options.headers || {}) };

    // Guests have no token: never send "Bearer null".
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    return fetch(`${API_URL}/api${endpoint}`, { ...options, headers });
  };

  let response = await makeRequest(accessToken);

  if (response.status !== 401 || !accessToken) {
    return response;
  }

  // Access token expired: try to refresh it.
  if (refreshToken) {
    try {
      const refreshResponse = await fetch(`${API_URL}/api/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshResponse.ok) {
        const { access } = await refreshResponse.json();
        localStorage.setItem("access_token", access);
        return makeRequest(access);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }
  }

  // Session is no longer valid: log out and retry as a guest,
  // so public pages (products, categories) still load.
  clearSession();
  response = await makeRequest(null);

  // Only pages that really need an account go to login. Background
  // calls on public pages (e.g. the navbar cart counter) fail quietly.
  const onProtectedPage = PROTECTED_PATHS.some((path) =>
    window.location.pathname.startsWith(path)
  );

  if (response.status === 401 && onProtectedPage) {
    window.location.href = "/login";
  }

  return response;
}
