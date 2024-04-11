console.log("Content script is active");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.message === "playAudio") {
    const audioData = message.audioData;
    const audio = new Audio(`data:audio/mpeg;base64,${audioData}`);
    audio.play().catch(e => console.error("Error playing audio:", e));
  }
});

window.addEventListener("error", function (e) {
  console.error("Error in content script:", e.message);
});

window.addEventListener("unhandledrejection", function (e) {
  console.error("Unhandled rejection in content script:", e.reason);
});