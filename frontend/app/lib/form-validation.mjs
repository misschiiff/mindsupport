export function validateBooking(values) {
  if (!String(values.name ?? "").trim()) return "Please add the name you’d like us to use.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.email ?? ""))) return "Please enter a valid email address.";
  if (!["online", "in-person", "either"].includes(values.format)) return "Choose online, in person, or either.";
  if (!String(values.availability ?? "").trim()) return "Choose a time of day that works for you.";
  if (!values.consent) return "Please confirm we can use these details to follow up.";
  return "";
}

export function validateBookingStep(step, values) {
  if (step === 1) {
    if (!["online", "in-person", "either"].includes(values.format)) return "Choose online, in person, or either.";
    return "";
  }
  if (step === 2) {
    if (!String(values.availability ?? "").trim()) return "Choose a time of day that works for you.";
    return "";
  }
  if (step === 3) return validateBooking(values);
  return "Choose a valid step in the booking form.";
}

export function validateAnonymousMessage(values) {
  if (String(values.message ?? "").trim().length < 10) return "A few more words would help us understand what you’d like to share. You can keep it brief.";
  if (!values.publishConsent) return "Please agree to publication before sending your anonymous message.";
  return "";
}
