export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const callIfReady = (fn, ...args) => {
  return args.some((elem) => !elem) ? null : fn(...args);
};
