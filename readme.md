### Septa Chatbot Integration Guide

This guide explains how to integrate the Septa Chatbot into your existing web application. By following these steps, you'll be able to include the Septa chatbot on your website and customize it to match your branding and functionality needs.

---

### 1. **Add the Septa Chatbot Script to Your HTML**

The first step is to include the chatbot script hosted via a CDN in your application's HTML file. This script will load the chatbot functionality dynamically into your page.

#### Add to HTML `<head>` or just before closing the `<body>` tag:

```html
<script src="https://cdn.jsdelivr.net/gh/Dwar-liberin/septa-bot/main-v1.1.7.js"></script>
```

### 2. **Configure the Chatbot**

The chatbot requires a configuration object to customize its behavior and appearance. You can define this configuration inline in your HTML or dynamically using JavaScript.

#### Example Configuration:

```html
<script>
  const config = {
    client_id: "12345", // Unique client ID for your application
    client_name: "exampleClient", // Name to display in the chatbot interface
    access_level: 1, // 0 for basic access, 1 for advanced features (e.g., URL interaction)
    url: "https://staging.septa.live/process", // API endpoint used when access_level is 1
    defaultOption: "Table", // Default data display mode: "Text", "Table", or "Chart"
    selectionMode: ["Text", "Table", "Chart"], // Available data display modes
    standardQuestions: [
      // Standard FAQ questions the chatbot can handle
      "What are the working hours?",
      "How do I reset my password?",
      "How do I contact customer support?",
      "Can I cancel my subscription?",
    ],
    theme: {
      // Customize the chatbot's appearance to match your brand
      colorCode: "#27ae60", // Primary color of the chatbot
      headerColor: "#1abc9c", // Color of the chatbot header
      textColor: "#ffffff", // Text color for messages and buttons
      backgroundColor: "#ecf0f1", // Background color of the chatbot window
      inputBorderColor: "#16a085", // Border color of input fields
      buttonSize: "18px", // Size of buttons
      borderRadius: "6px", // Button and container border radius
    },
  };

  // Initialize the chatbot with the provided configuration
  const septaChat = new SeptaChatbot(config);
</script>
```

### 3. **Include the Script in Your HTML Structure**

Place the above script directly in your HTML file. You can include it either:

- In the `<head>` section for early loading.
- Before the closing `<body>` tag for later loading.

Example:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chatbot Integration</title>
    <script src="https://cdn.jsdelivr.net/gh/Dwar-liberin/septa-bot/main-v1.1.7.js"></script>
  </head>
  <body>
    <!-- Your website content goes here -->

    <script>
      const config = {
        client_id: "12345",
        client_name: "exampleClient",
        access_level: 1,
        url: "https://staging.septa.live/process",
        defaultOption: "Table",
        selectionMode: ["Text", "Table", "Chart"],
        standardQuestions: [
          "What are the working hours?",
          "How do I reset my password?",
          "How do I contact customer support?",
          "Can I cancel my subscription?",
        ],
        theme: {
          colorCode: "#27ae60",
          headerColor: "#1abc9c",
          textColor: "#ffffff",
          backgroundColor: "#ecf0f1",
          inputBorderColor: "#16a085",
          buttonSize: "18px",
          borderRadius: "6px",
        },
      };

      const septaChat = new SeptaChatbox(config);
    </script>
  </body>
</html>
```

---

### 4. **Customizing the Chatbot Appearance**

You can modify the chatbot's appearance by updating the `theme` properties in the configuration object:

- `colorCode`: Changes the primary color.
- `headerColor`: Sets the background color of the chat header.
- `textColor`: Adjusts the color of the text displayed in the chatbot.
- `backgroundColor`: Changes the background color of the entire chat window.
- `inputBorderColor`: Customizes the border of input fields.
- `buttonSize`: Sets the size of buttons.
- `borderRadius`: Adds rounded corners to the chatbot elements.

---

### 5. **Handling Data Display and Access Level**

- **Access Level**:
  - Set `access_level` to 0 for basic interaction (without needing a URL), or set it to 1 if the chatbot should interact with your API through the URL provided in `url`.
- **Data Display Modes**:
  - The `selectionMode` array allows you to specify how the chatbot presents information. It supports `Text`, `Table`, and `Chart`.
  - You can define the default display mode via `defaultOption`.

---

### 6. **Adding the Chatbot to a React Application**

If you are integrating this chatbot into a React application, follow these steps:

1. **Dynamically Load the Script**: React applications often require dynamically loading external scripts.

```jsx
import { useEffect } from "react";

const Chatbot = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/gh/Dwar-liberin/septa-bot/main-v1.1.7.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const config = {
        client_id: "12345",
        client_name: "exampleClient",
        access_level: 1,
        url: "https://staging.septa.live/process",
        defaultOption: "Table",
        selectionMode: ["Text", "Table", "Chart"],
        standardQuestions: [
          "What are the working hours?",
          "How do I reset my password?",
          "How do I contact customer support?",
          "Can I cancel my subscription?",
        ],
        theme: {
          colorCode: "#27ae60",
          headerColor: "#1abc9c",
          textColor: "#ffffff",
          backgroundColor: "#ecf0f1",
          inputBorderColor: "#16a085",
          buttonSize: "18px",
          borderRadius: "6px",
        },
      };
      // Initialize the SeptaChatbox after script loads
      if (window.SeptaChatbox) {
        new window.SeptaChatbox(config);
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="septa-chat-container"></div>;
};

export default Chatbot;
```

2. **Add the Chatbot Component** to any part of your React app where you want the chatbot to appear.

```jsx
function App() {
  return (
    <div className="App">
      {/* Other components */}
      <Chatbot />
    </div>
  );
}
```

---

### 7. **Handling Errors and Issues**

If you encounter any errors while loading or initializing the chatbot, ensure:

- The CDN script is correctly referenced.
- The `SeptaChatbox` constructor is called after the script is fully loaded.
- Ensure your client ID and other config values are correct.

---

### Conclusion

By following this guide, you can successfully integrate the Septa Chatbot into your existing web or React-based applications. The chatbot is highly configurable and can be customized to meet your specific needs and branding.
