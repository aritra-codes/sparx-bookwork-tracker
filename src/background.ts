const checkInstance = (value: any, instance: any): any => {
  if (!(value instanceof instance)) {
    return new instance();
  }

  return value;
};

const screenshotAnswer = (packageID: string, bookworkCode: string) => {
  chrome.tabs.captureVisibleTab((screenshotURL) => {
    chrome.storage.local.get("screenshotURLs", (res) => {
      const screenshotURLs: { [key: string]: { [key: string]: string } } =
        checkInstance(res.screenshotURLs, Object);

      screenshotURLs[packageID] ??= {};
      screenshotURLs[packageID][bookworkCode] = screenshotURL;

      chrome.storage.local.set({ screenshotURLs });
    });
  });
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "takeScreenshot") {
    screenshotAnswer(request.packageId, request.bookworkCode);

    sendResponse();
  } else if (request.action === "setHomeworkInfos") {
    chrome.storage.local.get("homeworkInfos", (res) => {
      let homeworkInfos: { [key: string]: string } = checkInstance(
        res.homeworkInfos,
        Object,
      );

      homeworkInfos[request.packageId as string] =
        request.homeworkInfo as string;

      chrome.storage.local.set({ homeworkInfos });
    });
  } else if (request.action === "openURL") {
    chrome.tabs.create({ url: request.url as string });
  }
});

chrome.tabs.onUpdated.addListener((tabId, tab) => {
  if (tab.url) {
    const linkDirectories = tab.url.split("/");

    if (linkDirectories.includes("wac")) {
      chrome.tabs.sendMessage(tabId, { action: "showBookworkAnswer" });
    } else if (linkDirectories.includes("summary")) {
      chrome.tabs.sendMessage(tabId, { action: "clickNextTask" });
    }
  }
});
