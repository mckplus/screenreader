chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.message === "capture_screen") {
    processScreenCapture(message.tabId);
  }
});

chrome.runtime.onSuspend.addListener(() => {
  console.log("Extension is unloading.");
  // Perform any cleanup or last-minute logging here
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "capture_screen") {
    processScreenCapture();
  }
});

async function processScreenCapture(tabId = null) {
  try {
    await ensureContentScriptIsActive(tabId);
    await captureScreen(tabId);
  } catch (error) {
    console.error("Error processing screen capture:", error);
  }
}

async function ensureContentScriptIsActive(tabId) {
  if (!tabId) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    tabId = tabs[0].id;
  }
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });
}

async function captureScreen(tabId) {
  console.log("Capture Screen Button Pressed from Background Script");

  try {
    const tab = await new Promise((resolve, reject) => {
      if (tabId) {
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(tab);
          }
        });
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            resolve(tabs[0]);
          } else {
            reject(new Error("No active tab found"));
          }
        });
      }
    });

    await captureAndProcessTab(tab);
  } catch (error) {
    console.error("Error capturing screen:", error);
  }
}

async function captureAndProcessTab(tab) {
  try {
    const imageUri = await new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 20 }, (imageUri) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(imageUri);
        }
      });
    });

    console.log("Screenshot Captured Successfully!");
    const openaiApiKey = "[KEY MUST GO HERE]";
    const base64Image = imageUri.split(",")[1];

    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": "Provide a detailed description of this screenshot, suitable for supporting people with visual impairments."
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    const visionData = await visionResponse.json();
    console.log("Vision Model Response:", JSON.stringify(visionData, null, 2));

    if (visionData.choices && visionData.choices.length > 0 && visionData.choices[0].message) {
      const description = visionData.choices[0].message.content;
      console.log("Description from Vision Model:", description);
      sendMessageToActiveTab({"message": "playAudio", "description": description});
    } else {
      console.log("Vision Model did not return a valid description.");
      chrome.tabs.sendMessage(tab.id, { message: "Description failed. Please try again." });
    }
  } catch (error) {
    console.error("Error in captureAndProcessTab:", error);
    chrome.tabs.sendMessage(tab.id, { message: "Capture failed. Please try again." });
  }
}
