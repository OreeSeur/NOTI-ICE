import { AppRouter } from "./routes/AppRouter";
import { ChatWidget } from "./components/chatbot/ChatWidget";
import { appConfig } from "./config/appConfig";

function App() {
  return (
    <>
      <AppRouter />
      {appConfig.chatbotEnabled && <ChatWidget />}
    </>
  );
}

export default App;
