module.exports = function logFetchError(err, ctx = "") {
  const cause = err && err.cause ? err.cause : null;
  console.error(`[fetch failed] ${ctx}`, {
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
    causeName: cause?.name,
    causeCode: cause?.code,
    causeErrno: cause?.errno,
    causeSyscall: cause?.syscall,
    causeAddress: cause?.address,
    causePort: cause?.port,
  });
};