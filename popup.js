document.getElementById("captureButton").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      chrome.runtime.sendMessage({ message: "capture_screen", tabId: tabId });
    });
  });
  