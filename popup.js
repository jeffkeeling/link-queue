document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('saveCurrentUrl')
  const savedLinksList = document.getElementById('savedLinksList')
  const exportButton = document.getElementById('export')
  const removeAllButton = document.getElementById('remove-all')

  // listen for save URL button
  saveButton.addEventListener('click', () => {
    saveActiveTab(saveButton, savedLinksList)
  })

  // listen for remove all button
  removeAllButton.addEventListener('click', (e) => {
    chrome.storage.local.set({ savedLinks: [] }, () => {
      savedLinksList.innerHTML = '<li>No saved links yet.</li>'
    })
  })

  // listen for export button
  exportButton.addEventListener('click', (e) => {
    exportData(savedLinks)
  })

  // render all links
  renderLinks(savedLinksList)
})

function renderLinks(savedLinksList) {
  chrome.storage.local.get('savedLinks', (data) => {
    savedLinks = data.savedLinks || []
    if (savedLinks.length === 0) {
      savedLinksList.innerHTML = '<li>No saved links yet.</li>'
    } else {
      savedLinksList.innerHTML = ''
      savedLinks.forEach((linkInfo) => {
        const li = document.createElement('li')
        const a = document.createElement('a')
        const removeButton = document.createElement('button')
        removeButton.classList.add('remove-btn')
        removeButton.textContent = 'X'
        removeButton.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          removeLink(savedLinks, linkInfo)
          li.remove()
        })
        a.addEventListener('click', (e) => {
          markLinkAsClicked(savedLinks, linkInfo)
        })
        a.href = linkInfo.link
        a.textContent = linkInfo.title || linkInfo.link
        a.target = '_blank'
        li.appendChild(a)
        li.appendChild(removeButton)
        savedLinksList.appendChild(li)
      })
    }
  })
}

function saveActiveTab(saveButton, savedLinksList) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0]
    linkInfo = {
      visited: false,
      link: currentTab.url,
      text: currentTab.title,
    }

    chrome.runtime.sendMessage(
      { action: 'saveLink', linkInfo: linkInfo },
      (response) => {
        if (response && response.success) {
          saveButton.textContent = 'Saved!'
          setTimeout(() => {
            saveButton.textContent = 'Save Current URL'
          }, 2000)
          renderLinks(savedLinksList)
        } else {
          saveButton.textContent = 'Already Saved'
          setTimeout(() => {
            saveButton.textContent = 'Save Current URL'
          }, 2000)
        }
      }
    )
  })
}

function exportData(data) {
  const fileName = 'data-export.json'
  const mimeType = 'application/json'

  chrome.downloads.download({
    url: URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: mimeType })
    ),
    filename: fileName,
    saveAs: true,
  })
}

function getIndex(arr, targetLinkInfo) {
  return arr.findIndex((item) => item.link === targetLinkInfo.link)
}

function removeLink(savedLinks, linkInfo) {
  const index = getIndex(savedLinks, linkInfo)
  if (index !== -1) {
    savedLinks.splice(index, 1)
  }
  chrome.storage.local.set({ savedLinks })
}

function markLinkAsClicked(savedLinks, linkInfo) {
  const index = getIndex(savedLinks, linkInfo)
  if (index !== -1) {
    savedLinks[index].visited = true
  }
  chrome.storage.local.set({ savedLinks })
}
