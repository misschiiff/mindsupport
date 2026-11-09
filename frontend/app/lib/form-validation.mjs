export function validateBooking(values) {
  if (!String(values.name ?? "").trim()) return "Please add the name you’d like us to use.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.email ?? ""))) return "Please enter a valid email address.";
  if (!["online", "in-person", "either"].includes(values.format)) return "Choose online, in person, or either.";
  if (!String(values.availability ?? "").trim()) return "Choose a time of day that works for you.";
  if (!values.consent) return "Please confirm we can use these details to follow up.";
  return "";
}

export function validateAnonymousMessage(values) {
  if (String(values.message ?? "").trim().length < 10) return "A few more words would help us understand what you’d like to share. You can keep it brief.";
  if (!values.anonymousConsent) return "Please confirm you understand how this anonymous message works.";
  return "";
}
