import type { ControllerFieldState } from "react-hook-form";

export const Feedback = ({ invalid, error }: ControllerFieldState) => {
  if (!invalid) return null;

  return (
    <div className="text-xs text-red-400 font-light">{error?.message}</div>
  );
};
