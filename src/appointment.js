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

export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function buildTimeSlots() {
  const slots = [];
  for (
    let minutes = CLINIC_OPEN_MINUTES;
    minutes <= LAST_START_MINUTES;
    minutes += APPOINTMENT_DURATION
  ) {
    const time = minutesToTime(minutes);
    slots.push({
      time,
      status: unavailableSlots[time] ?? "available",
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

export function validateAppointment({ patientId, date, time }) {
  const errors = {};

  if (!patientId) errors.patientId = "Select a patient.";
  if (!date) errors.date = "Select an appointment date.";
  if (!time) errors.time = "Choose an available time.";

  const status = time ? unavailableSlots[time] : undefined;
  if (status === "booked") {
    errors.time = "That time is already booked. Double booking is not allowed.";
  }
  if (status === "blocked") {
    errors.time = "That time is blocked and cannot be booked.";
  }

  return errors;
}

export function createAppointment({ patientId, date, time }) {
  const errors = validateAppointment({ patientId, date, time });
  if (Object.keys(errors).length) return { ok: false, errors };

  const patient = patients.find((item) => item.id === patientId);
  if (!patient) {
    return { ok: false, errors: { patientId: "Select a registered patient." } };
  }

  return {
    ok: true,
    appointment: {
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
