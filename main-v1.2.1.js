class SeptaChatbot {
  constructor(config) {
    // Required Parameters
    if (
      !config.client_id ||
      !config.client_name ||
      typeof config.access_level === "undefined"
    ) {
      throw new Error(
        "client_id, client_name, and access_level are required parameters."
      );
    }
    this.client_id = config.client_id;
    this.client_name = config.client_name;
    this.access_level = config.access_level;
    this.questionBox = null;
    this.isLoading = false;
    this.selectionMode = config.selectionMode;

    this.abortController = null;

    // URL is required if access_level is 1
    if (this.access_level === 1 && !config.url) {
      throw new Error("URL is required when access_level is set to 1.");
    }
    this.url = config.url || `${this.client_name}.septa.com`;
    this.fontFamily = config.theme?.fontFamily || "Roboto";
    this.defaultOption = config.defaultOption;
    this.selection = this.defaultOption;
    this.systemMessage = "";

    this.accessTokenUrl = config.accessTokenUrl;

    // Optional Parameters for Theme
    this.theme = config.theme || {
      colorCode: "#074E8D",
      headerColor: "#074E8D",
      textColor: "#ffffff",
      backgroundColor: "#ecf0f1",
      inputBorderColor: "#074E8D",
      buttonSize: "1.125rem",
      borderRadius: "0.375rem",
    };
    console.log(config.theme);
    this.iconFile = this.theme.IconFile || null;

    // Optional: Predefined standard questions
    this.standardQuestions = config.standardQuestions || [];

    // Initialize the chatbox UI
    this.initializeChatbox();

    // Play sound and open the chatbox after a few seconds
    this.chatbox.style.display = "none";
    this.autoOpen = false;
    this.chartMessageBox = null;

    document.addEventListener("click", (e) => {
      if (this.autoOpen) return false;

      setTimeout(() => {
        const sound = new Audio(
          "https://cdn.jsdelivr.net/gh/Dwar-liberin/blob/click.mp3"
        );
        sound.play().catch((error) => {
          console.error(
            "Playback failed due to browser autoplay policies:",
            error
          );
        });
        this.chatbox.style.display = "flex";
      }, 1000);

      this.autoOpen = true;
    });

    this.createScopedStyles();
  }

  createScopedStyles() {
    const style = document.createElement("style");
    style.textContent = `

    html {
      font-size: 16px;
    }

@keyframes fadeInSlideUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
    #septa .septa-chatBot{
     all: unset;
    }

   #septa .header-expended-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  margin-right: 0.3125rem;
  padding-bottom: 0.3125rem;
  color: ${this.theme.textColor}
}

   #septa .septa-chatbox {
  display: none;
  position: fixed;
  bottom: 5.0rem;
  right: 1.25rem;
  width: 25.0rem;
  height: 80vh;
  background: ${this.theme.backgroundColor};
  border: 0.0625rem solid #ddd;
  border-radius: ${this.theme.borderRadius};
  z-index: 1000;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  font-family: ${this.fontFamily ?? "Roboto"};

}
      #septa .message{
      white-space: pre-wrap

      }

   #septa .septa-chatbox-button {
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  background: ${this.theme.colorCode};
  color: ${this.theme.textColor};
  border: none;
  border-radius: 1.5625rem;
  padding: 0.625rem 1.25rem;
  font-size: ${this.theme.buttonSize};
  cursor: pointer;
  z-index: 1000;
  font-family: ${this.fontFamily ?? "Roboto"};
}
  
  
      #septa .septa-chat-header {
  display: flex;
  justify-content: flex-end;
  padding: 0.3125rem;
  background: ${this.theme.headerColor};
  border-bottom: 0.0625rem solid #ddd;
  border-radius: ${this.theme.borderRadius} ${this.theme.borderRadius} 0 0;
}
  
     #septa .septa-chat-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  background-color: #F7F7F7;
  font-family: ${this.fontFamily ?? "Roboto"};
}
  
        #septa .septa-input-area {
  display: flex;
  padding: 0.5rem 0.375rem;
  box-sizing: border-box;
  width: 100%;
  resize: none;
  border-end-end-radius: ${this.theme.borderRadius};
  border-end-start-radius: ${this.theme.borderRadius};
  border-radius: ${this.theme.borderRadius};
  outline-color: ${this.theme.inputBorderColor};
  background-color: #fff;
  font-family: ${this.fontFamily ?? "Roboto"};
  box-shadow: rgba(149, 157, 165, 0.2) 0rem 0.5rem 1.5rem;
}
  
       #septa .septa-input {
  padding: 0.625rem;
  max-width: 100%;
  line-height: 1.5;
  border-radius: 0.3125rem;
  font-size: 0.8rem;
  letter-spacing: 0.0625rem;
  width: 100%;
  box-sizing: border-box;
  resize: none;
  outline-color: ${this.theme.inputBorderColor};
  border: 0.0625rem solid rgb(225 225 225);
  border-radius: ${this.theme.borderRadius};
  font-family: ${this.fontFamily ?? "Roboto"};
}
  #septa .septa-input::placeholder {
  color: #aaa;
  font-style: italic;
}
  
        #septa .septa-send-button {
  border: none;
  background: none;
  cursor: pointer;
  padding-top: 0.3125rem;
  color: ${this.theme.colorCode};
}

#septa .septa-send-button img {
  transition: transform 0.2s ease;
}
#septa .septa-send-button:hover img {
  transform: scale(1.1);
}
  
        #septa .septa-message-box {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  animation: fadeInSlideUp 0.35s ease;
}


#septa .septa-message,
#septa .septa-septa-message {
  padding: 0.75rem 1.125rem;
  margin-bottom: 0.625rem;
  font-size: 0.875rem;
  box-shadow: rgba(99, 99, 99, 0.2) 0rem 0.125rem 0.5rem 0rem;
  background-color: ${this.theme.colorCode}; /* Use the theme color */
          color: ${this.theme.textColor}; /* Text color from theme */
          border-radius: ${this.theme.borderRadius} 0 ${
      this.theme.borderRadius
    } ${this.theme.borderRadius};
}
  
       #septa .septa-message {
          background-color: ${this.theme.colorCode}; /* Use the theme color */
          color: ${this.theme.textColor}; /* Text color from theme */
          border-radius: ${this.theme.borderRadius} 0 ${
      this.theme.borderRadius
    } ${this.theme.borderRadius};
          align-self: flex-end;
          max-width: 70%;
          word-wrap: break-word;
          font-family: ${this.fontFamily ?? "Roboto"};
        }
  
      #septa .septa-septa-message {
          background-color: #fff;
          color: #001F3F;
          border-radius: 0 ${this.theme.borderRadius} ${
      this.theme.borderRadius
    } ${this.theme.borderRadius};
          align-self: flex-start;
          max-width: 70%;
          white-space: pre-wrap;
          font-family: ${this.fontFamily ?? "Roboto"};
        }
  
       #septa .septa-septa-thinking-message {
          padding: 0.75rem 1.125rem;
          background: #fff;
          color: #000;
          font-style: italic;
          border-radius: 0 ${this.theme.borderRadius} ${
      this.theme.borderRadius
    } ${this.theme.borderRadius};
          text-align: left;
          margin-bottom: 0.625rem;
          align-self: flex-start;
          max-width: 80%;
          font-size: 0.875rem;
        }
       #septa .septa-close-button{
            background:none;
            border:none;
            cursor:pointer;
            font-size: 1.5rem;
            color:${this.theme.textColor}
        }
       #septa .septa-standard-question{
       padding: 0.625rem;
  margin-bottom: 0.4375rem;
  font-size: 0.875rem;
  border: 0.0625rem solid ${this.theme.inputBorderColor};
          display:block;
          background:none;
          color:${this.theme.colorCode};
          cursor:pointer;
          text-align:left;
          border-radius: ${this.theme.borderRadius}
        }
          #septa .septa-dropdown{
          padding: 0.3125rem;
  border-radius: 0.3125rem;
  font-size: 0.8rem;
  letter-spacing: 0.0625rem;
  border: 0.0625rem solid rgb(225 225 225);
          display:none;
            line-height: 1.5;
            box-sizing: border-box;
            resize:none;
            outline-color:${this.theme.inputBorderColor};
            border-radius:${this.theme.borderRadius};
            font-family: ${this.fontFamily ?? "Roboto"}; 
          }
        #septa .septa-icon{
        width: 1.25rem;
  height: 1.25rem;
  min-width: 1.25rem;
          background: ${this.theme.colorCode};
          border-radius: 50%;
          display: flex;
          justify-content: center;
          color: #ffffff;
          font-size:1rem;

        }
      
       #septa .product-card-container {
          cursor: pointer;
       }  
            

        .septa-confirm-modal {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
       border-radius: 0.375rem;
      }

      .septa-modal-box {
        background: #fff;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 0.25rem 1.25rem rgba(0, 0, 0, 0.2);
        z-index: 11;
        text-align: center;
      }

      .septa-modal-actions {
        margin-top: 1rem;
        display: flex;
       gap: 0.625rem;
        justify-content: center;
      }
.septa-modal-actions button {
  padding: 0.375rem 0.875rem; 
  border: none;
  border-radius: 0.25rem;    
  cursor: pointer;
}

      .confirm-clear {
        background-color: #074E8D;
        color: white;
      }

      .cancel-clear {
        background-color: #6c757d;
        color: white;
      }
      
      #septa .septa-chatbox,
#septa .septa-message-box,
#septa .septa-input,
#septa .septa-send-button {
  transition: all 0.3s ease-in-out;
}

#septa .message, 
#septa .septa-message, 
#septa .septa-septa-message {
  line-height: 1.6;
  letter-spacing: 0.3px;
  font-weight: 400;
}

#septa .septa-chatbox {
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: none;
}

#septa .septa-message, #septa .septa-septa-message {
  border-radius: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
},

`;
    document.head.appendChild(style);
  }

  loadGoogleFont(fontName) {
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(
      /\s/g,
      "+"
    )}:wght@400;500;700&display=swap`;
    link.rel = "stylesheet";
    link.onerror = () => {
      console.error(`Error loading font ${fontName}. Falling back to default.`);
    };
    document.head.appendChild(link);
  }

  formatBoldText(text) {
    text = String(text || "");
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  }

  linkify = (text) => {
    return text.replace(/(https?:\/\/[^\s]+)/g, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: blue; text-decoration: underline;">${url}</a>`;
    });
  };


  createanswer(text) {
    let data = this.formatBoldText(text);
    data = this.linkify(data);
    data = data.replace(/^(?:\s*)-\s+(?=\S)/gm, '• ');

    const messageBox = this.createMessageBox();
    const container = document.createElement("div");
    container.className = "product-card-container";

    const message = document.createElement("p");
    message.className = "septa-septa-message";
    message.innerHTML = data;
    container.appendChild(message);
    messageBox.appendChild(container);

    this.writeChatContent(messageBox);
  }

  // Helper function to capitalize the first letter of a string
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  runScriptsInHtml(element, uniqueChartId) {
    const scripts = element.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      const newScript = document.createElement("script");

      if (scripts[i].src) {
        // If the script is an external script, load it dynamically
        newScript.src = scripts[i].src;
        document.head.appendChild(newScript);
      } else {
        // If it's an inline script, execute it
        // newScript.textContent = scripts[i].innerHTML;
        newScript.textContent = scripts[i].innerHTML.replace(
          /chart_div/g, // Replace old ID with new unique ID
          uniqueChartId
        );

        document.body.appendChild(newScript);
      }
    }
  }

  // Create and style element
  initializeChatbox() {
    this.chatBot = document.createElement("div");
    this.chatBot.className = "septa-chatBot";
    this.chatBot.id = "septa";
    this.button = document.createElement("button");
    this.button.className = "septa-chatbox-button";
    this.chatbox = document.createElement("div");
    this.chatbox.className = "septa-chatbox";
    this.chatHeader = document.createElement("div");
    this.chatHeader.className = "septa-chat-header";
    this.expandButton = document.createElement("button");
    this.closeButton = document.createElement("button");
    this.chatContent = document.createElement("div");
    this.chatContent.className = "septa-chat-content";
    this.inputArea = document.createElement("div");
    this.inputArea.className = "septa-input-area";
    this.input = document.createElement("textarea"); // Use textarea for multiline input
    this.input.className = "septa-input";
    this.sendButton = document.createElement("button");
    this.sendButton.className = "septa-send-button";
    this.questionBox = document.createElement("div");

    this.loadGoogleFont(this.fontFamily);

    // Ask Septa button
    this.button.innerHTML = this.iconFile
      ? `<img src="${this.iconFile}" alt="Ask Septa ?" style="width:2rem;height:2rem;">`
      : "Ask Septa";

    this.sendButton.innerHTML = `<img src="https://cdn.jsdelivr.net/gh/Dwar-liberin/blob/septaSend.png" alt="Send" style="width:1.625rem;height:1.625rem;">`;

    this.expandButton.innerHTML = "&#x26F6;";
    this.expandButton.className = "header-expended-button";
    // Close Button
    this.closeButton.innerHTML = "&times;";
    this.closeButton.className = "septa-close-button";

    // Set Row cols in text area.
    this.input.setAttribute("rows", 1);
    this.input.setAttribute("cols", 22);
    this.input.placeholder = "Type your question...";

    // ChatHeader
    this.chatHeader.appendChild(this.expandButton);
    this.chatHeader.appendChild(this.closeButton);
    // Chatbox
    this.chatbox.appendChild(this.chatHeader);
    this.chatbox.appendChild(this.chatContent);
    this.inputArea.appendChild(this.input);
    this.inputArea.appendChild(this.sendButton);
    this.chatbox.appendChild(this.inputArea);

    this.chatBot.appendChild(this.button);
    this.chatBot.appendChild(this.chatbox);

    document.body.appendChild(this.chatBot);

    // Event listeners
    this.addEventListeners();
    this.showStandardQuestions();
  }
  // Standard questions display
  showStandardQuestions() {
    if (this.standardQuestions.length > 0) {
      this.standardQuestions.forEach((question) => {
        const questionElement = document.createElement("button");
        questionElement.textContent = question;

        questionElement.className = "septa-standard-question";
        questionElement.setAttribute("type", "button");

        this.questionBox.appendChild(questionElement);
        this.chatContent.appendChild(this.questionBox);
        questionElement.onclick = () => {
          this.input.value = question;
          this.sendMessage();
          this.questionBox.style.display = "none";
        };
      });
    }
  }

  toggleButtonDisabledState() {
    const button = this.sendButton;
    if (this.isLoading) {
      button.setAttribute("disabled", "true");
    } else {
      button.removeAttribute("disabled");
    }
  }

  // Event listeners
  addEventListeners() {
    this.button.onclick = () => {
      if (this.chatbox.style.display === "none") {
        this.conversationId = this.conversationId || "conv_" + Date.now();
        this.playSound();
      }

      this.chatbox.style.display =
        this.chatbox.style.display === "none" ? "flex" : "none";
      this.autoOpen = true;
    };

    let isExpanded = false;
    this.expandButton.onclick = () => {
      if (!isExpanded) {
        this.chatbox.style.width = "100vw";
        this.chatbox.style.height = "100vh";
        this.chatbox.style.top = "50%";
        this.chatbox.style.left = "50%";
        this.chatbox.style.transform = "translate(-50%, -50%)";
        this.chatbox.style.borderRadius = this.theme.borderRadius;
        this.expandButton.innerHTML = "&#x2013;";
      } else {
        this.chatbox.style.width = "25rem";
        this.chatbox.style.height = "31.25rem";
        this.chatbox.style.top = "auto";
        this.chatbox.style.left = "auto";
        this.chatbox.style.transform = "none";
        this.chatbox.style.right = "1.25rem";
        this.chatbox.style.bottom = "5rem";
        this.chatbox.style.borderRadius = this.theme.borderRadius;
        this.expandButton.innerHTML = "&#x26F6;";
      }
      isExpanded = !isExpanded;
    };

    // this.closeButton.onclick = () => {
    //   this.chatbox.style.display = "none";
    // if (isExpanded) {
    //   this.expandButton.click(); // Reset to small size when closing
    // }
    //   this.abortController.abort();
    //   this.clearSeptaChatContent();
    // };

    this.closeButton.onclick = () => {
      if (isExpanded) {
        this.expandButton.click();
      }

      this.clearSeptaChatContent();
    };

    this.sendButton.onclick = () => {
      this.sendMessage();
    };

    this.input.onkeydown = (e) => {
      if (e.key === "Enter") {
        if (e.shiftKey) {
          return true;
        } else {
          e.preventDefault();
          if (!this.isLoading) this.sendMessage();
        }
      }
    };

    this.input.addEventListener("input", function () {
      const maxHeight = 3.75 * 16;

      this.style.height = "auto";

      if (this.scrollHeight <= maxHeight) {
        this.style.overflowY = "hidden";
        this.style.height = (this.scrollHeight + 2) / 16 + "rem";
      } else {
        this.style.height = "3.75rem";
        this.style.overflowY = "auto";
      }
    });
  }

  // Play sound when chatbox opens
  playSound() {
    const sound = new Audio(
      "https://cdn.jsdelivr.net/gh/Dwar-liberin/blob/click.mp3"
    );
    sound.play();
  }

  clearSeptaChatContent() {
    const chatContentDiv = document.querySelector(".septa-chat-content");

    // Prevent multiple modals
    if (document.querySelector(".septa-confirm-modal")) return;

    const modal = document.createElement("div");
    modal.className = "septa-confirm-modal";
    modal.innerHTML = `
    <div class="septa-modal-backdrop"></div>
    <div class="septa-modal-box">
      <p>Are you sure you want to clear the chat?</p>
      <div class="septa-modal-actions">
        <button class="confirm-clear">Yes</button>
        <button class="cancel-clear">No</button>
      </div>
    </div>
  `;
    if (chatContentDiv.childNodes.length > 2) {
      chatContentDiv.appendChild(modal);

      //YES → Clear chat + Close chatbot
      modal.querySelector(".confirm-clear").addEventListener("click", () => {
        while (chatContentDiv.firstChild) {
          console.log(chatContentDiv.firstChild);
          chatContentDiv.removeChild(chatContentDiv.firstChild);
        }
        this.chatContent.appendChild(this.questionBox);
        this.questionBox.style.display = "block";
        modal.remove();
        this.chatbox.style.display = "none";
      });

      // NO → Close chatbot WITHOUT clearing chat
      modal.querySelector(".cancel-clear").addEventListener("click", () => {
        modal.remove();
        this.chatbox.style.display = "none";
      });
    } else {
      this.chatbox.style.display = "none";
    }
  }

  // Send message function
  async sendMessage() {
    let message = this.input.value.trim();
    this.input.value = "";
    this.input.style.overflowY = "hidden"; // Disable vertical scrollbar
    this.input.style.height = "auto"; // Adjust the height to fit the content

    let type = "English";
    if (this.selection !== "Text") {
      type = this.selection;
    } else {
      type = "English";
    }

    const actualMessage = message;
    if (this.selection === "Chart") {
      message = message + this.systemMessage;
    }

    if (!message.length) {
      return false;
    }

    this.questionBox.style.display = "none"; // Remove the already question suggestion in the chatbox.
    if (message) {
      this.addMessage(actualMessage, "me");
      const thinkingMessage = this.addMessage("Thinking...", "septa-thinking");

      try {
        this.abortController = new AbortController(); //  Initialize the abortController always new previous
        if (!this.access_token || this.isTokenExpired(this.access_token)) {
          const { access_token, refresh_token } = await this.getAccessToken(); // Fetch new tokens
          this.access_token = access_token; // Save token globally
          this.refresh_token = refresh_token; // Save refresh token globally
        }
        // Call the API with the access token
        await this.callApiWithToken(
          this.access_token,
          message,
          type,
          thinkingMessage,
          this.refresh_token
        );
        // const { access_token, refresh_token } = await this.getAccessToken(); // Step 1: Get Access Token
      } catch (err) {
        console.log("Error", err);
        this.removeMessage(thinkingMessage);
        this.addMessage(
          "Sorry, I'm having trouble understanding your question.",
          "septa"
        );
      }
    }
  }

  // Function to get access token and refresh token
  async getAccessToken() {
    const accessUrl = this.accessTokenUrl;
    const signal = this.abortController.signal;

    const response = await fetch(accessUrl, { signal });

    if (!response.ok) {
      throw new Error("Failed to get access token");
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };
  }

  // Function to refresh access token
  async refreshAccessToken(refresh_token) {
    const refreshUrl = this.accessTokenUrl;

    const signal = this.abortController.signal;

    const response = await fetch(refreshUrl, {
      signal,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "refresh",
        refresh_token: refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh access token");
    }

    const data = await response.json();

    return data.access_token;
  }

  // Function to call the API with token
  async callApiWithToken(
    access_token,
    message,
    type,
    thinkingMessage,
    refresh_token
  ) {
    const signal = this.abortController.signal;
    const requestUrl =
      this.access_level === 1
        ? this.url
        : `https://${this.client_name}.septa.com`;

    try {
      this.isLoading = true;
      this.toggleButtonDisabledState(); // Disable button
      const response = await fetch(requestUrl, {
        signal,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          type: type,
          question: message,
          conversationId: this.conversationId || "conv_" + Date.now(),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // If 401 Unauthorized, refresh the token and retry
          const newAccessToken = await this.refreshAccessToken(refresh_token);
          return this.callApiWithToken(
            newAccessToken,
            message,
            type,
            thinkingMessage,
            refresh_token
          );
        }

        // If it's another error (like 500), throw an error to be caught in catch block
        throw new Error(
          `Request failed with status ${response.status}`,
          response
        );
      }

      const data = await response.json();
      console.log(data);

      if (data) {
        this.removeMessage(thinkingMessage);

        this.createanswer(data.result.toString());
        return true;
      }
    } catch (err) {
      console.log("Error", err);
      this.removeMessage(thinkingMessage); // Remove the "thinking" state

      if (err.name === "AbortError") {
        console.log("Fetch request was cancelled");
        return false;
      }

      this.addMessage(
        "Sorry, I'm having trouble understanding your question.",
        "septa"
      );
    } finally {
      this.isLoading = false;
      this.toggleButtonDisabledState(); // Re-enable button
    }
  }

  parseJwt(token) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  }

  isTokenExpired(token) {
    const decoded = this.parseJwt(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  typeMessage(element, text, speed) {
    let index = 0;
    const interval = setInterval(() => {
      element.textContent += text.charAt(index);
      index++;
      if (index === text.length) {
        clearInterval(interval);
      }
      // Keep chat scrolled to the latest message
      this.chatContent.scrollTop = this.chatContent.scrollHeight;
    }, speed);
  }

  removeMessage(messageElement) {
    if (messageElement) {
      messageElement.remove(); // Remove the "Septa is typing..." message
    }
  }

  createSeptaIcon() {
    const span = document.createElement("span");
    span.innerText = "S";
    span.className = "septa-icon";
    return span;
  }

  createMessageBox() {
    const messageBox = document.createElement("div");
    messageBox.className = "septa-message-box";
    const septaIcon = this.createSeptaIcon();
    messageBox.appendChild(septaIcon);
    return messageBox;
  }

  writeChatContent(messageBox) {
    this.chatContent.appendChild(messageBox);

    requestAnimationFrame(() => {
      messageBox.style.opacity = "1";
      messageBox.style.transform = "translateY(0)";
    }, 100);

    this.chatContent.scrollTop = this.chatContent.scrollHeight;
  }

  // Add message to chat
  addMessage(text, sender = "me") {
    const messageBox = this.createMessageBox();
    const message = document.createElement("div");

    if (sender === "me") {
      message.className = "septa-message";
      message.textContent = text;
      this.chatContent.appendChild(message);
      return true;
    } else if (sender === "septa-thinking") {
      message.className = "septa-septa-thinking-message";
      message.textContent = text;
    } else if (sender === "septa") {
      message.className = "septa-septa-message";
      message.textContent = "";
    }

    messageBox.appendChild(message);
    this.writeChatContent(messageBox);

    if (sender === "septa") {
      this.typeMessage(message, text, 20);
    }
    return messageBox;
  }
}

if (typeof window !== "undefined") {
  window.SeptaChatbot = SeptaChatbot;
}

module.export = SeptaChatbot;
