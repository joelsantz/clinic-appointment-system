# Clinic Appointment Management System

A responsive, dependency-free implementation of the Study.com Assignment 2 appointment scheduling prototype.

## Features

- Registered patient selection
- Date selection
- 30-minute appointments from 08:00 through 17:30
- Booked and blocked time slots
- Single doctor and examination room availability
- Required-field and double-booking validation
- Booking confirmation with initial `Active` status
- Browser-local persistence using a date-and-time reservation ID
- Immediate slot refresh after a successful booking
- Domain-level validation for dates, clinic hours, intervals, and duplicate reservations
- Responsive and accessible interface
- Automated unit tests and GitHub Pages deployment

## Run locally

```bash
npm test
npm run serve
```

Then open <http://localhost:4173>.

## Architecture

The project intentionally uses plain HTML, CSS, and JavaScript. Business rules live in `src/appointment.js`, browser persistence in `src/storage.js`, browser interactions in `src/app.js`, and tests in `tests/appointment.test.js`.

## Deployment

GitHub Pages publishes the static site directly from the root of the `main` branch. Run `npm test` before pushing changes.

## Design

The interface follows the companion Figma prototype: light gray application background, white cards, teal actions, validation states, disabled time slots, and a booking confirmation screen.
