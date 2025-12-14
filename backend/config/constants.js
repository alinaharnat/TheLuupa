// config/constants.js
// Centralized configuration constants

// Time constants (in milliseconds)
export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
};

// Authentication
export const AUTH = {
  EMAIL_VERIFICATION_EXPIRY_MINUTES: 10,
  get EMAIL_VERIFICATION_EXPIRY_MS() {
    return this.EMAIL_VERIFICATION_EXPIRY_MINUTES * TIME.MINUTE;
  },
};

// Booking
export const BOOKING = {
  EXPIRY_MINUTES: 15,
  MIN_HOURS_BEFORE_CANCEL: 2,
  HOURS_BEFORE_REVEAL_DESTINATION: 5,
  get EXPIRY_MS() {
    return this.EXPIRY_MINUTES * TIME.MINUTE;
  },
};

// Default values
export const DEFAULTS = {
  PASSENGERS: 1,
  PAYMENT_METHOD: 'credit_card',
  UNKNOWN_VALUE: 'Unknown',
};
