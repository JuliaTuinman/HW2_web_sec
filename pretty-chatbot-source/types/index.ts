export interface IChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChatState {
  messages: IChatMessage[];
  isLoading: boolean;
}