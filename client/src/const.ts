export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Quiver Hub";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "https://placehold.co/128x128/1F2937/E1E7EF?text=QH";

// Login page path for local authentication
export const getLoginUrl = () => "/login";

// Feature flags
export const ALLOW_REGISTRATION = import.meta.env.VITE_ALLOW_REGISTRATION !== "false";
