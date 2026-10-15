"use strict";

function updateIcon(tabId, url) {
  if (tabId == null) return;

  let red = false;

  try {
    const hostname = new URL(url || "").hostname;
    red =
      hostname === "lms360.vn" ||
      hostname.endsWith(".lms360.vn");
  } catch (_) {
    red = false;
  }

  chrome.action.setIcon({
    tabId: tabId,
    path: red ? "icon-red.png" : "icon.png"
  }).catch((error) => {
    console.error("Không thể đổi biểu tượng:", error);
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    updateIcon(tabId, tab.url || changeInfo.url);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    updateIcon(tabId, tab.url);
  } catch (error) {
    console.error("Không thể lấy thông tin tab:", error);
  }
});