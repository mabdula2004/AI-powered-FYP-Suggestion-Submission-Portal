import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Bot,
  Loader2,
  Sparkles,
  Paperclip,
  Plus,
  MessageSquare,
  Trash2,
  ChevronRight,
  FileText,
  X,
  History
} from 'lucide-react'
import { chatbotService } from '../../services/chatbotService'
import { chatPersistenceService } from '../../services/chatPersistenceService'
import { aiService } from '../../services/aiService'
import { useAuthStore } from '../../stores/authStore'
import { useGroupStore } from '../../stores/groupStore'
import useFeatureFlag from '../../hooks/useFeatureFlag'
import { toast } from 'react-hot-toast'

const SUGGESTED_QUESTIONS = [
  'Which project suits me?',
  'Show available projects',
  'What should I learn?',
  'How difficult are AI projects?',
]

export default function ChatbotTab() {
  const { user } = useAuthStore()
  const { group } = useGroupStore()
  const { chatbotEnabled } = useFeatureFlag()

  // Chat State
  const [chats, setChats] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // File State
  const [attachedFile, setAttachedFile] = useState(null)
  const [isExtracting, setIsExtracting] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  // Load chats on mount
  useEffect(() => {
    if (user?.uid) {
      loadChats()
    }
  }, [user?.uid])

  // Load messages when currentChatId changes
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId)
    } else {
      setMessages([])
    }
  }, [currentChatId])

  const loadChats = async () => {
    try {
      const userChats = await chatPersistenceService.getUserChats(user.uid)
      setChats(userChats)
    } catch (err) {
      console.error('Failed to load chats:', err)
    }
  }

  const loadMessages = async (chatId) => {
    try {
      const msgs = await chatPersistenceService.getChatMessages(chatId)
      setMessages(msgs)
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  const handleNewChat = async () => {
    try {
      const newChat = await chatPersistenceService.createChat(user.uid)
      setChats([newChat, ...chats])
      setCurrentChatId(newChat.id)
      setMessages([])
    } catch (err) {
      toast.error('Failed to create new chat')
    }
  }

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this chat?')) return
    try {
      await chatPersistenceService.deleteChat(chatId)
      setChats(chats.filter(c => c.id !== chatId))
      if (currentChatId === chatId) {
        setCurrentChatId(null)
        setMessages([])
      }
      toast.success('Chat deleted')
    } catch (err) {
      toast.error('Failed to delete chat')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || isTyping) return

    let chatId = currentChatId
    let isInitialMessage = false

    if (!chatId) {
      const newChat = await chatPersistenceService.createChat(user.uid, input.trim().slice(0, 30) || 'New Chat')
      chatId = newChat.id
      setCurrentChatId(chatId)
      setChats([newChat, ...chats])
      isInitialMessage = true
    }

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      fileInfo: attachedFile ? { name: attachedFile.name, type: attachedFile.type } : null
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setAttachedFile(null)
    setIsTyping(true)

    try {
      // Add user message to persistence
      await chatPersistenceService.addMessage(chatId, userMessage)

      let messageWithFileContext = userMessage.content
      if (attachedFile && attachedFile.extractedData) {
        messageWithFileContext += `\n\n[Context from uploaded file "${attachedFile.name}":\n${JSON.stringify(attachedFile.extractedData, null, 2)}]`
      }

      const response = await chatbotService.sendMessage(
        messageWithFileContext,
        [...messages, userMessage],
        user.uid,
        group?.id,
        chatId
      )

      const botMessage = {
        role: 'bot',
        content: response,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, botMessage])

      // Update chat title if it's the first message
      if (isInitialMessage) {
        const firstLine = userMessage.content.split('\n')[0].slice(0, 30)
        await chatPersistenceService.updateChatTitle(chatId, firstLine || 'New Chat')
        loadChats()
      }

    } catch (err) {
      const errorMessage = {
        role: 'bot',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit')
      return
    }

    setAttachedFile({ name: file.name, type: file.type, status: 'uploading' })
    setIsExtracting(true)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target.result.split(',')[1]
        try {
          const data = await aiService.extractProjectFromPdf(base64)
          setAttachedFile({
            name: file.name,
            type: file.type,
            status: 'ready',
            extractedData: data
          })
          toast.success('File analyzed successfully!')
        } catch (err) {
          console.error('Extraction error:', err)
          setAttachedFile({ name: file.name, type: file.type, status: 'error', extractedData: { error: 'Could not extract' } })
          toast.error('Could not analyze file content, but I can still see the file name.')
        } finally {
          setIsExtracting(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setIsExtracting(false)
      toast.error('Failed to read file')
    }
  }

  if (!chatbotEnabled) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <Bot className="w-16 h-16 text-text-muted mb-4" />
        <h3 className="text-[16px] font-bold text-navy mb-1">Feature Disabled</h3>
        <p className="text-[14px] text-text-muted">This feature is currently disabled.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full bg-white rounded-3xl border border-border overflow-hidden shadow-2xl relative">

      {/* 1. Left Sidebar: Chat History */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-border bg-bg-secondary flex flex-col shrink-0"
          >
            <div className="p-4">
              <button
                onClick={handleNewChat}
                className="w-full py-3 px-4 bg-white border border-border rounded-xl text-[14px] font-bold text-navy hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              <div className="px-3 py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <History className="w-3 h-3" />
                Recent Chats
              </div>
              {chats.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-[12px] text-text-muted">No chats yet</p>
                </div>
              ) : (
                chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setCurrentChatId(chat.id)}
                    className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${currentChatId === chat.id
                      ? 'bg-accent text-white shadow-md'
                      : 'hover:bg-white text-text-secondary hover:text-navy'
                      }`}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="text-[13px] font-semibold truncate flex-1">{chat.title}</span>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-black/10 transition-opacity ${currentChatId === chat.id ? 'text-white' : 'text-text-muted'
                        }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white min-w-0">

        {/* Header */}
        <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-white/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <History className={`w-5 h-5 ${isSidebarOpen ? 'text-accent' : 'text-text-muted'}`} />
            </button>
            <div>
              <h3 className="font-bold text-navy text-[15px] flex items-center gap-2">
                {currentChatId ? chats.find(c => c.id === currentChatId)?.title : 'Gemini FYP Assistant'}
                <span className="px-1.5 py-0.5 bg-accent-light/50 text-accent text-[10px] rounded uppercase">AI</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[11px] text-text-muted font-medium">Always ready to help</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide relative">
          {!currentChatId && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-10 mb-8 text-center px-4">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-accent to-accent-dark rounded-3xl flex items-center justify-center shadow-2xl shadow-accent/20 rotate-6 transform transition-transform hover:rotate-0 duration-500">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-3 -right-3 w-10 h-10 bg-white border border-border rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Sparkles className="w-5 h-5 text-warning" />
                </motion.div>
              </div>

              <h2 className="text-[28px] font-extrabold text-navy mb-3 tracking-tight">
                How can I <span className="text-accent">help you</span> today?
              </h2>
              <p className="text-[15px] text-text-muted mb-10 max-w-md leading-relaxed font-medium">
                I can help you find project ideas, analyze your proposals, or answer anything about your Final Year Project.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <motion.button
                    key={q}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => {
                      setInput(q)
                      inputRef.current?.focus()
                    }}
                    className="p-4 bg-surface border border-border hover:border-accent hover:bg-accent-light/10 text-left rounded-2xl transition-all duration-200 group"
                  >
                    <p className="text-[13px] font-bold text-navy group-hover:text-accent">{q}</p>
                    <ChevronRight className="w-4 h-4 text-text-muted mt-2 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user'
                  ? 'bg-bg-tertiary text-navy'
                  : 'bg-gradient-to-br from-accent to-accent-dark text-white'
                  }`}>
                  {msg.role === 'user' ? (
                    <div className="font-bold text-[14px]">{user?.name?.[0] || 'U'}</div>
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>

                <div className={`max-w-[80%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                  {msg.fileInfo && (
                    <div className="flex items-center gap-2 p-2 bg-bg-secondary border border-border rounded-xl text-[12px] font-bold text-navy">
                      <FileText className="w-4 h-4 text-accent" />
                      {msg.fileInfo.name}
                    </div>
                  )}
                  <div
                    className={`px-6 py-4 text-[14px] leading-relaxed shadow-sm relative ${msg.role === 'user'
                      ? 'bg-navy text-white rounded-3xl rounded-tr-sm'
                      : 'bg-surface text-navy border border-border rounded-3xl rounded-tl-sm'
                      }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                    {msg.timestamp ? (msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-surface border border-border rounded-3xl rounded-tl-sm px-6 py-5 shadow-sm flex items-center">
                <div className="flex gap-1.5">
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-2 bg-accent rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-accent rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-accent rounded-full" />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} className="h-20" />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-white via-white to-transparent pt-10">
          <div className="relative max-w-4xl mx-auto">
            {attachedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-14 left-0 flex items-center gap-2 p-2 bg-white border border-border rounded-xl shadow-lg z-10"
              >
                <div className="w-8 h-8 bg-accent-light/50 rounded-lg flex items-center justify-center">
                  {isExtracting ? <Loader2 className="w-4 h-4 text-accent animate-spin" /> : <FileText className="w-4 h-4 text-accent" />}
                </div>
                <div className="pr-2">
                  <p className="text-[11px] font-bold text-navy truncate max-w-[150px]">{attachedFile.name}</p>
                  <p className="text-[9px] text-text-muted uppercase font-bold">{isExtracting ? 'Analyzing...' : 'Ready to discuss'}</p>
                </div>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="p-1 hover:bg-bg-secondary rounded-md text-text-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            <div className="bg-bg-secondary border-2 border-border focus-within:border-accent rounded-[32px] p-2 transition-all duration-300 shadow-lg flex items-end gap-2 pr-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 flex items-center justify-center text-text-muted hover:text-accent hover:bg-white rounded-full transition-all"
              >
                <Paperclip className="w-6 h-6" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Message Gemini FYP Assistant..."
                disabled={isTyping}
                rows={1}
                className="flex-1 max-h-[150px] min-h-[48px] py-4 px-2 bg-transparent text-[15px] text-navy placeholder-text-muted resize-none focus:outline-none disabled:opacity-60 scrollbar-hide"
                onInput={(e) => {
                  e.target.style.height = '48px';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                }}
              />

              <motion.button
                onClick={handleSend}
                disabled={(!input.trim() && !attachedFile) || isTyping}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 bg-gradient-to-br from-accent to-accent-dark text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/30 disabled:opacity-50 disabled:grayscale transition-all hover:scale-105"
              >
                {isTyping ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </motion.button>
            </div>
            <p className="text-[10px] text-center text-text-muted font-bold mt-3 uppercase tracking-widest opacity-50">
              Gemini may produce inaccurate info about projects. Verify important details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
