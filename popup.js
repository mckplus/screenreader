document.getElementById("captureButton").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.runtime.sendMessage({ type: "capture_screen", tabId });
  });
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  const { type } = message;
  console.log("Message received in content script", type);
  if (type === "text_response") {
    const newElement = document.createElement("div");
    newElement.textContent = "Operation Completed!";
    document.body.appendChild(newElement);
  }
  if (type === "image_data") {
    const { imageUri } = message;
    console.log("Image data received in content script");
    let filename = "captured_tab_" + Date.now() + ".jpeg";

    let a = document.createElement("a");
    a.href = imageUri;
    a.download = filename;
    a.textContent = "Download screenshot";
    document.body.appendChild(a);
  }
});