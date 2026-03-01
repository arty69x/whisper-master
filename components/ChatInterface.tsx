
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from "react";
import { sendMessageStream } from "../services/gemini";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInput } from "./ChatInput";
import { ImageEditor } from "./ImageEditor";
import { checkAccessibility } from "../utils/accessibility";
import { Sparkles, Lightbulb, ArrowLeft, Download, Trash2, Loader2, ImageOff, Search, Square, AlertCircle, Image as ImageIcon, Menu, X as CloseIcon, FileText, Layout, Code, Palette, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Part, Content } from "@google/genai";
import { ChatMessage, ExamplePrompt } from "../types";
import { ConfirmationModal } from "./ConfirmationModal";

const DEFAULT_EXAMPLES: ExamplePrompt[] = [
  {
    title: "SaaS Dashboard",
    prompt: "Generate a modern SaaS dashboard with a sidebar, analytics cards, and a data table. Use a clean, professional color palette.",
    image: "https://picsum.photos/seed/saas/800/600"
  },
  {
    title: "E-commerce Product",
    prompt: "Create a pixel-perfect product detail page with an image gallery, price details, and a 'Buy Now' button. Focus on high conversion design.",
    image: "https://picsum.photos/seed/shop/800/600"
  },
  {
    title: "Creative Portfolio",
    prompt: "Design a minimalist portfolio for a photographer. Include a masonry grid for images and a clean navigation menu.",
    image: "https://picsum.photos/seed/portfolio/800/600"
  },
  {
    title: "Travel App UI",
    prompt: "Build a travel booking app interface with destination cards, search filters, and a beautiful hero section.",
    image: "https://picsum.photos/seed/travel/800/600"
  },
  {
    title: "Fintech Dashboard",
    prompt: "Create a dark-themed fintech dashboard showing balance charts, recent transactions, and card management.",
    image: "https://picsum.photos/seed/fintech/800/600"
  }
];

interface ExampleCardProps {
  example: ExamplePrompt;
  onClick: () => void;
}

const ExampleCard: React.FC<ExampleCardProps> = ({ example, onClick }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const fetchImage = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(example.image);
        if (!response.ok) throw new Error("Failed to load image");
        
        const blob = await response.blob();
        
        // Fix for mime type if application/octet-stream
        let mimeType = blob.type;
        if (!mimeType || mimeType === 'application/octet-stream') {
          const ext = example.image.split('.').pop()?.toLowerCase();
          if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
          else if (ext === 'png') mimeType = 'image/png';
          else if (ext === 'webp') mimeType = 'image/webp';
          else if (ext === 'heic') mimeType = 'image/heic';
          else mimeType = 'image/jpeg';
        }

        // Create blob with correct type
        const finalBlob = blob.slice(0, blob.size, mimeType);
        objectUrl = URL.createObjectURL(finalBlob);
        
        if (isMounted) {
          setImageSrc(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error("Thumbnail load error:", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [example.image]);

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-start p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-left group w-full"
    >
      <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-gray-100 relative flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <Loader2 className="animate-spin" size={24} />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <ImageOff size={24} className="mb-1" />
            <span className="text-[10px]">Failed to load</span>
          </div>
        )}
        {imageSrc && !error && (
          <img
            src={imageSrc}
            alt={example.title}
            className={`w-full h-full object-cover relative durable-image z-10 group-hover:scale-105 transition-transform duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setLoading(false)}
            onError={() => { setError(true); setLoading(false); }}
          />
        )}
      </div>
      <div className="flex items-center gap-2 text-blue-600 font-medium mb-1 w-full">
        <Lightbulb size={16} className="flex-shrink-0" />
        <span className="text-sm font-semibold truncate w-full">{example.title}</span>
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 w-full">{example.prompt}</p>
    </motion.button>
  );
};

// Helper function to escape HTML special characters
function escapeHtml(unsafe: string) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Function to generate standalone HTML from messages
const generateHtmlFromMessages = (messages: ChatMessage[]) => {
  // Define icons inline for the export
  const icons = {
    user: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    model: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>`,
    brain: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.97-1.375"/><path d="M17.97 16.625A4 4 0 0 1 16 18"/></svg>`,
    code: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>`,
    terminal: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`,
    chevron: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>`
  };

  const createCollapsible = (title: string, icon: string, content: string, headerClass: string, contentClass: string, status?: string) => {
    const isOk = status === "OUTCOME_OK";
    const badgeHtml = status ? `
        <span class="ml-auto text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${isOk ? "bg-emerald-500/20 text-emerald-600" : "bg-red-500/20 text-red-600"}">
            ${isOk ? "Success" : "Error"}
        </span>` : '';

    return `
      <div class="my-2 rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white group">
        <button onclick="toggleCollapse(this)" class="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${headerClass}">
          <div class="arrow-icon transition-transform duration-200" style="opacity: 0.5">${icons.chevron}</div>
          ${icon}
          <span class="flex-1">${title}</span>
          ${badgeHtml}
        </button>
        <div class="collapsible-content ${contentClass}">
          ${content}
        </div>
      </div>
    `;
  };

  const messagesHtml = messages.map(msg => {
    const isUser = msg.role === 'user';
    const roleColor = isUser ? 'bg-blue-600' : 'bg-emerald-600';
    const align = isUser ? 'flex-row-reverse' : 'flex-row';
    const bubbleStyle = isUser ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 rounded-tl-sm text-gray-800';
    
    const partsHtml = msg.parts.map(part => {
      // @ts-ignore
      if (part.thought) {
        // @ts-ignore
        const thoughtText = typeof part.thought === 'string' ? part.thought : part.text;
        if (!thoughtText) return '';
        const content = `
           <div class="markdown-wrapper">
             <div class="markdown-source hidden">${escapeHtml(thoughtText)}</div>
             <div class="markdown-rendered prose prose-sm max-w-none prose-purple"></div>
           </div>
        `;
        return createCollapsible("Thought Process", icons.brain, content, "bg-purple-50 text-purple-700 hover:bg-purple-100", "p-3 bg-purple-50/50 text-purple-800");
      }
      
      if (part.executableCode) {
        const content = `
            <div class="p-3 bg-[#1e1e1e] overflow-x-auto">
              <pre class="text-xs text-white font-mono m-0"><code>${escapeHtml(part.executableCode.code)}</code></pre>
            </div>
        `;
        return createCollapsible(`Executable Code (${part.executableCode.language})`, icons.code, content, "bg-blue-50 text-blue-700 hover:bg-blue-100", "p-0 bg-[#1e1e1e]");
      }

      if (part.codeExecutionResult) {
        const isSuccess = part.codeExecutionResult.outcome === "OUTCOME_OK";
        const headerClass = isSuccess ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-700 hover:bg-red-100";
        const content = `<div class="whitespace-pre-wrap">${escapeHtml(part.codeExecutionResult.output)}</div>`;
        return createCollapsible("Execution Result", icons.terminal, content, headerClass, "p-3 bg-gray-50 text-gray-800 font-mono text-xs overflow-x-auto", part.codeExecutionResult.outcome);
      }

      if (part.inlineData) {
        return `<div class="my-2"><img src="data:${part.inlineData.mimeType};base64,${part.inlineData.data}" class="max-w-full rounded-lg border border-gray-200" /></div>`;
      }

      if (part.text) {
        return `
          <div class="markdown-wrapper">
             <div class="markdown-source hidden">${escapeHtml(part.text)}</div>
             <div class="markdown-rendered prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}"></div>
          </div>
        `;
      }
      return '';
    }).join('');

    return `
      <div class="flex gap-4 ${align} mb-6">
        <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ${roleColor}">
          ${isUser ? icons.user : icons.model}
        </div>
        <div class="max-w-[85%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}">
          <div class="px-4 py-3 rounded-2xl shadow-sm overflow-hidden ${bubbleStyle}">
            ${partsHtml}
          </div>
          <div class="text-xs text-gray-400 px-1">
            ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemini Chat Export</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; }
      
      .collapsible-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
      }
      .collapsible-content.open {
          /* max-height handled by JS */
      }
      
      /* Custom scrollbar for styling parity */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    </style>
</head>
<body class="bg-gray-50 min-h-screen p-4 md:p-8">
    <div class="max-w-3xl mx-auto bg-white min-h-[80vh] rounded-3xl shadow-xl p-6 md:p-10">
        <div class="flex items-center gap-3 mb-10 pb-6 border-b border-gray-100">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                ${icons.sparkles}
            </div>
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Gemini Chat Export</h1>
                <p class="text-sm text-gray-500">${new Date().toLocaleString()}</p>
            </div>
        </div>
        
        <div class="space-y-6">
            ${messagesHtml}
        </div>
    </div>
    <script>
      marked.use({
        breaks: true,
        gfm: true
      });
      
      function toggleCollapse(btn) {
          const content = btn.nextElementSibling;
          const arrow = btn.querySelector('.arrow-icon');
          
          if (content.style.maxHeight) {
              content.style.maxHeight = null;
              content.classList.remove('open');
              arrow.style.transform = 'rotate(0deg)';
          } else {
              content.classList.add('open');
              content.style.maxHeight = content.scrollHeight + "px";
              arrow.style.transform = 'rotate(90deg)';
          }
      }
      
      document.addEventListener('DOMContentLoaded', () => {
        const wrappers = document.querySelectorAll('.markdown-wrapper');
        wrappers.forEach(wrapper => {
          const source = wrapper.querySelector('.markdown-source');
          const target = wrapper.querySelector('.markdown-rendered');
          if (source && target) {
            target.innerHTML = marked.parse(source.innerText);
          }
        });
      });
    </script>
</body>
</html>`;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('gemini_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [examples, setExamples] = useState<ExamplePrompt[]>(DEFAULT_EXAMPLES);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [tempKey, setTempKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-3.1-pro-preview");
  const [selectedMode, setSelectedMode] = useState<'nextjs' | 'html' | 'json' | 'txt'>('html');
  const [selectedImages, setSelectedImages] = useState<{ original: string, thumb: string }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<{ name: string, content: string, size: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [savedComponents, setSavedComponents] = useState<{ id: string, code: string, language: string, timestamp: number }[]>(() => {
    try {
      const saved = localStorage.getItem('gemini_saved_components');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const MAX_TEXT_FILE_SIZE = 1 * 1024 * 1024; // 1MB
  const MAX_TEXT_FILE_CHARS = 100000;

  const generateThumbnail = (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error("Failed to load image for thumbnail generation"));
      img.src = dataUrl;
    });
  };

  const handleProcessFiles = async (files: FileList | File[]) => {
    if (files && files.length > 0) {
      setUploading(true);
      setUploadProgress(0);
      const totalFiles = files.length;
      
      try {
        for (let i = 0; i < totalFiles; i++) {
          const file = files[i];
          
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onloadstart = () => {
                setUploadProgress(Math.round((i / totalFiles) * 100));
              };
              reader.onprogress = (event) => {
                if (event.lengthComputable) {
                  const fileProgress = event.loaded / event.total;
                  const overallProgress = Math.round(((i + fileProgress) / totalFiles) * 100);
                  setUploadProgress(overallProgress);
                }
              };
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            // Instead of adding directly, open editor
            setEditingImage(dataUrl);
            // We stop processing other files for now to focus on editing
            break;
          } else {
            if (file.size > MAX_TEXT_FILE_SIZE) {
              alert(`File ${file.name} is too large. Max size is 1MB.`);
              continue;
            }
            const reader = new FileReader();
            const content = await new Promise<string>((resolve, reject) => {
              reader.onloadstart = () => {
                setUploadProgress(Math.round((i / totalFiles) * 100));
              };
              reader.onprogress = (event) => {
                if (event.lengthComputable) {
                  const fileProgress = event.loaded / event.total;
                  const overallProgress = Math.round(((i + fileProgress) / totalFiles) * 100);
                  setUploadProgress(overallProgress);
                }
              };
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsText(file);
            });
            
            if (content.length > MAX_TEXT_FILE_CHARS) {
              alert(`File ${file.name} has too many characters. Max is ${MAX_TEXT_FILE_CHARS}.`);
              continue;
            }
            setSelectedFiles(prev => [...prev, { name: file.name, content, size: file.size }]);
          }
          setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
        }
      } catch (error) {
        console.error("Error processing files:", error);
        alert("An error occurred while processing the files. Please try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('gemini_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (messages.length > 0) {
          handleBack();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [messages.length]);

  useEffect(() => {
    fetch("/examples/prompts.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch examples");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setExamples(data);
        }
      })
      .catch((err) => console.log("Using default examples due to load error:", err));
  }, []);

  const handleExampleClick = async (example: ExamplePrompt) => {
    try {
      const response = await fetch(example.image);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Fix for mime type if application/octet-stream
      let mimeType = blob.type;
      if (!mimeType || mimeType === 'application/octet-stream') {
        const ext = example.image.split('.').pop()?.toLowerCase();
        if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'heic') mimeType = 'image/heic';
        else mimeType = 'image/jpeg';
      }

      // Create a new blob with the correct type
      const finalBlob = blob.slice(0, blob.size, mimeType);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        handleSendMessage(example.prompt, [base64data]);
      };
      reader.readAsDataURL(finalBlob);
    } catch (error) {
      console.error("Error loading example image:", error);
      // Fallback: Send message without image
      handleSendMessage(example.prompt);
    }
  };

  const handleExport = () => {
    if (messages.length === 0) return;
    
    const htmlContent = generateHtmlFromMessages(messages);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-chat-export-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (text: string, images?: string[], files?: { name: string, content: string }[]) => {
    setIsLoading(true);
    setIsSidebarOpen(false); // Close sidebar on send
    
    // Auto-generate placeholder image if none provided and it's a design request
    let finalImages = images || [];
    const isDesignRequest = /generate|create|design|build|ui|mockup|component|page|dashboard|tailwind|css|html|react/i.test(text) || (finalImages.length > 0);
    
    if (finalImages.length === 0 && isDesignRequest && text.trim().length > 5) {
      try {
        const keywords = text.toLowerCase().split(' ').filter(w => w.length > 4).slice(0, 3).join(',');
        const seed = Math.floor(Math.random() * 1000);
        const placeholderUrl = `https://picsum.photos/seed/${seed}/${800}/${600}`;
        
        const response = await fetch(placeholderUrl);
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          finalImages = [base64];
        }
      } catch (e) {
        console.warn("Failed to generate placeholder image:", e);
      }
    }

    // Construct user message parts
    const userParts: Part[] = [];
    if (text) {
      userParts.push({ text });
    }
    if (files && files.length > 0) {
      files.forEach(file => {
        userParts.push({ text: `File: ${file.name}\nContent:\n${file.content}` });
      });
    }
    if (finalImages && finalImages.length > 0) {
      finalImages.forEach(image => {
        const match = image.match(/^data:(.+);base64,(.+)$/);
        if (match) {
          userParts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      });
    }
    if (userParts.length === 0) {
      userParts.push({ text: " " });
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      parts: userParts,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Prepare history for the API
      const history: Content[] = messages.map((msg) => {
        const cleanParts = msg.parts.map(p => {
             // Create a clean part object for the API
             const part: Part = {};
             if (p.text !== undefined && p.text !== "") part.text = p.text;
             if (p.inlineData) part.inlineData = p.inlineData;
             if (p.functionCall) part.functionCall = p.functionCall;
             if (p.functionResponse) part.functionResponse = p.functionResponse;
             // @ts-ignore
             if (p.executableCode) part.executableCode = p.executableCode;
             // @ts-ignore
             if (p.codeExecutionResult) part.codeExecutionResult = p.codeExecutionResult;
             return part;
        }).filter(p => Object.keys(p).length > 0);
        
        return {
          role: msg.role,
          parts: cleanParts.length > 0 ? cleanParts : [{ text: " " }]
        };
      });

      abortControllerRef.current = new AbortController();
      const streamResult = await sendMessageStream(text, history, finalImages, selectedMode, files, selectedModel);

      // Create a placeholder for the model response
      const modelMessageId = (Date.now() + 1).toString();
      const modelMessage: ChatMessage = {
        id: modelMessageId,
        role: "model",
        parts: [],
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelMessage]);

      const iterator = streamResult[Symbol.asyncIterator]();
      
      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        const { value: chunk, done } = await iterator.next();
        if (done) {
          // Run accessibility check on the final message
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg.id === modelMessageId) {
              const fullText = lastMsg.parts.map(p => p.text || '').join('');
              if (fullText.includes('className=') || fullText.includes('class=')) {
                const report = checkAccessibility(fullText);
                return [...prev.slice(0, -1), { ...lastMsg, accessibilityReport: report }];
              }
            }
            return prev;
          });
          break;
        }

        const newParts = chunk.candidates?.[0]?.content?.parts || [];
        
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.id !== modelMessageId) return prev;

          const currentParts = [...lastMsg.parts];

          for (const newPart of newParts) {
            const lastPartIndex = currentParts.length - 1;
            const lastPart = currentParts[lastPartIndex];

            // Helper to check if parts are mergeable
            const isMergeableText = (p1: Part, p2: Part) => {
                // @ts-ignore
                const p1Thought = !!p1.thought;
                // @ts-ignore
                const p2Thought = !!p2.thought;

                return p1.text !== undefined && p2.text !== undefined &&
                       !p1.executableCode && !p2.executableCode &&
                       !p1.codeExecutionResult && !p2.codeExecutionResult &&
                       !p1.inlineData && !p2.inlineData &&
                       p1Thought === p2Thought;
            };

            if (newPart.text) {
              if (lastPart && isMergeableText(lastPart, newPart)) {
                currentParts[lastPartIndex] = {
                  ...lastPart,
                  text: (lastPart.text || "") + newPart.text
                };
              } else {
                // @ts-ignore
                currentParts.push({ text: newPart.text, thought: newPart.thought });
              }
            }
            else if (newPart.executableCode) {
               if (lastPart && lastPart.executableCode && lastPart.executableCode.language === newPart.executableCode.language) {
                 currentParts[lastPartIndex] = {
                   ...lastPart,
                   executableCode: {
                     ...lastPart.executableCode,
                     code: (lastPart.executableCode.code || "") + newPart.executableCode.code
                   }
                 };
               } else {
                 currentParts.push({ executableCode: { ...newPart.executableCode } });
               }
            }
            else if (newPart.codeExecutionResult) {
               currentParts.push({ codeExecutionResult: { ...newPart.codeExecutionResult } });
            }
            else if (newPart.inlineData) {
               currentParts.push({ inlineData: { ...newPart.inlineData } });
            }
            // @ts-ignore
            else if (newPart.thought) {
               // @ts-ignore
               currentParts.push({ thought: newPart.thought, text: newPart.text || "" });
            }
          }

          return [...prev.slice(0, -1), { ...lastMsg, parts: currentParts }];
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
        return;
      }
      console.error("Error sending message:", error);
      
      let friendlyMessage = "I encountered an error. Please try again.";
      let actionText = "Try rephrasing your request or checking your connection.";
      const errorMsg = error.message || "";
      
      let errorType: 'key' | 'quota' | 'other' = 'other';
      if (errorMsg.includes("QUOTA") || errorMsg.includes("quota")) {
        friendlyMessage = "You've reached your Gemini API quota limit.";
        actionText = "Please wait a few minutes or check your billing settings in Google Cloud.";
        errorType = 'quota';
      } else if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("key")) {
        friendlyMessage = "Your API key seems invalid.";
        actionText = "Please click the key icon or refresh to re-enter your Gemini API key.";
        errorType = 'key';
      } else if (errorMsg.includes("SAFETY") || errorMsg.includes("blocked")) {
        friendlyMessage = "Your request was blocked by safety filters.";
        actionText = "Try rephrasing your prompt to be more neutral or removing sensitive content.";
      } else if (errorMsg.includes("network") || errorMsg.includes("fetch")) {
        friendlyMessage = "Network error.";
        actionText = "Please check your internet connection and try again.";
      }

      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: "model",
        parts: [{ 
          text: `### ⚠️ ${friendlyMessage}\n\n${actionText}\n\n---\n*Technical Details: ${errorMsg}*` 
        }],
        timestamp: Date.now(),
        isError: true,
        errorType,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleBack = () => {
    setMessages([]);
    setIsLoading(false);
  };

  const [activeTab, setActiveTab] = useState<'templates' | 'history'>('templates');

  const handleSaveComponent = (code: string, language: string) => {
    const newComponent = {
      id: Date.now().toString(),
      code,
      language,
      timestamp: Date.now()
    };
    const updated = [newComponent, ...savedComponents];
    setSavedComponents(updated);
    localStorage.setItem('gemini_saved_components', JSON.stringify(updated));
  };

  const handleDeleteSavedComponent = (id: string) => {
    const updated = savedComponents.filter(c => c.id !== id);
    setSavedComponents(updated);
    localStorage.setItem('gemini_saved_components', JSON.stringify(updated));
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem('gemini_chat_history');
    setIsLoading(false);
    setIsClearModalOpen(false);
  };

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('custom_gemini_api_key', tempKey.trim());
      setIsKeyModalOpen(false);
      setTempKey("");
      alert("API Key updated successfully!");
    }
  };

  const filteredExamples = examples.filter(ex => 
    ex.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ex.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visionExamples = filteredExamples.filter(ex => 
    ex.title.toLowerCase().includes("tailwind") || 
    ex.prompt.toLowerCase().includes("tailwind")
  );
  
  const otherExamples = filteredExamples.filter(ex => 
    !ex.title.toLowerCase().includes("tailwind") && 
    !ex.prompt.toLowerCase().includes("tailwind")
  );

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FB] text-gray-900 font-sans selection:bg-blue-100 overflow-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[85%] md:w-80 bg-white z-50 shadow-2xl flex flex-col border-r border-gray-200"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                      <Sparkles size={18} />
                    </div>
                    <h2 className="font-bold text-lg">Library</h2>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <CloseIcon size={20} className="text-gray-400" />
                  </button>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200">
                  <button 
                    onClick={() => setActiveTab('templates')}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'templates' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Templates
                  </button>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'history' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    History ({savedComponents.length})
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'templates' ? (
                  <>
                    <div className="relative mb-6">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                      />
                    </div>

                    <div className="space-y-6">
                      <section>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Popular Designs</h3>
                        <div className="grid grid-cols-1 gap-3">
                          {filteredExamples.map((example, index) => (
                            <ExampleCard 
                              key={`sidebar-${index}`} 
                              example={example} 
                              onClick={() => {
                                handleExampleClick(example);
                                setIsSidebarOpen(false);
                              }} 
                            />
                          ))}
                        </div>
                      </section>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {savedComponents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                          <FileText size={24} />
                        </div>
                        <p className="text-xs font-medium text-gray-400">No saved components yet.</p>
                      </div>
                    ) : (
                      savedComponents.map((comp) => (
                        <div key={comp.id} className="group p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Code size={14} />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                                  {comp.language}
                                </span>
                                <span className="text-[9px] text-gray-300">
                                  {new Date(comp.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteSavedComponent(comp.id)}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                handleSendMessage(`Reuse this component:\n\n\`\`\`${comp.language}\n${comp.code}\n\`\`\``);
                                setIsSidebarOpen(false);
                              }}
                              className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all active:scale-95"
                            >
                              Reuse
                            </button>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(comp.code);
                                alert("Code copied to clipboard!");
                              }}
                              className="px-3 py-2 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-gray-100 transition-all active:scale-95"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-100">
                <p className="text-[10px] text-center text-gray-400 font-medium">
                  Select a template to get started quickly.
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 sticky top-0 z-30 shadow-sm transition-all">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all active:scale-95"
          title="Open Templates"
        >
          <Menu size={20} className="text-gray-600 md:w-6 md:h-6" />
        </button>

        {messages.length > 0 && (
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
            title="Back to Start"
          >
            <ArrowLeft size={20} className="text-gray-600 md:w-6 md:h-6" />
          </button>
        )}
        
        <div className="flex flex-col">
          <h1 className="font-bold text-sm md:text-lg text-gray-900 leading-tight">Tailwind Generator</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wider">Max Mode Active</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 ml-4">
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button 
              onClick={() => setSelectedModel("gemini-3.1-pro-preview")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${selectedModel === "gemini-3.1-pro-preview" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Pro 3.1
            </button>
            <button 
              onClick={() => setSelectedModel("gemini-3-flash-preview")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${selectedModel === "gemini-3-flash-preview" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Flash 3
            </button>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            {(['html', 'nextjs', 'json', 'txt'] as const).map((mode) => (
              <button 
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${selectedMode === mode ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1"></div>

        <button 
          onClick={() => setIsKeyModalOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95 text-gray-600"
          title="Update API Key"
        >
          <Key size={20} className="md:w-6 md:h-6" />
        </button>

        {messages.length > 0 && (
          <div className="flex items-center gap-1 md:gap-2">
            <button 
              onClick={() => setIsClearModalOpen(true)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95"
              title="Clear chat"
            >
              <Trash2 size={18} className="md:w-5 md:h-5" />
            </button>
            <button 
              onClick={handleExport}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-95"
              title="Export conversation"
            >
              <Download size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        )}
      </header>

      {/* Clear Chat Modal */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearChat}
        title="Clear Conversation"
        message="Are you sure you want to clear the entire chat history? This action cannot be undone."
        confirmText="Clear Chat"
        cancelText="Cancel"
      />

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth custom-scrollbar relative">
        <div className="max-w-3xl mx-auto space-y-6 pb-24">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-[2rem] shadow-2xl shadow-blue-100 flex items-center justify-center mb-8 text-blue-600 border border-blue-50">
                <Sparkles size={32} className="md:w-10 md:h-10" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Max Mode: Image to Tailwind</h2>
              <p className="text-sm md:text-base text-gray-500 max-w-md mb-10 leading-relaxed">
                Upload any UI screenshot. I will analyze it with extreme precision and generate a pixel-perfect, responsive Tailwind CSS component.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Layout size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Layouts</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <Code size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Code</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Palette size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Design</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                    <ImageIcon size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vision</span>
                </div>
              </div>

              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="mt-10 px-6 py-3 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all text-sm font-bold text-gray-600 flex items-center gap-2 active:scale-95"
              >
                <Lightbulb size={16} className="text-blue-500" />
                Browse Templates
              </button>
            </motion.div>
          ) : (
            messages.map((msg, index) => (
              <ChatMessageItem 
                key={msg.id} 
                message={msg} 
                isStreaming={isLoading && index === messages.length - 1}
                onUpdateKey={() => setIsKeyModalOpen(true)}
                onSaveComponent={handleSaveComponent}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 sticky bottom-0 z-30">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-center mb-2"
              >
                <button 
                  onClick={handleStopGenerating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full shadow-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all text-xs font-bold uppercase tracking-wider active:scale-95"
                >
                  <Square size={12} fill="currentColor" />
                  Stop Generating
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-3">
            <ChatInput 
              onSend={handleSendMessage} 
              disabled={isLoading}
              selectedImages={selectedImages}
              setSelectedImages={setSelectedImages}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              uploading={uploading}
              uploadProgress={uploadProgress}
              onProcessFiles={handleProcessFiles}
            />
            
            <p className="text-[10px] text-center text-gray-400 font-medium">
              Powered by Gemini 3.1 Pro • Pixel-perfect Tailwind Generation
            </p>
          </div>
        </div>
      </div>

      {/* Key Modal */}
      <AnimatePresence>
        {isKeyModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsKeyModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Key size={24} />
                </div>
                <button
                  onClick={() => setIsKeyModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                >
                  <CloseIcon size={20} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Update Gemini API Key</h3>
              <p className="text-sm text-gray-500 mb-6">
                Enter your Google Cloud API key to continue using the generator.
              </p>
              
              <div className="space-y-4">
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsKeyModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveKey}
                    disabled={!tempKey.trim()}
                    className="flex-1 px-4 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-colors disabled:opacity-50"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={() => {
          handleClearChat();
          setIsClearModalOpen(false);
        }}
        title="Clear Conversation"
        message="Are you sure you want to delete all messages? This action cannot be undone."
      />

      <AnimatePresence>
        {editingImage && (
          <ImageEditor
            image={editingImage}
            onConfirm={async (croppedImage) => {
              const thumb = await generateThumbnail(croppedImage);
              setSelectedImages(prev => [...prev, { original: croppedImage, thumb }]);
              setEditingImage(null);
            }}
            onCancel={() => setEditingImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
