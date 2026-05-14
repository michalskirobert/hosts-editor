import ReactDOM from "react-dom/client";
import React from "react";
import { ToastContainer } from "react-toastify";

import "./index.css";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <ToastContainer
      {...{ autoClose: 3000, theme: "colored", draggable: true }}
    />
  </React.StrictMode>,
);
