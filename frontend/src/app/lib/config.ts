/** Backend root URL. Empty string = same origin (Docker/nginx proxy). */
const raw = import.meta.env.VITE_API_URL;
export const API_ROOT = raw === undefined ? 'http://localhost:5000' : raw;
export const API_BASE_URL = `${API_ROOT}/api`;
