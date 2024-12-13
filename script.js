const chatForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestionItems = document.querySelectorAll(".suggestion");
const themeToggle = document.querySelector("#theme-toggle-button");
const clearChatButton = document.querySelector("#delete-chat-button");

let currentUserMessage = null;
let isLoadingResponse = false;

const API_ACCESS_KEY = "nah";
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${API_ACCESS_KEY}`;

const initializeData = () => {
  const savedConversations = localStorage.getItem("saved-chats");
  const lightThemeEnabled = localStorage.getItem("themeColor") === "light_mode";

  document.body.classList.toggle("light_mode", lightThemeEnabled);
  themeToggle.innerText = lightThemeEnabled ? "dark_mode" : "light_mode";

  chatList.innerHTML = savedConversations || '';
  document.body.classList.toggle("hide-header", !!savedConversations);

  chatList.scrollTo(0, chatList.scrollHeight);
};

const createChatElement = (content, ...classes) => {
  const element = document.createElement("div");
  element.classList.add("message", ...classes);
  element.innerHTML = content;
  return element;
};

const animateTypingEffect = (message, textTarget, responseElement) => {
  const wordArray = message.split(' ');
  let index = 0;

  const typingInterval = setInterval(() => {
    textTarget.innerText += (index === 0 ? '' : ' ') + wordArray[index++];
    responseElement.querySelector(".icon").classList.add("hide");

    if (index === wordArray.length) {
      clearInterval(typingInterval);
      isLoadingResponse = false;
      responseElement.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("saved-chats", chatList.innerHTML);
    }
    chatList.scrollTo(0, chatList.scrollHeight);
  }, 75);
};

const fetchResponse = async (responseElement) => {
  const responseText = responseElement.querySelector(".text");

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: currentUserMessage }]
          }
        ]
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error.message);

    const responseContent = result.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1");
    animateTypingEffect(responseContent, responseText, responseElement);
  } catch (error) {
    isLoadingResponse = false;
    responseText.innerText = error.message;
    responseElement.classList.add("error");
  } finally {
    responseElement.classList.remove("loading");
  }
};

const displayLoadingAnimation = () => {
  const htmlContent = `
    <div class="message-content">
      <img class="avatar" src="images/gemini.svg" alt="Gemini avatar">
      <p class="text"></p>
      <div class="loading-indicator">
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
      </div>
    </div>
    <span onclick="copyToClipboard(this)" class="icon material-symbols-rounded">content_copy</span>
  `;

  const responseElement = createChatElement(htmlContent, "incoming", "loading");
  chatList.appendChild(responseElement);

  chatList.scrollTo(0, chatList.scrollHeight);
  fetchResponse(responseElement);
};

const copyToClipboard = (button) => {
  const messageContent = button.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageContent);
  button.innerText = "done";
  setTimeout(() => (button.innerText = "content_copy"), 1000);
};

const processOutgoingChat = () => {
  currentUserMessage = chatForm.querySelector(".typing-input").value.trim() || currentUserMessage;
  if (!currentUserMessage || isLoadingResponse) return;

  isLoadingResponse = true;

  const htmlContent = `
    <div class="message-content">
      <img class="avatar" src="images/user.jpg" alt="User avatar">
      <p class="text"></p>
    </div>
  `;

  const userMessageElement = createChatElement(htmlContent, "outgoing");
  userMessageElement.querySelector(".text").innerText = currentUserMessage;
  chatList.appendChild(userMessageElement);

  chatForm.reset();
  document.body.classList.add("hide-header");
  chatList.scrollTo(0, chatList.scrollHeight);
  setTimeout(displayLoadingAnimation, 500);
};

themeToggle.addEventListener("click", () => {
  const isLightModeActive = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightModeActive ? "light_mode" : "dark_mode");
  themeToggle.innerText = isLightModeActive ? "dark_mode" : "light_mode";
});

clearChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all chats?")) {
    localStorage.removeItem("saved-chats");
    initializeData();
  }
});

suggestionItems.forEach((item) => {
  item.addEventListener("click", () => {
    currentUserMessage = item.querySelector(".text").innerText;
    processOutgoingChat();
  });
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  processOutgoingChat();
});

initializeData();
