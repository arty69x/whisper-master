/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Image as ImageIcon, X, FileText, Trash2, Settings2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string, images?: string[], files?: { name: string, content: string }[]) => void;
  disabled: boolean;
  selectedImages: { original: string, thumb: string }[];
  setSelectedImages: React.Dispatch<React.SetStateAction<{ original: string, thumb: string }[]>>;
  selectedFiles: { name: string, content: string, size: number }[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<{ name: string, content: string, size: number }[]>>;
  uploading: boolean;
  uploadProgress: number;
  onProcessFiles: (files: FileList | File[]) => Promise<void>;
}

const MAX_TEXT_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_TEXT_FILE_CHARS = 100000;
const MAX_INPUT_CHARS = 4000;

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  disabled, 
  selectedImages, 
  setSelectedImages, 
  selectedFiles, 
  setSelectedFiles,
  uploading,
  uploadProgress,
  onProcessFiles
}) => {
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);

  const MODIFIERS = [
    { id: '--tailwind', label: 'Force Tailwind' },
    { id: '--dark', label: 'Dark Mode' },
    { id: '--glass', label: 'Glassmorphism' },
    { id: '--brutalist', label: 'Brutalist' },
    { id: '--retro', label: 'Retro' },
    { id: '--minimal', label: 'Minimal' },
    { id: '--neon', label: 'Neon' },
    { id: '--material', label: 'Material Design' },
    { id: '--neumorphic', label: 'Neumorphism' },
    { id: '--vue', label: 'Vue 3' },
  ];

  const toggleModifier = (id: string) => {
    setActiveModifiers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedImages.length > 0 || selectedFiles.length > 0) && !disabled && !uploading) {
      const modifierString = activeModifiers.length > 0 ? ` ${activeModifiers.join(' ')}` : '';
      const finalInput = input.trim() + modifierString;
      
      onSend(
        finalInput, 
        selectedImages.length > 0 ? selectedImages.map(img => img.original) : undefined,
        selectedFiles.length > 0 ? selectedFiles.map(f => ({ name: f.name, content: f.content })) : undefined
      );
      setInput("");
      setSelectedImages([]);
      setSelectedFiles([]);
      setActiveModifiers([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await onProcessFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTextFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await onProcessFiles(e.target.files);
    }
    if (textFileInputRef.current) textFileInputRef.current.value = "";
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      await onProcessFiles(files);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await onProcessFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedImages([]);
    setSelectedFiles([]);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <form
      onSubmit={handleSubmit}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="relative flex flex-col gap-2 bg-white p-1.5 md:p-2 rounded-[2rem] border border-gray-200 shadow-xl shadow-gray-200/20 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/50 transition-all duration-500"
    >
      <AnimatePresence>
        {(selectedImages.length > 0 || selectedFiles.length > 0 || uploading) && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="relative px-2 pt-2 flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar"
          >
            <div className="w-full flex justify-between items-center mb-1 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selected Assets</span>
                {uploading && (
                  <div className="flex items-center gap-3 px-3 py-1.5 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm animate-pulse">
                    <Loader2 size={12} className="animate-spin text-blue-500" />
                    <div className="flex flex-col min-w-[100px]">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[8px] font-bold text-blue-600 uppercase tracking-wider leading-none">Processing Assets</span>
                        <span className="text-[9px] font-bold text-blue-500">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button 
                type="button" 
                onClick={clearAll}
                className="text-[10px] font-bold text-red-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-1"
              >
                <Trash2 size={10} />
                Clear All
              </button>
            </div>
            {selectedImages.map((image, index) => (
              <div key={`img-${index}`} className="relative inline-block group/img">
                <img
                  src={image.thumb}
                  alt={`Selected ${index}`}
                  className="h-16 md:h-20 w-auto rounded-2xl border border-gray-100 object-cover shadow-sm transition-transform group-hover/img:scale-105"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-all active:scale-90"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {selectedFiles.map((file, index) => (
              <div key={`file-${index}`} className="relative inline-block group/file">
                <div className="h-16 md:h-20 w-24 md:w-28 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col items-center justify-center p-2 shadow-sm transition-transform group-hover/file:scale-105">
                  <FileText size={20} className="text-blue-500 mb-1" />
                  <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center">{file.name}</span>
                  <span className="text-[8px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-all active:scale-90"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full flex flex-wrap gap-2 mb-3 px-1 overflow-hidden"
          >
            <div className="w-full flex items-center gap-2 mb-1">
              <Sparkles size={12} className="text-blue-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Style Modifiers</span>
            </div>
            {MODIFIERS.map(mod => (
              <button
                key={mod.id}
                type="button"
                onClick={() => toggleModifier(mod.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  activeModifiers.includes(mod.id)
                    ? 'bg-blue-500 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {mod.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-1 md:gap-2">
        <div className="flex items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-90 disabled:opacity-30"
            title="Upload Images"
          >
            <ImageIcon size={20} className="md:w-6 md:h-6" />
          </button>

          <input
            type="file"
            ref={textFileInputRef}
            onChange={handleTextFileSelect}
            accept=".txt,.js,.ts,.tsx,.jsx,.py,.css,.html,.json,.md"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => textFileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-90 disabled:opacity-30"
            title="Upload Text/Script Files"
          >
            <FileText size={20} className="md:w-6 md:h-6" />
          </button>
          
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            disabled={disabled || uploading}
            className={`p-3 rounded-full transition-all active:scale-90 disabled:opacity-30 ${showSettings || activeModifiers.length > 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
            title="Style Settings"
          >
            <Settings2 size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_CHARS))}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Describe your UI, paste an image, or drop files here..."
            disabled={disabled || uploading}
            rows={1}
            className="w-full max-h-[160px] min-h-[44px] py-3 px-1 bg-transparent border-none outline-none resize-none text-sm md:text-base text-gray-800 placeholder-gray-400 disabled:opacity-50 leading-relaxed"
          />
          {input.length > 0 && (
            <div className={`absolute right-1 -bottom-1 text-[9px] font-bold transition-colors ${input.length > MAX_INPUT_CHARS * 0.9 ? 'text-orange-500' : 'text-gray-300'}`}>
              {input.length}/{MAX_INPUT_CHARS}
            </div>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={(!input.trim() && selectedImages.length === 0 && selectedFiles.length === 0) || disabled || uploading}
          className={`flex-shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
            (!input.trim() && selectedImages.length === 0 && selectedFiles.length === 0) || disabled || uploading
              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
              : "bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40"
          }`}
        >
          {disabled || uploading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} className="md:w-6 md:h-6" />}
        </motion.button>
      </div>
    </form>
  );
};
