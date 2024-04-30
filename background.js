chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "capture_screen") {
    processScreenCapture(message.tabId);
  }
});

async function processScreenCapture(tabId) {
  captureScreen(tabId)
    .then(() => {
      console.log("Screen capture completed successfully.");
    })
    .catch((error) => {
      console.error("Error processing screen capture:", error);
    });
}

async function captureScreen(tabId) {
  console.log("Capture Screen Button Pressed from Background Script");
  chrome.tabs
    .get(tabId)
    .then((tab) => {
      return captureAndProcessTab(tab);
    })
    .then((imageUri) => {
      console.log("Image URI", imageUri);
      console.log("After capture process finishes");
      chrome.runtime.sendMessage({ type: "image_data", imageUri});

      sendToGemini(imageUri);
    })
    .catch((error) => {
      console.error("Error capturing screen:", error);
    });
}

const sendToGemini = async (imageUri) => {
  const cleanedUri = imageUri.replace("data:image/jpeg;base64,", "");
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=" +
    GOOGLE_API_KEY;
  const data = {
    contents: [
      {
        parts: [
          {
            text: "You are an assistant for a computer user who is visually impared. Provide a detailed description of this screenshot, suitable for supporting someone with a visual impairment.",
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: cleanedUri,
            },
          },
        ],
      },
    ],
  };
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("full response", data);
      const arr = data.candidates
      console.log("arr", arr);
      const textArr = arr[0].content.parts
      console.log("textArr", textArr);
      const text = textArr[0].text
      console.log("text", text);
      return text
    }).then((text) => {
      chrome.runtime.sendMessage({ type: "text_response", text });
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
};

async function captureAndProcessTab(tab) {
  return await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: "jpeg",
    quality: 20,
  });
}
