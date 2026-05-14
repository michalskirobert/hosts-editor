import clsx from "clsx";

interface Props {
  size?: "sm" | "md" | "lg" | "2xl" | "3xl";
}

export const CustomLoader = ({ size = "md" }: Props) => {
  const loaderSize = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    "2xl": "w-15 h-15",
    "3xl": "w-25 h-25",
  };
  return (
    <div className={clsx("relative", loaderSize[size])}>
      <div className="absolute inset-0 rounded-full border-4 border-yellow-200"></div>
      <div className="absolute inset-0 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin"></div>
    </div>
  );
};
