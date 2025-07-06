export const generateActivityId = (): string => {
  return new Date().toISOString().replace(/[:.]/g, "").slice(0, -1) + "Z";
};
