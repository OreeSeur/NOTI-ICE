import { AppRouter } from "./routes/AppRouter";
import { ChatWidget } from "./components/chatbot/ChatWidget";

function App() {
  return (
    <>
      <AppRouter />
      <ChatWidget />
    </>
  );
}

export default App;
