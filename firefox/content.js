const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
const style = document.createElement('style')

const defaultSettings = {
  showTwitterButton: true,
}

style.textContent = `
.save-link-btn:hover{
  text-decoration: underline;
}
  .save-link-btn.saved-animation {
animation: shadow-expand .8s ease-in-out;
}

@keyframes shadow-expand {
  
    0% {
    box-shadow: none
  }
  50% {
    box-shadow: 0 0 10px rgba(29, 161, 242, .95)
  }
  100% {
    box-shadow: none
  }
}
`
document.head.appendChild(style)

function addSaveButtons() {
  const links = document.querySelectorAll('article[data-testid="tweet"]')
  links.forEach((link) => {
    if (!link.querySelector('.save-link-btn')) {
      const button = document.createElement('button')
      button.textContent = 'Save to Queue'
      button.className = 'save-link-btn'
      button.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        padding: 5px 10px;
        background-color: #1da1f2;
        color: white;
        border-radius: 8px;
        cursor: pointer;
        font-family: system-ui;
        border: 2px solid white;
        box-shadow: none;
        text-align: center;
      `

      button.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const linkInfo = { visited: false }
        const twitterLink = link.querySelector('a[href*="/status/"]').href
        const twitterLinkText =
          link.querySelector('[data-testid="tweetText"]') || ''
        let text = twitterLinkText.textContent
        if (text) {
          text = text.replace(/\n/g, ' ')
        }
        linkInfo.link = twitterLink
        linkInfo.text = text
        linkInfo.visited = false

        sendMessageToBackground(linkInfo, button)
      })

      link.style.position = 'relative'
      link.appendChild(button)
    }
  })
}

function sendMessageToBackground(linkInfo, button) {
  if (
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    chrome.runtime.sendMessage
  ) {
    chrome.runtime.sendMessage(
      { action: 'saveLink', linkInfo: linkInfo },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError)
          updateButtonState(button, 'Error', true)
          return
        }

        if (
          response &&
          (response.success || response.message === 'Link already saved')
        ) {
          updateButtonState(button, 'Saved!', true)
        }
      }
    )
  } else {
    console.error('Chrome runtime is not available')
    updateButtonState(button, 'Error', true)
    // Attempt to recover by reinjecting the content script
    setTimeout(reinjectContentScript, 1000)
  }
}

function updateButtonState(button, text, disable = false) {
  const oldButtonWidth = getComputedStyle(button).width
  button.style.width = oldButtonWidth // Maintain button width
  button.textContent = text
  button.disabled = disable
  if (text === 'Saved!') {
    button.classList.add('saved-animation')
  }
}

function reinjectContentScript() {
  const script = document.createElement('script')
  script.src = chrome.runtime.getURL('content.js')
  script.onload = function () {
    this.remove()
  }
  ;(document.head || document.documentElement).appendChild(script)
}

chrome.storage.sync.get(defaultSettings, (settings) => {
  if (settings.showTwitterButton) {
    // Ensure the content script keeps running even if there's an error
    const debouncedAddSaveButtons = debounce(addSaveButtons, 250)
    const observer = new MutationObserver(debouncedAddSaveButtons)

    try {
      observer.observe(document.body, { childList: true, subtree: true })
    } catch (error) {
      console.error('Error setting up MutationObserver:', error)
    }
  }
})
