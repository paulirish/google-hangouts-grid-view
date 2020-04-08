
chrome.browserAction.onClicked.addListener(tab => {
  chrome.tabs.sendMessage(tab.id, {clicked: true});
});