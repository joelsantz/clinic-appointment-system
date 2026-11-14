export const APPOINTMENTS_STORAGE_KEY = "clinicAppointments";

export function loadAppointments(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(APPOINTMENTS_STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item) => item && typeof item.id === "string") : [];
  } catch {
    return [];
  }
}

export function saveAppointment(appointment, storage = globalThis.localStorage) {
  const appointments = loadAppointments(storage);
  const updated = [...appointments.filter(({ id }) => id !== appointment.id), appointment];
  storage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
