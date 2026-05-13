export const processVersion = (version: string) => {
  const [major, minor, patch] = version.split(".").map(Number);

  return import.meta.env.VITE_ENV === "DEVELOPMENT"
    ? `${major}.${minor}.${patch}`
    : `${major}.${minor}`;
};
