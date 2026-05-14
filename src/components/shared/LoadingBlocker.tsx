import React, { type ReactNode } from "react";
import { CustomLoader } from "./Loader";

interface CustomLoadingBlockerProps {
  children: ReactNode;
  isLoading: boolean;
}

export const CustomLoadingBlocker: React.FC<CustomLoadingBlockerProps> = ({
  children,
  isLoading,
}) => {
  if (isLoading)
    return (
      <div className="relative top-0 w-full h-full cursor-wait">
        <div className="absolute top-0 left-0 flex items-center justify-center w-full h-full z-20">
          <CustomLoader size="md" />
        </div>
        <div className="opacity-55">{children}</div>
      </div>
    );
  else return <>{children}</>;
};
