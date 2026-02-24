"use client";

import { motion } from "framer-motion";
import {
  Search,
  Bot,
  User,
  Phone,
  Video,
  Paperclip,
  Send,
} from "lucide-react";

const contacts = [
  {
    id: "ai",
    name: "SkinFit AI Assistant",
    snippet: "Hi! How can I help with your skincare today?",
    time: "10:42 AM",
    isActive: true,
    icon: Bot,
  },
  {
    id: "doctor",
    name: "Dr. Ruby Sachdev",
    snippet: "Your next follow-up is scheduled for...",
    time: "9:15 AM",
    isActive: false,
    icon: User,
  },
  {
    id: "support",
    name: "Clinic Support",
    snippet: "We're here to assist with your booking.",
    time: "Yesterday",
    isActive: false,
    icon: User,
  },
];

const messages = [
  {
    id: 1,
    sender: "ai",
    text: "Hi! I'm your SkinFit AI assistant. How can I help with your skincare routine today?",
  },
  {
    id: 2,
    sender: "patient",
    text: "I've been using the new retinol serum for a week. What should I expect?",
  },
  {
    id: 3,
    sender: "ai",
    text: "Great question! In the first 1–2 weeks, mild dryness or purging is common. Make sure you're using SPF daily and hydrating well. Let me know if you notice any irritation.",
  },
  {
    id: 4,
    sender: "patient",
    text: "Thanks, that helps!",
  },
];

export default function ChatPage() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-[calc(100vh-100px)] gap-6"
    >
      {/* Left Sidebar - Contact List */}
      <div className="flex w-1/3 min-w-0 flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50">
        {/* Search */}
        <div className="border-b border-zinc-800 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-zinc-500" />
            <input
              type="text"
              placeholder="Search messages or doctors..."
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => {
            const Icon = contact.icon;
            return (
              <div
                key={contact.id}
                className={`flex cursor-pointer items-center gap-3 border-b border-zinc-800 px-4 py-4 transition-colors hover:bg-zinc-800/50 ${
                  contact.isActive ? "bg-teal-400/10" : ""
                }`}
              >
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-800">
                  <Icon className="h-5 w-5 text-teal-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {contact.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {contact.snippet}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-500">
                  {contact.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Main - Chat Window */}
      <div className="relative flex w-2/3 min-w-0 flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                <Bot className="h-5 w-5 text-teal-400" />
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-emerald-500" />
            </div>
            <div>
              <p className="font-semibold text-white">SkinFit AI Assistant</p>
              <p className="text-xs text-emerald-400">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-teal-400"
              title="Voice call"
            >
              <Phone className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-teal-400"
              title="Video call"
            >
              <Video className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "patient" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 ${
                    msg.sender === "patient"
                      ? "bg-teal-600 text-white rounded-l-2xl rounded-tr-2xl"
                      : "bg-zinc-800 text-zinc-300 rounded-r-2xl rounded-tl-2xl"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/50 px-4 py-2">
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-teal-400"
              title="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              className="max-h-24 flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white transition-colors hover:bg-teal-500"
              title="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
