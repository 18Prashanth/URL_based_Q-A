// State management
let isProcessed = false;
let isLoading = false;
let messages = [];

// DOM elements
const urlForm = document.getElementById("urlForm");
const processBtn = document.getElementById("processBtn");
const processBtnText = document.getElementById("processBtnText");
const chatMessages = document.getElementById("chatMessages");
const questionInput = document.getElementById("questionInput");
const submitBtn = document.getElementById("submitBtn");
const themeToggle = document.getElementById("themeToggle");
const newChatBtn = document.getElementById("newChatBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const newChatTopBtn = document.getElementById("newChatTopBtn");
const clearChatTopBtn = document.getElementById("clearChatTopBtn");

// Initialize theme
initializeTheme();

// Theme toggle functionality
themeToggle.addEventListener("click", toggleTheme);

// Initialize theme (remove localStorage for artifacts environment)
function initializeTheme() {
  // Default to light mode in artifacts environment
  const isDark = document.body.classList.contains("dark-mode");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  themeToggle.title = isDark ? "Toggle Light Mode" : "Toggle Dark Mode";
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");

  themeToggle.textContent = isDark ? "☀️" : "🌙";
  themeToggle.title = isDark ? "Toggle Light Mode" : "Toggle Dark Mode";

  // Note: localStorage removed for artifacts environment
}

// New Chat functionality
newChatBtn.addEventListener("click", startNewChat);
newChatTopBtn.addEventListener("click", startNewChat);

function startNewChat() {
  // Reset all state
  isProcessed = false;
  isLoading = false;
  messages = [];

  // Clear form
  urlForm.reset();

  // Reset buttons
  processBtn.disabled = false;
  submitBtn.disabled = true;
  processBtnText.textContent = "Process URLs";
  submitBtn.textContent = "Submit";

  // Clear chat
  clearChatMessages();

  // Show empty state
  showEmptyState();
}

// Clear Chat functionality
clearChatBtn.addEventListener("click", clearChat);
clearChatTopBtn.addEventListener("click", clearChat);

function clearChat() {
  clearChatMessages();
  if (!isProcessed) {
    showEmptyState();
  }
}

function clearChatMessages() {
  chatMessages.innerHTML = "";
  messages = [];
}

function showEmptyState() {
  chatMessages.innerHTML = `
         <div class="empty-state">
             Start by processing URLs on the left, then ask your questions here!
         </div>
     `;
}

// URL Processing
urlForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const url1 = document.getElementById("url1").value;
  const url2 = document.getElementById("url2").value;
  const url3 = document.getElementById("url3").value;

  if (!url1) {
    alert("Primary URL is required!");
    return;
  }

  await processUrls({ url1, url2, url3 });
});

async function processUrls(urls) {
  setProcessing(true);

  try {
    const response = await fetch("/process_urls/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url1: urls.url1,
        url2: urls.url2 || null,
        url3: urls.url3 || null,
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error("Invalid JSON response from server.");
    }

    if (data.status === "success") {
      isProcessed = true;
      submitBtn.disabled = false;

      addMessage(
        "bot",
        `✅ ${data.message} You can now ask questions about the content.`
      );

      clearEmptyState();
    } else {
      throw new Error(data.message || "Failed to process URLs");
    }
  } catch (error) {
    console.error("Error processing URLs:", error);
    addMessage(
      "bot",
      `❌ Error processing URLs: ${error.message}. Please check the URLs and try again.`
    );
  } finally {
    setProcessing(false);
  }
}

function setProcessing(processing) {
  isLoading = processing;
  processBtn.disabled = processing;

  if (processing) {
    processBtnText.innerHTML = `
             <div class="loading">
                 <div class="loading-spinner"></div>
                 Processing...
             </div>
         `;
  } else {
    processBtnText.textContent = "Process URLs";
  }
}

// Chat functionality
submitBtn.addEventListener("click", async () => {
  const question = questionInput.value.trim();

  if (!question) {
    alert("Please enter a question!");
    return;
  }

  if (!isProcessed) {
    alert("Please process URLs first!");
    return;
  }

  await handleQuestion(question);
});

questionInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!isLoading && isProcessed) {
      submitBtn.click();
    }
  }
});

async function handleQuestion(question) {
  // Add user message
  addMessage("user", question);
  questionInput.value = "";

  // Show loading
  setSubmitLoading(true);
  const loadingId = addMessage("bot", "", true);

  try {
    // Call your FastAPI endpoint
    const response = await fetch("/ask_question/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Question: question,
      }),
    });

    const data = await response.json();

    // Remove loading message
    document.getElementById(loadingId).remove();

    if (response.ok && data.answer) {
      // Format the response with sources if available
      let formattedAnswer = data.answer;
      if (data.sources && data.sources.trim()) {
        formattedAnswer += `\n\n📚 Sources: ${data.sources}`;
      }

      // Stream the response for better UX
      await streamMessage(formattedAnswer);
    } else {
      throw new Error(data.sources || "Failed to get answer");
    }
  } catch (error) {
    console.error("Error asking question:", error);
    // Remove loading message if still present
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
      loadingElement.remove();
    }
    addMessage(
      "bot",
      `❌ Sorry, I encountered an error: ${error.message}. Please try again.`
    );
  } finally {
    setSubmitLoading(false);
    // Re-enable the submit button for next question
    questionInput.focus();
  }
}

function addMessage(sender, content, isLoading = false) {
  const messageId = "msg-" + Date.now();
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;
  messageDiv.id = messageId;

  if (isLoading) {
    messageDiv.innerHTML = `
             <div class="loading">
                 <div class="loading-spinner"></div>
                 Generating response...
             </div>
         `;
  } else {
    messageDiv.textContent = content;
  }

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return messageId;
}

async function streamMessage(text) {
  const messageId = addMessage("bot", "");
  const messageElement = document.getElementById(messageId);

  const lines = text.split("\n");
  messageElement.innerHTML = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineElement = document.createElement("div");
    lineElement.textContent = line || "\u00A0"; // Non-breaking space for empty lines
    lineElement.style.opacity = "0";
    lineElement.style.animation = "messageSlide 0.4s ease-out forwards";
    lineElement.style.animationDelay = `${i * 0.1}s`;

    messageElement.appendChild(lineElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}

function setSubmitLoading(loading) {
  isLoading = loading;
  submitBtn.disabled = loading;

  if (loading) {
    submitBtn.innerHTML = `
             <div class="loading">
                 <div class="loading-spinner"></div>
             </div>
         `;
  } else {
    submitBtn.textContent = "Submit";
    // Re-enable based on input content and processing state
    submitBtn.disabled = !questionInput.value.trim() || !isProcessed;
  }
}

// Enable question input when URLs are processed and update submit button state
questionInput.addEventListener("input", () => {
  if (isProcessed && !isLoading) {
    submitBtn.disabled = !questionInput.value.trim();
  }
});

// Keep input focused and ready for next question
questionInput.addEventListener("focus", () => {
  if (isProcessed && !isLoading) {
    submitBtn.disabled = !questionInput.value.trim();
  }
});
