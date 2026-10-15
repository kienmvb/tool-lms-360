
"use strict";

if (location.hostname === "lms360.vn" ||
    location.hostname.endsWith(".lms360.vn")) {
  chrome.runtime.sendMessage({ type: "LMS360_ACTIVE" });
}
