const defaultSettings = {
  showTwitterButton: true,
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(defaultSettings, (settings) => {
    document.getElementById('showTwitterButton').checked =
      settings.showTwitterButton
  })

  const inputs = document.querySelectorAll('input')
  inputs.forEach((input) => {
    input.addEventListener('change', saveSettings)
  })
})

function saveSettings() {
  const settings = {
    showTwitterButton: document.getElementById('showTwitterButton').checked,
  }
  chrome.storage.sync.set(settings)
}
