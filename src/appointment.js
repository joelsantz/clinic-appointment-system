export const CLINIC_OPEN_MINUTES = 8 * 60;
export const LAST_START_MINUTES = 17 * 60 + 30;
export const APPOINTMENT_DURATION = 30;

export const patients = [
  { id: "p-1001", name: "Sofia Martinez" },
  { id: "p-1002", name: "Daniel Johnson" },
  { id: "p-1003", name: "Emma Wilson" },
];

export const resources = {
  doctor: "Dr. Maya Patel",
  room: "Examination Room 1",
};

export const unavailableSlots = {
  "10:00": "booked",
  "12:30": "blocked",
  "15:00": "booked",
};

export function appointmentId(date, time) {
  return `${date}T${time}`;
}

export function todayInLocalTime(now = new Date()) {
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) return false;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function isValidTimeSlot(time) {
  if (!/^\d{2}:\d{2}$/.test(time ?? "")) return false;
  const [hour, minute] = time.split(":").map(Number);
  const totalMinutes = hour * 60 + minute;
  return (
    totalMinutes >= CLINIC_OPEN_MINUTES &&
    totalMinutes <= LAST_START_MINUTES &&
    (totalMinutes - CLINIC_OPEN_MINUTES) % APPOINTMENT_DURATION === 0
  );
}

export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function buildTimeSlots({ date = "", appointments = [] } = {}) {
  const reservedIds = new Set(appointments.map(({ id }) => id));
  const slots = [];
  for (
    let minutes = CLINIC_OPEN_MINUTES;
    minutes <= LAST_START_MINUTES;
    minutes += APPOINTMENT_DURATION
  ) {
    const time = minutesToTime(minutes);
    const isReserved = date && reservedIds.has(appointmentId(date, time));
    slots.push({
      time,
      status: isReserved ? "booked" : unavailableSlots[time] ?? "available",
    });
  }
  return slots;
}

export function formatTime(time) {
  const [hourText, minute] = time.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${minute} ${suffix}`;
}

export function addMinutes(time, amount) {
  const [hour, minute] = time.split(":").map(Number);
  return minutesToTime(hour * 60 + minute + amount);
}

export function validateAppointment(
  { patientId, date, time },
  { appointments = [], today = todayInLocalTime() } = {},
) {
  const errors = {};

  if (!patientId) errors.patientId = "Select a patient.";
  if (!date) {
    errors.date = "Select an appointment date.";
  } else if (!isValidDate(date)) {
    errors.date = "Enter a valid appointment date.";
  } else if (date < today) {
    errors.date = "Appointment date cannot be in the past.";
  }
  if (!time) errors.time = "Choose an available time.";

  if (time && !isValidTimeSlot(time)) {
    errors.time = "Choose a valid 30-minute slot during clinic hours.";
  }

  const status = time ? unavailableSlots[time] : undefined;
  if (status === "booked") {
    errors.time = "That time is already booked. Double booking is not allowed.";
  }
  if (status === "blocked") {
    errors.time = "That time is blocked and cannot be booked.";
  }

  if (date && time && appointments.some(({ id }) => id === appointmentId(date, time))) {
    errors.time = "That date and time are already booked. Double booking is not allowed.";
  }

  return errors;
}

export function createAppointment({ patientId, date, time }, options = {}) {
  const errors = validateAppointment({ patientId, date, time }, options);
  if (Object.keys(errors).length) return { ok: false, errors };

  const patient = patients.find((item) => item.id === patientId);
  if (!patient) {
    return { ok: false, errors: { patientId: "Select a registered patient." } };
  }

  return {
    ok: true,
    appointment: {
      id: appointmentId(date, time),
      patient,
      date,
      startTime: time,
      endTime: addMinutes(time, APPOINTMENT_DURATION),
      duration: APPOINTMENT_DURATION,
      status: "Active",
      ...resources,
    },
  };
}
