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
      colorCode: "#27ae60",
      headerColor: "#1abc9c",
      textColor: "#ffffff",
      backgroundColor: "#ecf0f1",
      inputBorderColor: "#16a085",
      buttonSize: "18px",
      borderRadius: "12px",
      outstockColor: "#ff0000",
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

    this.createScopedStyles();
  }

  createScopedStyles() {
    const style = document.createElement("style");
    style.textContent = `
    #septa .septa-chatBot{
     all: unset;
    }

   #septa .header-expended-button {
        background:none;
        border:none;
        cursor:pointer;
        font-size:20px;
        margin-right:5px;
        padding-bottom: 5px;
        color:${this.theme.textColor}
    }

   #septa .septa-chatbox {
      display: none;
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 400px;
      height: 80vh;
      background: ${this.theme.backgroundColor};
      border: 1px solid #ddd;
      border-radius: ${this.theme.borderRadius};
      z-index: 1000;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      font-family: ${this.fontFamily ?? "Roboto"};
    }

   #septa .septa-chatbox-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: ${this.theme.colorCode};
          color: ${this.theme.textColor};
          border: none;
          border-radius: 25px;
          padding: 10px 20px;
          font-size: ${this.theme.buttonSize};
          cursor: pointer;
          z-index: 1000;
          font-family: ${this.fontFamily ?? "Roboto"};
        }
  
  
      #septa .septa-chat-header {
          display: flex;
          justify-content: flex-end;
          padding: 5px;
          background: ${this.theme.headerColor};
          border-bottom: 1px solid #ddd;
          border-radius: ${this.theme.borderRadius} ${this.theme.borderRadius
      } 0 0;
        }
  
     #septa .septa-chat-content {
          flex-grow: 1;
          overflow-y: auto;
          padding: 14px;
          display: flex;
          flex-direction: column;
          background-color: #F7F7F7;
          font-family: ${this.fontFamily ?? "Roboto"};
        }
  
        #septa .septa-input-area {
          display: flex;
          padding: 8px 6px;
          box-sizing: border-box;
          width: 100%;
          resize:none;
          border-end-end-radius:${this.theme.borderRadius};
          border-end-start-radius:${this.theme.borderRadius};
          border-radius: ${this.theme.borderRadius};
          outline-color: ${this.theme.inputBorderColor};
          background-color: #fff;
          font-family: ${this.fontFamily ?? "Roboto"};
          box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
        }
  
       #septa .septa-input {
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
        }
  
        #septa .septa-send-button {
          border: none;
          background: none;
          cursor: pointer;
          padding-top: 5px;
          color: ${this.theme.colorCode};
        }
  
        #septa .septa-message-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          opacity: 0; /* Initially hidden */
          transform: translateY(20px); /* Slide up effect */
          transition: opacity 0.5s ease, transform 0.5s ease; /* Add smooth transition */
        }
  
       #septa .septa-message {
          background-color: ${this.theme.colorCode}; /* Use the theme color */
          color: ${this.theme.textColor}; /* Text color from theme */
          padding: 12px 18px;
          border-radius: ${this.theme.borderRadius} 0 ${this.theme.borderRadius
      } ${this.theme.borderRadius};
          margin-bottom: 10px;
          align-self: flex-end;
          max-width: 70%;
          word-wrap: break-word;
          font-family: ${this.fontFamily ?? "Roboto"};
          font-size: 14px;
          box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
        }
  
      #septa .septa-septa-message {
          background-color: #fff;
          color: #001F3F;
          padding: 12px 18px;
          border-radius: 0 ${this.theme.borderRadius} ${this.theme.borderRadius
      } ${this.theme.borderRadius};
          margin-bottom: 10px;
          align-self: flex-start;
          max-width: 70%;
          word-wrap: break-word;
          font-family: ${this.fontFamily ?? "Roboto"};
          font-size: 14px;
          box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
        }
  
       #septa .septa-septa-thinking-message {
          padding: 5px;
          background: #fff;
          color: #000;
          padding: 12px 18px;
          font-style: italic;
          border-radius: 10px;
          border-radius: 0 ${this.theme.borderRadius} ${this.theme.borderRadius
      } ${this.theme.borderRadius};
          text-align: left;
          margin-bottom: 10px;
          align-self: flex-start;
          max-width: 80%;
          font-size: 14px;
        }
       #septa .septa-close-button{
            background:none;
            border:none;
            cursor:pointer;
            font-size:24px;
            color:${this.theme.textColor}
        }
       #septa .septa-standard-question{
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
        }
          #septa .septa-dropdown{
          display:none;
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
          }
        #septa .septa-icon{
          background: ${this.theme.colorCode};
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          justify-content: center;
          color: #ffffff;
          font-size:1rem;
          min-width:20px

        }
         #septa .septa-table{
            border-collapse: collapse;
            width: 100%;
            margin:5px;
            margin-bottom:15px;
            background: white;
         }
         #septa .septa-table-cell{
           padding:10px;
         }
          
       #septa .product-card-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
          padding: 1rem 0rem;
          cursor: pointer;
       }  
            
       #septa .product-card {
          display: flex;
          background: #fff;
          border-radius: ${this.theme.borderRadius};
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          width: 300px;
          max-width: 100%;
        }

        #septa .product-image {
          flex: 1;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #septa .product-image img {
          width: 90%;
          object-fit: contain;
          border-radius: ${this.theme.borderRadius};
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          height:150px;
        }

       #septa .product-details {
          flex: 1;
          padding: 1rem 0.5rem;
          position: relative;
        }

        #septa .top-bar {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        #septa .heading{
         margin: 0;
          font-size: 14px;
          font-weight: bold;
        }

        #septa .title{
          margin: 0;
          font-size: 12px;
        }

        #septa .subtitle {
          font-size: 6px;
          color: gray;
        }

        #septa .price {
          font-size: 10px;
          font-weight: bold;
          margin: 10px 0;
        }

        #septa .description {
          display: -webkit-box;
          -webkit-line-clamp: 2; /* Clamp to 2 lines */
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.4em;
          max-height: 2.8em; /* Adjust as needed */
          font-size: 10px;
          color: gray;
        }

        #septa .add-to-cart {
          background-color: ${this.theme.colorCode};
          color: ${this.theme.textColor};
          padding: 5px 10px;
          font-size: 12px;
          border: none;
          border-radius: 30px;
          cursor: pointer;
          width: 90%;
        }

        
        #septa .outstock {
          background-color: #ff0000;
          color: ${this.theme.textColor};
          padding: 5px 10px;
          font-size: 12px;
          border: none;
          border-radius: 30px;
          width: 90%;
        }
    
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

  createDropdown(selection) {
    const dropdown = document.createElement("select");
    const options = selection ?? ["Text", "Table", "Chart"];

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

    dropdown.className = "septa-dropdown";
    this.inputArea.appendChild(dropdown); // Append dropdown to your UI
  }

  handleTableResponse(data) {
    if (data.length === 0) {
      this.addMessage("No Data Available", "septa");
      console.log("no", data);
      return true;
    }

    const messageBox = this.createMessageBox();
    const table = document.createElement("table");
    table.setAttribute("border", "1");
    table.className = "septa-table";

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
        cell.className = "septa-table-cell";
        cell.innerText = item[key] ?? ""; // Fill cell with the corresponding value
      });
    });

    messageBox.appendChild(table);
    this.writeChatContent(messageBox);
  }

  createProductCards(products) {
    // // Normalize to array
    // const items = Array.isArray(products) ? products : [products];
    const items = Array.isArray(products) ? products.slice(1).filter(
      (item) => typeof item === "object" && item !== null && !Array.isArray(item)
    ) : [];


    // Create one message box for all cards
    const messageBox = this.createMessageBox();
    const container = document.createElement("div");
    container.className = "product-card-container";

    if (typeof products[0] === "string") {
      const heading = document.createElement("p");
      heading.className = "heading"
      heading.textContent = products[0];
      messageBox.appendChild(heading);
    }

    items.forEach((product) => {

      console.log(typeof product);
      // Card wrapper
      const card = document.createElement("div");
      card.className = "product-card";
      card.addEventListener("click", () => {
        window.open(product.link, "_blank");
      });

      // Product Image container.
      const productImageContainer = document.createElement("div");
      productImageContainer.className = "product-image";
      // Optional Image
      if (product.guid) {

        // const originalString = product.imageGuid;
        // console.log(originalString)
        // const regex = /localhost/g; // The 'g' flag ensures all occurrences are replaced
        // const replacement = "192.168.1.81";

        // const newString = originalString.replace(regex, replacement);

        // console.log(newString);


        const img = document.createElement("img");
        img.src = product.imageGuid;  //imageGuid
        Object.assign(img.style, {
          width: "100%",
          display: "block",
          objectFit: "cover",
        });
        productImageContainer.appendChild(img);
      }

      // Content container
      const productDetailsContainer = document.createElement("div");
      productDetailsContainer.className = "product-details";

      // Title
      const title = document.createElement("h2");
      title.textContent = product.title;
      title.className = "title";
      productDetailsContainer.appendChild(title);

      // subtitle
      // const subtitle = document.createElement("p");
      // subtitle.textContent = product?.subtitle;
      // subtitle.className = "subtitle";
      // productDetailsContainer.appendChild(subtitle);

      //Price
      const price = document.createElement("p");
      price.textContent = product.price;
      price.className = "price";
      productDetailsContainer.appendChild(price);

      // Description
      if (product.text) {
        const desc = document.createElement("p");
        desc.textContent = product.text;
        desc.className = "description";
        productDetailsContainer.appendChild(desc);
      }

      // Action Button
      const btn = document.createElement("button");
      if (product.stockStatus === "instock") {
        btn.textContent = "Add to cart";
        btn.className = "add-to-cart";
        btn.addEventListener("click", (e) => {
          e.stopPropagation()
          window.open(product.addToCart, "_blank");
        });
      } else {
        btn.textContent = "Out of stock";
        btn.className = "outstock";
        btn.disabled = true;

      }
      productDetailsContainer.appendChild(btn);

      // append the both child image container & productDetailsContainer.
      // card is a main container of the card container.
      card.appendChild(productImageContainer);
      card.appendChild(productDetailsContainer);


      container.appendChild(card); // it's a flex container so card look horizontal
      messageBox.appendChild(container);

    });

    // Append all cards in one go
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
    // graph.className = "septa-graph";

    // Styling for the graph container
    graph.style.cssText = `
          min-width: 800px;
          // width: 95%;
          // height:500px;
          padding: 12px;
          background: white;
          margin-bottom: 10px;
      `;

    // Generate a unique ID for the chart
    const uniqueChartId = `myChart_${Date.now()}`; // Unique ID based on timestamp

    // // Replace the ID in the htmlString with the unique ID
    graph.innerHTML = htmlString.replace(
      /id="chart_div"/,
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
          /chart_div/g, // Replace old ID with new unique ID
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
    this.createDropdown(this.selectionMode);

    this.loadGoogleFont(this.fontFamily);

    // Ask Septa button
    this.button.innerHTML = this.iconFile
      ? `<img src="${this.iconFile}" alt="Ask Septa ?" style="width:32px;height:32px;">`
      : "Ask Septa";

    this.sendButton.innerHTML = `<img src="https://cdn.jsdelivr.net/gh/Dwar-liberin/blob/septaSend.png" alt="Send" style="width:26px;height:26px;">`;

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
      this.abortController.abort();
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

  clearSeptaChatContent() {
    // Display confirmation panel (using a simple confirm dialog)
    const chatContentDiv = document.querySelector(".septa-chat-content");
    if (chatContentDiv.childNodes.length > 2) {
      const userConfirmed = confirm("Are you sure you want to clear the chat?");

      if (userConfirmed) {
        while (chatContentDiv.firstChild) {
          chatContentDiv.removeChild(chatContentDiv.firstChild);
        }
        this.chatContent.appendChild(this.questionBox);
        this.questionBox.style.display = "block"; // Show the chatbox.
      } else {
      }
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
        this.removeMessage(thinkingMessage); // Remove the "thinking" state
        if (this.selection === "Text") {
          // if (data.responseType.toUpperCase() === "CARD") {
          const cards = data;
          this.createProductCards(cards);
          return true;
          //}

          this.addMessage(data, "septa");
          // } else if (this.selection === "Table") {
          //   this.handleTableResponse(data.result); // Handle Table response
          // } else if (this.selection === "Chart") {
          //   this.handleChartResponse(data.result); // Handle Chart response
          // } else if (
          //   this.selection === "Text" ||
          //   data.responseType.toUpperCase() === "CARD"
          // ) {
          //   const cards = JSON.parse(data.result);
          //   this.createProductCards(cards);
          //   return true;
          // }
        }
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
      // Set loading state to false after the request
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
