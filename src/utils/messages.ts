export const errorMessages = {
  requiredField: "{label} is required",
  invalidIPV4Address: "Enter a valid IPv4 address",
  invalidDomain: "Enter a valid domain (e.g. example.com)",
} as const;

export const setErrorMessage = (
  label: string,
  message: keyof typeof errorMessages
) => errorMessages[message].replaceAll("{label}", label);
