// Test script to verify token handling
// Run this in browser console after OAuth login

console.log("=== AUTH TOKEN DEBUG ===");
console.log("Document cookies:", document.cookie);

// Check if auth_token exists
const cookies = document.cookie.split(";");
const authCookie = cookies.find((cookie) =>
  cookie.trim().startsWith("auth_token=")
);
console.log("Auth cookie:", authCookie);

if (authCookie) {
  const token = authCookie.split("=")[1];
  console.log("Token found:", token.substring(0, 20) + "...");

  // Test API call
  fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      console.log("API Response status:", response.status);
      return response.json();
    })
    .then((data) => console.log("API Response data:", data))
    .catch((error) => console.error("API Error:", error));
} else {
  console.log("No auth token found in cookies");
}
