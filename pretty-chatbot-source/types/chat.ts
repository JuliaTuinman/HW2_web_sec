export interface IChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface IChatState {
  messages: IChatMessage[];
  isLoading: boolean;
}