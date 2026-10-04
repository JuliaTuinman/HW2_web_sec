import Chat from '@/components/Chat';
import { ChatProvider } from '@/contexts/ChatContext';

export default function Home() {
  return (
    <ChatProvider>
      <Chat />
    </ChatProvider>
  );
}
