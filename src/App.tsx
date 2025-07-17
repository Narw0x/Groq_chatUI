import React, { useState, useEffect, useRef } from 'react';
import { Groq } from 'groq-sdk';


interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Groq SDK with API key
    const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
        dangerouslyAllowBrowser: true,
    });

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [...messages, userMessage].map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                })),
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                max_tokens: 1000,
            });

            const assistantMessage: Message = {
                role: 'assistant',
                content: chatCompletion.choices[0]?.message?.content || 'No response',
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error fetching Groq API:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Error: Could not connect to AI service' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-blue-600 text-white p-4 text-center">
                <h1 className="text-2xl font-bold">AI Chat App</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                                msg.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-800'
                            }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-lg">Thinking...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t">
                <div className="flex space-x-2">
          <textarea
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={2}
          />
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;