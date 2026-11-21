// The calendar engine (gcal.js, evdate.js, plain.js) was written for the browser and uses "window" and relative file addresses.
// Here "window" is just the worker itself, and calendar files are read from the website's own files.
globalThis.window = globalThis;
const realFetch = globalThis.fetch.bind(globalThis);
globalThis.__calendarFetch = null;   // set by index.js: (path) => Promise<Response>
globalThis.fetch = function (input, init) {
  if (typeof input === "string" && input.startsWith("calendar-data/") && globalThis.__calendarFetch) return globalThis.__calendarFetch(input);
  return realFetch(input, init);
};
