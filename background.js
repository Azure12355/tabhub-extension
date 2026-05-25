// TabHub background — 点扩展图标时聚焦/新建 tabhub.html
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL("tabhub.html");
  const tabs = await chrome.tabs.query({ url });
  if (tabs.length > 0) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.windows.update(tabs[0].windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url });
  }
});
