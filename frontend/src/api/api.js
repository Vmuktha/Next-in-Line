import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5050",
  timeout: 10000,
});

export const fetchApplications = async () => {
  const { data } = await api.get("/applications");
  return Array.isArray(data) ? data : [];
};

export const fetchApplicationEvents = async () => {
  const { data } = await api.get("/applications/events");
  return Array.isArray(data) ? data : [];
};

export const fetchApplicationHistory = async (applicationId) => {
  const { data } = await api.get(`/applications/${applicationId}/history`);
  return Array.isArray(data) ? data : [];
};

export default api;
