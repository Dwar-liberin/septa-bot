class SeptaChatbox {
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

    // URL is required if access_level is 1
    if (this.access_level === 1 && !config.url) {
      throw new Error("URL is required when access_level is set to 1.");
    }
    this.url = config.url || `${this.client_name}.septa.com`;
    this.fontFamily = config.theme?.fontFamily || "Roboto";
    this.defaultOption = config.defaultOption;
    this.selection = this.defaultOption;

    // Optional Parameters for Theme
    this.theme = config.theme || {
      colorCode: "#27ae60",
      headerColor: "#1abc9c",
      textColor: "#ffffff",
      backgroundColor: "#ecf0f1",
      inputBorderColor: "#16a085",
      buttonSize: "18px",
      borderRadius: "12px",
    };
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

  createDropdown(config) {
    const dropdown = document.createElement("select");
    const options = ["Text", "Table", "Chart"];

    options.forEach((option) => {
      const optElement = document.createElement("option");
      optElement.value = option;
      optElement.text = option;
      if (option === this.defaultOption) {
        optElement.selected = true;
      }
      dropdown.appendChild(optElement);
    });

    dropdown.addEventListener("change", (selection) => {
      if (selection) {
        this.selection = selection.target.value;
      } else {
        this.selection = this.selection;
      }
    });

    dropdown.style.cssText = `
        padding: 5px;
        line-height: 1.5;
        border-radius: 5px;
        font-size: 0.8rem;
        letter-spacing: 1px;
        box-sizing: border-box;
        resize:none;
        outline-color:${this.theme.inputBorderColor};
        border: 1px solid rgb(225 225 225);
        border-radius:${this.theme.borderRadius};
        font-family: ${this.fontFamily ?? "Roboto"}; 
    `;

    this.inputArea.appendChild(dropdown); // Append dropdown to your UI
  }

  handleTableResponse(data) {
    const messageBox = this.createMessageBox();

    const table = document.createElement("table");
    table.setAttribute("border", "1");
    table.style.cssText = `
      border-collapse: collapse;
      width: 100%;
      margin:5px;
      margin-bottom:15px;
      background: white;
    `;

    if (data.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.innerText = "No data available.";
      messageBox.appendChild(emptyMessage);
      this.writeChatContent(messageBox);
      return;
    }

    // Dynamically create headers based on the object keys
    const headerRow = table.insertRow();
    const headers = Object.keys(data[0]); // Use the keys from the first object as headers
    headers.forEach((header) => {
      const th = document.createElement("th");
      th.innerText = this.capitalizeFirstLetter(header.replace(/_/g, " ")); // Capitalize and replace underscores
      headerRow.appendChild(th);
    });

    // Populate rows with data
    data.forEach((item) => {
      const row = table.insertRow();

      // Create cells dynamically for each key in the object
      headers.forEach((key) => {
        const cell = row.insertCell();
        cell.style.cssText = "padding:9px";
        cell.innerText = item[key] ?? ""; // Fill cell with the corresponding value
      });
    });

    messageBox.appendChild(table);
    this.writeChatContent(messageBox);
  }

  // Helper function to capitalize the first letter of a string
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  handleChartResponse(htmlString) {
    const messageBox = this.createMessageBox();

    // Create a new div for the chart
    const graph = document.createElement("div");

    // Styling for the graph container
    graph.style.cssText = `
        width: 310px;
        padding: 12px;
        background: white;
        margin-bottom: 10px;
    `;

    // Generate a unique ID for the chart
    const uniqueChartId = `barchart_material_${Date.now()}`; // Unique ID based on timestamp

    // Replace the ID in the htmlString with the unique ID
    graph.innerHTML = htmlString.replace(
      /id="barchart_material"/,
      `id="${uniqueChartId}"`
    );

    // Append the graph container to the message box
    messageBox.appendChild(graph);

    // Write the message box content to the chat UI
    this.writeChatContent(messageBox);

    // Dynamically load Google Charts and execute the scripts
    this.loadGoogleCharts().then(() => {
      // Modify the original script to use the unique ID
      this.runScriptsInHtml(graph, uniqueChartId);
    });

    return messageBox; // Return the message box if needed
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
          /barchart_material/g, // Replace old ID with new unique ID
          uniqueChartId
        );

        document.body.appendChild(newScript);
      }
    }
  }

  loadGoogleCharts() {
    return new Promise((resolve, reject) => {
      if (typeof google !== "undefined" && google.charts) {
        resolve(); // Google Charts is already loaded
      } else {
        const script = document.createElement("script");
        script.src = "https://www.gstatic.com/charts/loader.js";
        script.onload = () => {
          google.charts.load("current", { packages: ["corechart", "bar"] });
          google.charts.setOnLoadCallback(() => {
            resolve(); // Charts library loaded
          });
        };
        script.onerror = reject;
        document.head.appendChild(script);
      }
    });
  }

  // Create and style element
  initializeChatbox() {
    this.button = document.createElement("button");
    this.chatbox = document.createElement("div");
    this.chatHeader = document.createElement("div");
    this.expandButton = document.createElement("button");
    this.closeButton = document.createElement("button");
    this.chatContent = document.createElement("div");
    this.inputArea = document.createElement("div");
    this.input = document.createElement("textarea"); // Use textarea for multiline input
    this.sendButton = document.createElement("button");
    this.questionBox = document.createElement("div");
    this.createDropdown(this.config);

    this.loadGoogleFont(this.fontFamily);

    // Ask Septa button
    this.button.innerHTML = this.iconFile
      ? `<img src="${this.iconFile}" alt="Ask Septa ?" style="width:32px;height:32px;">`
      : "Ask Septa";

    this.button.style.cssText = `
        position:fixed;
        bottom:20px;
        right:20px;
        background:${this.theme.colorCode};
        color:${this.theme.textColor};
        border:none;
        border-radius:25px;
        padding:10px 20px;
        font-size:${this.theme.buttonSize};
        cursor:pointer;
        z-index:1000;
        font-family:${this.fontFamily ?? "Roboto"}
      `;

    // Chatbox
    this.chatbox.style.cssText = `
        display:none;
        position:fixed;
        bottom:80px;
        right:20px;
        width:400px;
        height:500px;
        background:${this.theme.backgroundColor};
        border:1px solid #ddd;
        border-radius:${this.theme.borderRadius};
        z-index:1000;
        transition:all 0.3s ease;
        display:flex;
        flex-direction:column;
        font-family: ${this.fontFamily ?? "Roboto"}
      `;

    // Header
    this.chatHeader.style.cssText = `
        display:flex;
        justify-content:flex-end;
        padding:5px;
        background:${this.theme.headerColor};
        border-bottom:1px solid #ddd;
        border-radius:${this.theme.borderRadius} ${this.theme.borderRadius} 0 0;
      `;
    this.expandButton.innerHTML = "&#x26F6;";
    this.expandButton.style.cssText = `
        background:none;
        border:none;
        cursor:pointer;
        font-size:20px;
        margin-right:5px;
         padding-bottom: 5px;
        color:${this.theme.textColor}
      `;
    this.closeButton.innerHTML = "&times;";
    this.closeButton.style.cssText = `
        background:none;
        border:none;
        cursor:pointer;
        font-size:24px;
        color:${this.theme.textColor}
      `;

    // Chat Content
    this.chatContent.style.cssText = `
        flex-grow:1;
        overflow-y:auto;
        padding:14px;
        display:flex;
        flex-direction:column;
        background-color:#F7F7F7;
        font-family: ${this.fontFamily ?? "Roboto"}
      `;

    // Input Area
    this.inputArea.style.cssText = `
        display:flex;
        padding:8px 6px;
        // padding-top:4px;
        box-sizing: border-box;
        width: 100%;
        resize:none;
        border-end-end-radius:${this.theme.borderRadius};
        border-end-start-radius:${this.theme.borderRadius};
        outline-color:${this.theme.inputBorderColor};
        background-color: #fff;
        font-family: ${this.fontFamily ?? "Roboto"};
        box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
      `;

    this.input.style.cssText = `
        padding: 10px;
        max-width: 100%;
        line-height: 1.5;
        border-radius: 5px;
        font-size: 0.8rem;
        letter-spacing: 1px;
        width: 100%;
        box-sizing: border-box;
        resize:none;
        outline-color:${this.theme.inputBorderColor};
      //  border-color:${this.theme.inputBorderColor};
        border: 1px solid rgb(225 225 225);
        border-radius:${this.theme.borderRadius};
        font-family: ${this.fontFamily ?? "Roboto"}; 
      `;

    this.input.setAttribute("rows", 1);
    this.input.setAttribute("cols", 22);

    this.input.placeholder = "Type your question...";

    // Base64 icon for send button

    this.sendButton.style = `
      border:none;
      background:none;
      cursor:pointer;
      padding-top: 5px;
      //color:${this.theme.colorCode};
    `;

    this.sendButton.innerHTML = `<img src="https://cdn.jsdelivr.net/gh/Dwar-liberin/blob/septaSend.png" alt="Send" style="width:26px;height:26px;">`;

    // Assemble elements
    this.chatHeader.appendChild(this.expandButton);
    this.chatHeader.appendChild(this.closeButton);
    this.chatbox.appendChild(this.chatHeader);
    this.chatbox.appendChild(this.chatContent);
    this.inputArea.appendChild(this.input);
    this.inputArea.appendChild(this.sendButton);
    this.chatbox.appendChild(this.inputArea);
    document.body.appendChild(this.button);
    document.body.appendChild(this.chatbox);

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

        questionElement.style.cssText = `
          display:block;
          background:none;
          border:none;
          color:${this.theme.colorCode};
          cursor:pointer;
          padding:10px;
          margin-bottom:7px;
          text-align:left;
          font-size:14px;
          border: 1px solid ${this.theme.inputBorderColor};
          border-radius: ${this.theme.borderRadius}
          `;

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

  // Event listeners
  addEventListeners() {
    this.button.onclick = () => {
      if (this.chatbox.style.display === "none") {
        this.playSound();
      }

      this.chatbox.style.display =
        this.chatbox.style.display === "none" ? "flex" : "none";
      this.autoOpen = true;
    };

    let isExpanded = false;
    this.expandButton.onclick = () => {
      if (!isExpanded) {
        this.chatbox.style.width = "800px";
        this.chatbox.style.height = "500px";
        this.chatbox.style.top = "50%";
        this.chatbox.style.left = "50%";
        this.chatbox.style.transform = "translate(-50%, -50%)";
        this.chatbox.style.borderRadius = this.theme.borderRadius;
        this.expandButton.innerHTML = "&#x2013;";
      } else {
        this.chatbox.style.width = "400px";
        this.chatbox.style.height = "500px";
        this.chatbox.style.top = "auto";
        this.chatbox.style.left = "auto";
        this.chatbox.style.transform = "none";
        this.chatbox.style.right = "20px";
        this.chatbox.style.bottom = "80px";
        this.chatbox.style.borderRadius = this.theme.borderRadius;
        this.expandButton.innerHTML = "&#x26F6;";
      }
      isExpanded = !isExpanded;
    };

    this.closeButton.onclick = () => {
      this.chatbox.style.display = "none";
      if (isExpanded) {
        this.expandButton.click(); // Reset to small size when closing
      }
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
          this.sendMessage();
        }
      }
    };

    this.input.addEventListener("input", function () {
      const maxHeight = 60; // Set the maximum height when the scrollbar should appear

      // Reset height to auto to allow shrinking
      this.style.height = "auto";

      // Check if the content height (scrollHeight) is less than the maxHeight
      if (this.scrollHeight <= maxHeight) {
        this.style.overflowY = "hidden"; // Disable vertical scrollbar
        this.style.height = this.scrollHeight + 2 + "px"; // Adjust the height to fit the content
      } else {
        // Set the textarea to the maxHeight and allow scroll
        this.style.height = maxHeight + "px";
        this.style.overflowY = "auto"; // Enable vertical scrollbar
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

  // Send message function
  sendMessage() {
    const message = this.input.value.trim();
    if (!message.length) {
      return false;
    }

    this.questionBox.style.display = "none"; // Remove the already question suggestion in the chatbox.
    if (message) {
      this.addMessage(`${message}`, "me");
      const thinkingMessage = this.addMessage("Thinking...", "septa-thinking");
      const requestUrl =
        this.access_level === 1
          ? this.url
          : `https://${this.client_name}.septa.com`;

      fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer ",
        },
        body: JSON.stringify({
          type: "English",
          question: message,
          conversationId: this.conversationId || "conv_" + Date.now(),
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.result) {
            this.removeMessage(thinkingMessage); // Remove the "thinking" state
            if (this.selection === "Text") {
              this.addMessage(data.result, "septa");
            } else if (this.selection === "Table") {
              this.handleTableResponse(JSON.parse(data.result)); // Handle Table response
            } else if (this.selection === "Chart") {
              this.handleChartResponse(data.result); // Handle Chart response
            }
          }
        })
        .catch((err) => {
          console.error("err", err);
          this.removeMessage(thinkingMessage); // Remove the "thinking" state
          this.addMessage(
            "Sorry, I'm having trouble understanding your question.",
            "septa"
          );
        });
      this.input.value = "";
      this.input.style.overflowY = "hidden"; // Disable vertical scrollbar
      this.input.style.height = "auto"; // Adjust the height to fit the content
    }
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
    span.style.cssText = `
          background: ${this.theme.colorCode};
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          justify-content: center;
          color: #ffffff;
          font-size:1rem;
      `;
    return span;
  }

  createMessageBox() {
    const messageBox = document.createElement("div");
    messageBox.style.cssText = `
    display:flex;
    gap:8px;
    opacity: 0; /* Initially hidden */
    transform: translateY(20px); /* Slide up effect */
    transition: opacity 0.5s ease, transform 0.5s ease; /* Add smooth transition */
`;

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
    message.textContent = sender === "septa" ? "" : text;

    if (sender === "me") {
      message.style.cssText = `
          background-color: ${this.theme.colorCode}; /* Use the theme color */
          color: ${this.theme.textColor}; /* Text color from theme */
          padding: 12px 18px;
          border-radius: ${this.theme.borderRadius} 0 ${
        this.theme.borderRadius
      } ${this.theme.borderRadius};
          margin-bottom: 10px;
          align-self: flex-end;
          max-width: 70%;
          word-wrap: break-word;
          font-family: ${this.fontFamily ?? "Roboto"};
          font-size:14px;
          box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;

          `;
      this.chatContent.appendChild(message);

      requestAnimationFrame(() => {
        messageBox.style.opacity = "1";
        messageBox.style.transform = "translateY(0)";
      }, 100);

      this.chatContent.scrollTop = this.chatContent.scrollHeight;
      return true;
    } else if (sender === "septa-thinking")
      message.style.cssText = `
            padding: 5px;
            background:#fff ;
            color: #000;
            padding: 12px 18px;
            font-style: italic;
            border-radius: 10px;
              border-radius: 0 ${this.theme.borderRadius} ${this.theme.borderRadius} ${this.theme.borderRadius};
            text-align: left;
            margin-bottom: 10px;
            align-self: flex-start;
            max-width: 80%;
            font-size:14px;
          `;
    else if (sender === "septa")
      message.style.cssText = `
        background-color: #fff;
        color: #001F3F;
        padding: 12px 18px;
        border-radius: 0 ${this.theme.borderRadius} ${
        this.theme.borderRadius
      } ${this.theme.borderRadius};
        margin-bottom: 10px;
        align-self: flex-start;
        max-width: 70%;
        word-wrap: break-word;
        font-family: ${this.fontFamily ?? "Roboto"};
        font-size:14px
        box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
        `;

    messageBox.appendChild(message);
    this.writeChatContent(messageBox);

    if (sender === "septa") {
      this.typeMessage(message, text, 20);
    }
    return messageBox;
  }
}

module.export = SeptaChatbox;
