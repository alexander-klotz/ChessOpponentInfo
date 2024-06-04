chrome.tabs.onUpdated.addListener(async (tabId, tab) => {
    await new Promise((resolve) => {
      
      if (tab.url && tab.url.includes("www.chess.com/game/live")) {
        console.log("Chess Info Extension: New game started")
        resolve();
      }
    });

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
    });

  });
  