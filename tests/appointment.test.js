import test from "node:test";
import assert from "node:assert/strict";
import {
  APPOINTMENT_DURATION,
  appointmentId,
  buildTimeSlots,
  createAppointment,
  formatTime,
  isValidDate,
  isValidTimeSlot,
  validateAppointment,
} from "../src/appointment.js";
import {
  APPOINTMENTS_STORAGE_KEY,
  loadAppointments,
  saveAppointment,
} from "../src/storage.js";

const TODAY = "2026-11-14";

test("builds every 30-minute slot from 08:00 through 17:30", () => {
  const slots = buildTimeSlots();
  assert.equal(slots.length, 20);
  assert.equal(slots[0].time, "08:00");
  assert.equal(slots.at(-1).time, "17:30");
});

test("marks booked and blocked slots as unavailable", () => {
  const slots = new Map(buildTimeSlots().map((slot) => [slot.time, slot.status]));
  assert.equal(slots.get("10:00"), "booked");
  assert.equal(slots.get("12:30"), "blocked");
  assert.equal(slots.get("15:00"), "booked");
});

test("validates required appointment fields", () => {
  assert.deepEqual(validateAppointment({}, { today: TODAY }), {
    patientId: "Select a patient.",
    date: "Select an appointment date.",
    time: "Choose an available time.",
  });
});

test("prevents double booking", () => {
  const errors = validateAppointment(
    { patientId: "p-1001", date: "2026-11-18", time: "10:00" },
    { today: TODAY },
  );
  assert.match(errors.time, /already booked/i);
});

test("prevents booking a blocked slot", () => {
  const errors = validateAppointment(
    { patientId: "p-1001", date: "2026-11-18", time: "12:30" },
    { today: TODAY },
  );
  assert.match(errors.time, /blocked/i);
});

test("creates an active 30-minute appointment with one doctor and room", () => {
  const result = createAppointment(
    { patientId: "p-1001", date: "2026-11-18", time: "09:00" },
    { today: TODAY },
  );
  assert.equal(result.ok, true);
  assert.equal(result.appointment.status, "Active");
  assert.equal(result.appointment.duration, APPOINTMENT_DURATION);
  assert.equal(result.appointment.endTime, "09:30");
  assert.equal(result.appointment.doctor, "Dr. Maya Patel");
  assert.equal(result.appointment.room, "Examination Room 1");
  assert.equal(result.appointment.id, "2026-11-18T09:00");
});

test("formats times for the interface", () => {
  assert.equal(formatTime("08:00"), "08:00 AM");
  assert.equal(formatTime("13:30"), "01:30 PM");
});

test("creates reservation identifiers from date and time", () => {
  assert.equal(appointmentId("2026-11-18", "09:00"), "2026-11-18T09:00");
});

test("validates calendar dates, past dates, clinic hours, and 30-minute intervals", () => {
  assert.equal(isValidDate("2026-02-29"), false);
  assert.equal(isValidDate("2026-11-18"), true);
  assert.equal(isValidTimeSlot("08:15"), false);
  assert.equal(isValidTimeSlot("07:30"), false);
  assert.equal(isValidTimeSlot("17:30"), true);

  const past = validateAppointment(
    { patientId: "p-1001", date: "2026-11-13", time: "09:00" },
    { today: TODAY },
  );
  assert.match(past.date, /past/i);

  const invalidTime = validateAppointment(
    { patientId: "p-1001", date: "2026-11-18", time: "09:15" },
    { today: TODAY },
  );
  assert.match(invalidTime.time, /30-minute slot/i);
});

test("prevents a reservation already stored for the same date and time", () => {
  const appointments = [{ id: "2026-11-18T09:00" }];
  const errors = validateAppointment(
    { patientId: "p-1001", date: "2026-11-18", time: "09:00" },
    { appointments, today: TODAY },
  );
  assert.match(errors.time, /already booked/i);

  const slots = buildTimeSlots({ date: "2026-11-18", appointments });
  assert.equal(slots.find(({ time }) => time === "09:00").status, "booked");
  assert.equal(slots.find(({ time }) => time === "09:30").status, "available");
});

test("persists appointments in browser-compatible storage", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const appointment = { id: "2026-11-18T09:00", date: "2026-11-18", startTime: "09:00" };

  saveAppointment(appointment, storage);

  assert.equal(values.has(APPOINTMENTS_STORAGE_KEY), true);
  assert.deepEqual(loadAppointments(storage), [appointment]);
});
