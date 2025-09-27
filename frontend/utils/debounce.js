export function debounce(func, delay) {
  let timeoutId; // Variable to hold the timer ID

  // Return a function that manages the timer each time it is called.
  return function (...args) {
    // We cancel the previous timer so that a new request is not sent.
    clearTimeout(timeoutId);

    // We set a new timer that will execute the main function (func) after the delay.
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
