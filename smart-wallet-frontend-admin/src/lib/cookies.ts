export const setCookie = (name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 7) => {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
};

export const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;

  const cookieName = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();
    if (trimmedCookie.startsWith(cookieName)) {
      return decodeURIComponent(trimmedCookie.substring(cookieName.length));
    }
  }

  return null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; samesite=lax`;
};

export const clearAdminSession = () => {
  deleteCookie("admin_access_token");
  deleteCookie("admin_user");

  if (typeof window !== "undefined") {
    window.localStorage.removeItem("admin_access_token");
    window.localStorage.removeItem("admin_user");
  }
};
