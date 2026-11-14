import {
  APPOINTMENT_DURATION,
  buildTimeSlots,
  createAppointment,
  formatTime,
  patients,
  resources,
  todayInLocalTime,
} from "./appointment.js";
import { loadAppointments, saveAppointment } from "./storage.js";

const form = document.querySelector("#appointment-form");
const scheduleView = document.querySelector("#schedule-view");
const confirmationView = document.querySelector("#confirmation-view");
const patientSelect = document.querySelector("#patient");
const dateInput = document.querySelector("#appointment-date");
const slotsContainer = document.querySelector("#time-slots");
const summaryError = document.querySelector("#summary-error");
const confirmationDetails = document.querySelector("#confirmation-details");
const scheduleAnotherButton = document.querySelector("#schedule-another");
const submitButton = document.querySelector("#submit-button");

let selectedTime = "";
let appointments = loadAppointments();
let lastAppointment = null;

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function setFieldError(field, message = "") {
  const error = document.querySelector(`#${field}-error`);
  const control = document.querySelector(`#${field}`);
  error.textContent = message;
  if (control) control.setAttribute("aria-invalid", String(Boolean(message)));
}

function clearErrors() {
  summaryError.hidden = true;
  summaryError.querySelector("strong").textContent = "Unable to schedule appointment";
  summaryError.querySelector("p").textContent = "Review the highlighted fields before confirming.";
  setFieldError("patient");
  setFieldError("appointment-date");
  setFieldError("time-slots");
}

function renderPatients() {
  patientSelect.insertAdjacentHTML(
    "beforeend",
    patients.map(({ id, name }) => `<option value="${id}">${name}</option>`).join(""),
  );
}

function renderSlots() {
  slotsContainer.innerHTML = buildTimeSlots({ date: dateInput.value, appointments })
    .map(({ time, status }) => {
      const unavailable = status !== "available";
      const statusLabel = status === "booked" ? "Booked" : status === "blocked" ? "Blocked" : "";
      return `
        <button
          class="time-slot time-slot--${status}"
          type="button"
          data-time="${time}"
          aria-pressed="false"
          ${unavailable ? "disabled" : ""}
        >
          <span>${formatTime(time)}</span>
          ${statusLabel ? `<small>${statusLabel}</small>` : ""}
        </button>`;
    })
    .join("");
}

function selectTime(button) {
  slotsContainer.querySelectorAll(".time-slot").forEach((slot) => {
    slot.classList.remove("is-selected");
    slot.setAttribute("aria-pressed", "false");
  });
  button.classList.add("is-selected");
  button.setAttribute("aria-pressed", "true");
  selectedTime = button.dataset.time;
  setFieldError("time-slots");
}

function renderConfirmation(appointment) {
  lastAppointment = appointment;
  const rows = [
    ["Patient", appointment.patient.name],
    ["Date", formatDate(appointment.date)],
    ["Time", `${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)}`],
    ["Duration", `${appointment.duration} minutes`],
    ["Doctor", appointment.doctor],
    ["Room", appointment.room],
  ];

  confirmationDetails.innerHTML = rows
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");

  scheduleView.hidden = true;
  confirmationView.hidden = false;
  confirmationView.focus();
}

function resetAppointment() {
  const previousDate = lastAppointment?.date ?? "";
  form.reset();
  dateInput.value = previousDate;
  selectedTime = "";
  clearErrors();
  renderSlots();
  confirmationView.hidden = true;
  scheduleView.hidden = false;
  patientSelect.focus();
}

slotsContainer.addEventListener("click", (event) => {
  const button = event.target.closest(".time-slot:not(:disabled)");
  if (button) selectTime(button);
});

dateInput.addEventListener("change", () => {
  selectedTime = "";
  setFieldError("appointment-date");
  setFieldError("time-slots");
  renderSlots();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();

  const result = createAppointment(
    {
      patientId: patientSelect.value,
      date: dateInput.value,
      time: selectedTime,
    },
    { appointments },
  );

  if (!result.ok) {
    summaryError.hidden = false;
    setFieldError("patient", result.errors.patientId);
    setFieldError("appointment-date", result.errors.date);
    setFieldError("time-slots", result.errors.time);
    document.querySelector("[aria-invalid='true']")?.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Booking…";
  try {
    appointments = saveAppointment(result.appointment);
    renderSlots();
  } catch {
    summaryError.hidden = false;
    summaryError.querySelector("strong").textContent = "Unable to save appointment";
    summaryError.querySelector("p").textContent = "Browser storage is unavailable. Try again.";
    submitButton.disabled = false;
    submitButton.textContent = "Confirm Appointment";
    return;
  }

  window.setTimeout(() => {
    renderConfirmation(result.appointment);
    submitButton.disabled = false;
    submitButton.textContent = "Confirm Appointment";
  }, 250);
});

scheduleAnotherButton.addEventListener("click", resetAppointment);

renderPatients();
renderSlots();
dateInput.min = todayInLocalTime();
document.querySelector("#doctor-name").textContent = resources.doctor;
document.querySelector("#room-name").textContent = resources.room;
document.querySelector("#duration").textContent = `${APPOINTMENT_DURATION} min`;
