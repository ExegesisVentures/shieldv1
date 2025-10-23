'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  canExpand?: boolean;
  suggestions?: string[];
}

// Helper function to parse markdown-style text
const parseMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let currentParagraph: string[] = [];
  let listItems: string[] = [];
  let inList = false;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const content = currentParagraph.join(' ');
      elements.push(
        <p key={elements.length} className="mb-3 leading-relaxed last:mb-0">
          {parseInlineFormatting(content)}
        </p>
      );
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="mb-4 pl-5 space-y-2 last:mb-0">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-[rgba(255,255,255,0.9)] leading-relaxed">
              <span className="text-[#25d695] mr-2">•</span>
              {parseInlineFormatting(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const parseInlineFormatting = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let remaining = text;
    let key = 0;

    // Parse bold **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        const before = remaining.substring(lastIndex, match.index);
        parts.push(...parseItalicAndCode(before, key));
        key += 100;
      }
      parts.push(
        <strong key={`bold-${key++}`} className="font-semibold text-[#a78bfa]">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < remaining.length) {
      parts.push(...parseItalicAndCode(remaining.substring(lastIndex), key));
    }

    return parts;
  };

  const parseItalicAndCode = (text: string, baseKey: number): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    
    // Parse code `text`
    const codeRegex = /`(.+?)`/g;
    let lastIndex = 0;
    let match;
    let key = baseKey;

    while ((match = codeRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <code key={`code-${key++}`} className="bg-[rgba(37,214,149,0.15)] text-[#25d695] px-2 py-0.5 rounded text-sm font-mono">
          {match[1]}
        </code>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('###')) {
      flushParagraph();
      flushList();
      elements.push(
        <h4 key={elements.length} className="text-base font-semibold text-[#25d695] mb-3 mt-2">
          {trimmed.substring(3).trim()}
        </h4>
      );
    } else if (trimmed.startsWith('##')) {
      flushParagraph();
      flushList();
      elements.push(
        <h3 key={elements.length} className="text-lg font-semibold text-[#25d695] mb-3 mt-3">
          {trimmed.substring(2).trim()}
        </h3>
      );
    } else if (trimmed.startsWith('#')) {
      flushParagraph();
      flushList();
      elements.push(
        <h2 key={elements.length} className="text-xl font-bold bg-gradient-to-r from-[#25d695] to-[#a78bfa] bg-clip-text text-transparent mb-4 mt-2">
          {trimmed.substring(1).trim()}
        </h2>
      );
    }
    // List items
    else if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph();
      inList = true;
      const itemText = trimmed.substring(trimmed.startsWith('•') ? 1 : 2).trim();
      listItems.push(itemText);
    }
    // Empty lines
    else if (trimmed === '') {
      if (inList) {
        flushList();
      } else {
        flushParagraph();
      }
    }
    // Regular text
    else {
      if (inList) {
        flushList();
      }
      currentParagraph.push(trimmed);
    }
  });

  // Flush any remaining content
  flushParagraph();
  flushList();

  return elements.length > 0 ? elements : [<p key="0">{text}</p>];
};

const WiseOwlChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '🛡️ Welcome to Shield Nest! I\'m your DeFi assistant. Ask me about Coreum, Shield2, token swaps, liquidity pools, or anything blockchain!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [rotation, setRotation] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Use local Next.js API route
  const API_URL = '';

  // Track mouse position and calculate rotation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const buttonCenterX = buttonRect.left + buttonRect.width / 2;
      const buttonCenterY = buttonRect.top + buttonRect.height / 2;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Calculate angle from button center to mouse
      const deltaX = mouseX - buttonCenterX;
      const deltaY = mouseY - buttonCenterY;
      
      // atan2 returns angle in radians, convert to degrees
      // atan2(y, x) gives angle from positive x-axis (3 o'clock = 0°)
      // Add 180° to flip the rotation so button faces toward the mouse
      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 180;
      
      setRotation(angle);
    };

    // Use capture phase to ensure we get events even when console is open
    window.addEventListener('mousemove', handleMouseMove, { capture: true, passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove, true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText?: string, expand = false) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('🚀 Sending message to chat API:', { textToSend, sessionId, project: 'shield2', expand });
      
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          sessionId,
          project: 'shield2',
          expand
        })
      });

      console.log('📡 Chat API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Chat API error response:', errorText);
        throw new Error(`Chat API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Chat API response data:', data);

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'Sorry, I received an empty response. Please try again.',
        timestamp: new Date(),
        canExpand: data.canExpand,
        suggestions: data.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('❌ Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `🛡️ Oops! Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    'How do I swap tokens?',
    'What is Shield2?',
    'Connect wallet help',
    'What are gas fees?'
  ];

  return (
    <>
      {/* Chat Button with Shield Nest Logo - Fixed Position Bottom Right */}
      <div 
        className="fixed bottom-8 right-8 z-[9999]" 
        ref={buttonRef}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="relative w-20 h-20">
          {/* Animated expanding rings - behind button */}
          {!isOpen && (
            <>
              {/* Outer expanding ring - ping animation */}
              <motion.span 
                className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-[#25d695] pointer-events-none"
                animate={{
                  scale: [1, 1.2, 1.4],
                  opacity: [0.6, 0.3, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
              {/* Middle ring with different timing */}
              <motion.span 
                className="absolute top-0 left-0 w-full h-full rounded-full border border-[#25d695] pointer-events-none"
                animate={{
                  scale: [1, 1.15],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              {/* Inner pulsing ring */}
              <motion.span 
                className="absolute top-0 left-0 w-full h-full rounded-full border border-[#25d695] pointer-events-none"
                animate={{
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </>
          )}
          
          {/* Main button with glass effect, 3D shadows, and mouse tracking rotation */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-full h-full rounded-full border cursor-pointer flex items-center justify-center overflow-hidden"
            style={{
              transformStyle: 'preserve-3d',
              background: 'rgba(37, 214, 149, 0.15)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderColor: 'rgba(37, 214, 149, 0.3)',
              boxShadow: `
                0 6px 20px rgba(37,214,149,0.35),
                0 3px 10px rgba(0,0,0,0.4),
                inset 0 2px 6px rgba(255,255,255,0.3),
                inset 0 -6px 16px rgba(0,0,0,0.4)
              `,
              pointerEvents: 'auto'
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: rotation,
              background: [
                'rgba(37, 214, 149, 0.15)',
                'rgba(45, 232, 157, 0.18)',
                'rgba(37, 214, 149, 0.15)'
              ],
              borderColor: [
                'rgba(37, 214, 149, 0.3)',
                'rgba(45, 232, 157, 0.4)',
                'rgba(37, 214, 149, 0.3)'
              ],
              boxShadow: [
                '0 6px 20px rgba(37,214,149,0.35), 0 3px 10px rgba(0,0,0,0.4), inset 0 2px 6px rgba(255,255,255,0.3), inset 0 -6px 16px rgba(0,0,0,0.4)',
                '0 6px 24px rgba(37,214,149,0.45), 0 3px 10px rgba(0,0,0,0.4), inset 0 2px 6px rgba(255,255,255,0.35), inset 0 -6px 16px rgba(0,0,0,0.4)',
                '0 6px 20px rgba(37,214,149,0.35), 0 3px 10px rgba(0,0,0,0.4), inset 0 2px 6px rgba(255,255,255,0.3), inset 0 -6px 16px rgba(0,0,0,0.4)'
              ]
            }}
            transition={{
              opacity: { duration: 0.5, delay: 1 },
              scale: { duration: 0.5, delay: 1 },
              rotate: { 
                type: "spring", 
                stiffness: 100, 
                damping: 15 
              },
              background: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              },
              borderColor: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              },
              boxShadow: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            whileHover={{ 
              scale: 1.1, 
              y: -4,
              background: 'rgba(37, 214, 149, 0.25)',
              borderColor: 'rgba(37, 214, 149, 0.5)',
              boxShadow: '0 10px 30px rgba(37,214,149,0.5), 0 5px 15px rgba(0,0,0,0.4), inset 0 3px 8px rgba(255,255,255,0.4), inset 0 -8px 20px rgba(0,0,0,0.5)'
            }}
            whileTap={{ 
              scale: 0.95, 
              y: -2
            }}
            initial={{ opacity: 0, scale: 0 }}
          >
            {/* Green gradient overlay for depth */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(37, 214, 149, 0.4) 0%, transparent 70%)',
                mixBlendMode: 'overlay'
              }}
            />
            
            {/* Shield Nest Logo */}
            <Image
              src="/tokens/shld_dark.svg"
              alt="Shield Nest"
              width={48}
              height={48}
              className="relative z-10 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]"
            />
          </motion.button>
        </div>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-8 w-[400px] max-w-[calc(100vw-4rem)] h-[600px] max-h-[calc(100vh-10rem)] bg-[rgba(20,20,20,0.95)] border border-[rgba(37,214,149,0.3)] rounded-2xl backdrop-blur-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(37,214,149,0.1)] z-[9998] flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-br from-[rgba(37,214,149,0.15)] to-[rgba(23,155,105,0.1)] border-b border-[rgba(37,214,149,0.2)] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#25d695] to-[#179b69] rounded-full relative"
                  style={{
                    boxShadow: '0 4px 12px rgba(37,214,149,0.4), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -4px 12px rgba(0,0,0,0.4)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <Image
                    src="/tokens/shld_dark.svg"
                    alt="Shield Nest"
                    width={24}
                    height={24}
                    className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                  />
                </div>
                <div>
                  <h3 className="m-0 text-lg font-semibold bg-gradient-to-br from-[#25d695] to-[#7effc8] bg-clip-text text-transparent">
                    Shield Nest Assistant
                  </h3>
                  <p className="m-0 text-sm text-[rgba(255,255,255,0.6)]">Your DeFi Guide</p>
                </div>
              </div>
              <button
                className="bg-transparent border-none text-[rgba(255,255,255,0.6)] text-[32px] cursor-pointer w-8 h-8 flex items-center justify-center transition-all rounded-lg hover:bg-[rgba(255,255,255,0.1)] hover:text-[#25d695]"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 scrollbar-thin scrollbar-track-[rgba(255,255,255,0.05)] scrollbar-thumb-[rgba(37,214,149,0.3)] hover:scrollbar-thumb-[rgba(37,214,149,0.5)]">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  className={`max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={`${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#25d695] to-[#179b69] text-white rounded-[16px_16px_4px_16px] shadow-[0_2px_8px_rgba(37,214,149,0.3)]'
                        : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.9)] rounded-[16px_16px_16px_4px]'
                    } p-4 px-5 leading-relaxed`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="space-y-1">
                        {parseMarkdown(msg.content)}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.canExpand && (
                    <div className="mt-2 flex gap-2">
                      <button
                        className="bg-[rgba(37,214,149,0.1)] border border-[rgba(37,214,149,0.3)] text-[#25d695] py-2 px-3 rounded-lg text-sm cursor-pointer transition-all hover:bg-[rgba(37,214,149,0.2)] hover:border-[#25d695]"
                        onClick={() => sendMessage(messages[idx - 1].content, true)}
                      >
                        💡 Explain more
                      </button>
                    </div>
                  )}
                  {msg.suggestions && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          className="bg-[rgba(37,214,149,0.1)] border border-[rgba(37,214,149,0.3)] text-[#25d695] py-2 px-3 rounded-lg text-sm cursor-pointer transition-all hover:bg-[rgba(37,214,149,0.2)] hover:-translate-y-0.5"
                          onClick={() => sendMessage(sug)}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  className="self-start max-w-[85%]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[16px_16px_16px_4px] p-4 flex gap-2">
                    <span className="w-2 h-2 bg-[#25d695] rounded-full animate-[typingDot_1.4s_infinite]"></span>
                    <span className="w-2 h-2 bg-[#25d695] rounded-full animate-[typingDot_1.4s_0.2s_infinite]"></span>
                    <span className="w-2 h-2 bg-[#25d695] rounded-full animate-[typingDot_1.4s_0.4s_infinite]"></span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="p-0 px-5 pb-4 grid grid-cols-2 gap-2">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="bg-[rgba(37,214,149,0.1)] border border-[rgba(37,214,149,0.3)] text-[#25d695] py-3 px-3 rounded-lg text-sm cursor-pointer transition-all text-center hover:bg-[rgba(37,214,149,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(37,214,149,0.2)] flex items-center justify-center"
                    onClick={() => sendMessage(q)}
                  >
                    <span className="leading-tight">{q}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 px-5 border-t border-[rgba(37,214,149,0.2)] bg-[rgba(10,10,10,0.5)] flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Shield Nest Assistant..."
                disabled={isLoading}
                className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 px-4 text-white text-[0.95rem] outline-none transition-all focus:border-[#25d695] focus:bg-[rgba(255,255,255,0.08)] focus:shadow-[0_0_0_3px_rgba(37,214,149,0.1)] disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[rgba(255,255,255,0.4)]"
              />
              <button
                className="bg-gradient-to-br from-[#25d695] to-[#179b69] border-none rounded-xl w-11 h-11 flex items-center justify-center cursor-pointer text-white transition-all shadow-[0_2px_8px_rgba(37,214,149,0.3)] hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(37,214,149,0.4)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="rotate-45">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes typingDot {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
        
        @media (max-width: 768px) {
          .wise-owl-chat {
            bottom: 5rem !important;
            right: 1rem !important;
            left: 1rem !important;
            width: auto !important;
            max-width: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default WiseOwlChat;


