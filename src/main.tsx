import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@material-tailwind/react";
import React from "react";
import { ToastContainer } from "react-toastify";

import "./index.css";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
      <ToastContainer
        {...{ autoClose: 3000, theme: "colored", draggable: true }}
      />
    </ThemeProvider>
  </React.StrictMode>
);
