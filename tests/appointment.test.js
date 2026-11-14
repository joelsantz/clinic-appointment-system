import test from "node:test";
import assert from "node:assert/strict";
import {
  APPOINTMENT_DURATION,
  buildTimeSlots,
  createAppointment,
  formatTime,
  validateAppointment,
} from "../src/appointment.js";

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
  assert.deepEqual(validateAppointment({}), {
    patientId: "Select a patient.",
    date: "Select an appointment date.",
    time: "Choose an available time.",
  });
});

test("prevents double booking", () => {
  const errors = validateAppointment({ patientId: "p-1001", date: "2026-11-18", time: "10:00" });
  assert.match(errors.time, /already booked/i);
});

test("prevents booking a blocked slot", () => {
  const errors = validateAppointment({ patientId: "p-1001", date: "2026-11-18", time: "12:30" });
  assert.match(errors.time, /blocked/i);
});

test("creates an active 30-minute appointment with one doctor and room", () => {
  const result = createAppointment({ patientId: "p-1001", date: "2026-11-18", time: "09:00" });
  assert.equal(result.ok, true);
  assert.equal(result.appointment.status, "Active");
  assert.equal(result.appointment.duration, APPOINTMENT_DURATION);
  assert.equal(result.appointment.endTime, "09:30");
  assert.equal(result.appointment.doctor, "Dr. Maya Patel");
  assert.equal(result.appointment.room, "Examination Room 1");
});

test("formats times for the interface", () => {
  assert.equal(formatTime("08:00"), "08:00 AM");
  assert.equal(formatTime("13:30"), "01:30 PM");
});
