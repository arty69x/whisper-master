/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from "react";
import { ChatInterface } from "./components/ChatInterface";
import { Loader2, Key, ExternalLink, ArrowRight } from "lucide-react";

export default function App() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [customKey, setCustomKey] = useState("");
  const [isUsingCustomKey, setIsUsingCustomKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      // Check if user previously saved a custom key
      const savedKey = localStorage.getItem('custom_gemini_api_key');
      if (savedKey) {
        process.env.API_KEY = savedKey;
        setHasKey(true);
        setIsUsingCustomKey(true);
        return;
      }

      // @ts-ignore
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // If not in AI studio environment, just proceed
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && window.aistudio.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Assume success to mitigate race condition
      setHasKey(true);
    }
  };

  const handleCustomKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customKey.trim()) {
      localStorage.setItem('custom_gemini_api_key', customKey.trim());
      process.env.API_KEY = customKey.trim();
      setHasKey(true);
      setIsUsingCustomKey(true);
    }
  };

  if (hasKey === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FB]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FB] p-4">
        <div className="p-8 bg-white rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Key size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">API Key Required</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            To use the advanced Gemini 3.1 Pro model for pixel-perfect Tailwind generation, you need to provide a Google Cloud API key.
          </p>
          
          <form onSubmit={handleCustomKeySubmit} className="mb-6">
            <div className="relative flex items-center">
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Paste your Gemini API Key here..."
                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={!customKey.trim()}
                className="absolute right-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-gray-400 font-medium uppercase tracking-wider">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSelectKey}
              className="w-full py-3.5 px-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all active:scale-95 shadow-md"
            >
              Select Key via AI Studio
            </button>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer" 
              className="w-full py-3.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Get a New API Key
              <ExternalLink size={16} className="text-gray-400" />
            </a>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs text-blue-500 hover:underline mt-2"
            >
              Learn about billing requirements
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <ChatInterface />;
}