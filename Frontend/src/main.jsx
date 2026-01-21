import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AuthProvider } from "./context/AuthContext";
import { AlertProvider } from "./context/AlertContext";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./styles/tables-responsive.css";
import "../src/styles/alertas-globales.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AlertProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AlertProvider>
    </AuthProvider>
  </React.StrictMode>
);
