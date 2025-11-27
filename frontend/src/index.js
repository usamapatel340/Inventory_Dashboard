import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import configureAmplify from "./amplifyConfig";

// configure Amplify (no-op if placeholders left)
configureAmplify();

const root = createRoot(document.getElementById("root"));
root.render(<App />);
