const defaultSettings = {
  showTwitterButton: true,
}

function findLinkMatch(arr, targetLinkInfo) {
  return arr.find((obj) => obj.link === targetLinkInfo.link) || null
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveLink') {
    chrome.storage.local.get('savedLinks', (data) => {
      const savedLinks = data.savedLinks || []
      if (!findLinkMatch(savedLinks, request.linkInfo)) {
        savedLinks.push(request.linkInfo)
        chrome.storage.local.set({ savedLinks }, () => {
          sendResponse({ success: true })
        })
      } else {
        sendResponse({ success: false, message: 'Link already saved' })
      }
    })
    return true // Indicates that the response is sent asynchronously
  } else if (request.action === 'removeAll') {
    chrome.storage.local.set({ savedLinks: [] }, () => {
      sendResponse({ success: true })
    })
    return true
  }
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveLinkToQueue',
    title: 'Save Link to Queue',
    contexts: ['link'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'saveLinkToQueue') {
    const linkInfo = {
      visited: false,
      link: info.linkUrl,
      title: info.selectionText || info.linkUrl,
    }

    chrome.storage.local.get('savedLinks', (data) => {
      const savedLinks = data.savedLinks || []
      if (!findLinkMatch(savedLinks, linkInfo)) {
        savedLinks.push(linkInfo)
        chrome.storage.local.set({ savedLinks })
      }
    })
  }
})

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.showToolbarButton) {
    if (changes.showToolbarButton.newValue) {
      chrome.action.enable()
    } else {
      chrome.action.disable()
    }
  }
})
