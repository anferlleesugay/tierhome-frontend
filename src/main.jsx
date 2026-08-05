import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import axios from "axios";
import { Capacitor } from "@capacitor/core";

import { AuthProvider } from "./context/AuthContext";

// Tell the backend whether this session is the native app or the website,
// so it can route notifications (push vs email) correctly in real time.
axios.defaults.headers.common["X-Platform"] = Capacitor.isNativePlatform() ? "app" : "web";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);