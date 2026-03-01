
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Terminal, Code2, ChevronRight, Brain, Copy, Check, Download, Save, Eye, EyeOff, Loader2, ExternalLink, Key, ShieldCheck, AlertTriangle } from "lucide-react";
import { Part } from "@google/genai";
import { LivePreview } from "./LivePreview";
import { generatePreviewHtml } from "../utils/preview";
import type { Components } from 'react-markdown';

interface ChatMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onUpdateKey?: () => void;
  onSaveComponent?: (code: string, language: string) => void;
}

const CodeBlock = ({ code, language, isTailwind, isStreaming, onSaveComponent }: { code: string, language: string, isTailwind: boolean, isStreaming?: boolean, onSaveComponent?: (code: string, language: string) => void }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isStreaming) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      // Simulate progress that slows down as it approaches 95%
      progressRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev < 30) return prev + 2;
          if (prev < 60) return prev + 1;
          if (prev < 90) return prev + 0.5;
          if (prev < 95) return prev + 0.1;
          return prev;
        });
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      setProgress(100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isStreaming]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (ext: string = 'tsx') => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `component-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-4 rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-[#1e1e1e] group/code">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-gray-400">{language}</span>
          {isStreaming && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <Loader2 size={10} className="animate-spin text-blue-400" />
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">
                  {elapsedTime > 0 ? `${elapsedTime}s` : "Starting..."}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-700/50 border border-gray-600 rounded-full">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Est. 30-45s</span>
              </div>
              <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                  className="h-full bg-blue-500"
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {isTailwind && (
            <div className="flex bg-gray-800 rounded-md p-1 gap-1">
              <button 
                onClick={() => setShowPreview(false)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${!showPreview ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                CODE
              </button>
              <button 
                onClick={() => setShowPreview(true)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${showPreview ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                PREVIEW
              </button>
            </div>
          )}

          {isTailwind && (
            <button 
              onClick={() => {
                const html = generatePreviewHtml(code, language);
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
              }}
              className="p-1.5 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors flex items-center gap-1.5 px-2"
              title="Open Live Preview in New Tab"
            >
              <ExternalLink size={14} />
            </button>
          )}
          <button 
            onClick={handleCopy}
            className="p-1.5 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors flex items-center gap-1.5 px-2"
            title="Copy code to clipboard"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span className="text-[10px] font-medium hidden sm:inline">{copied ? "Copied!" : "Copy Code"}</span>
          </button>
          
          {onSaveComponent && !isStreaming && (
            <button 
              onClick={() => {
                onSaveComponent(code, language);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
              className={`p-1.5 rounded-md transition-colors flex items-center gap-1.5 px-2 ${saved ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              title="Save to History"
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              <span className="text-[10px] font-medium hidden sm:inline">{saved ? "Saved!" : "Save"}</span>
            </button>
          )}

          <div className="flex bg-gray-800 rounded-md p-1 gap-1">
            <button 
              onClick={() => handleDownload('jsx')}
              className="px-2 py-1 hover:bg-gray-700 rounded text-[10px] font-bold text-gray-300 transition-colors"
              title="Export as .jsx"
            >
              JSX
            </button>
            <button 
              onClick={() => handleDownload('tsx')}
              className="px-2 py-1 hover:bg-gray-700 rounded text-[10px] font-bold text-gray-300 transition-colors"
              title="Export as .tsx"
            >
              TSX
            </button>
            <button 
              onClick={() => {
                const html = generatePreviewHtml(code, language);
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `preview-${Date.now()}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-2 py-1 hover:bg-gray-700 rounded text-[10px] font-bold text-gray-300 transition-colors"
              title="Export as .html"
            >
              HTML
            </button>
          </div>
        </div>
      </div>
      <div className="p-0">
        {showPreview && isTailwind ? (
          <LivePreview code={code} language={language} />
        ) : (
          <div className="p-4 overflow-x-auto relative">
            {isStreaming && !code ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 bg-gray-900/20 rounded-lg border border-dashed border-gray-700/50">
                <div className="relative">
                  <Loader2 size={28} className="animate-spin text-blue-500" />
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center px-6">
                  <span className="text-sm font-semibold text-gray-200">Generating Code...</span>
                  <p className="text-[10px] text-gray-500 max-w-[240px] leading-relaxed">
                    The model is crafting your UI.
                  </p>
                </div>
              </div>
            ) : (
              <pre className="text-xs text-white font-mono m-0">
                <code>{code}</code>
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SortableTable = ({ children }: { children: React.ReactNode }) => {
  const [sortConfig, setSortConfig] = useState<{ key: number, direction: 'asc' | 'desc' | null }>({ key: -1, direction: null });
  const [tableData, setTableData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const hiddenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hiddenRef.current) {
      const rows = Array.from(hiddenRef.current.querySelectorAll('tbody tr'));
      const headerCells = Array.from(hiddenRef.current.querySelectorAll('thead th'));
      
      setHeaders(headerCells.map(cell => (cell as HTMLElement).textContent || ''));
      setTableData(rows.map(row => Array.from((row as HTMLElement).querySelectorAll('td')).map(cell => (cell as HTMLElement).textContent || '')));
    }
  }, [children]);

  const sortedData = React.useMemo(() => {
    if (sortConfig.key === -1 || !sortConfig.direction) return tableData;

    return [...tableData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Try to compare as numbers if possible
      const aNum = parseFloat(aValue.replace(/[^0-9.-]+/g, ""));
      const bNum = parseFloat(bValue.replace(/[^0-9.-]+/g, ""));

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tableData, sortConfig]);

  const handleSort = (index: number) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === index && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === index && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key: index, direction });
  };

  const copyAsCSV = () => {
    const csv = [
      headers.join(','),
      ...tableData.map(row => row.join(','))
    ].join('\n');
    navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 w-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white group/table">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data Table</span>
        </div>
        <button 
          onClick={copyAsCSV}
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50"
        >
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          {copied ? "COPIED CSV" : "COPY CSV"}
        </button>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left text-gray-500 border-collapse min-w-[400px]">
          <thead className="text-[11px] text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
            <tr>
              {headers.map((header, i) => (
                <th 
                  key={i} 
                  onClick={() => handleSort(i)}
                  className="px-4 py-3 font-bold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors group/th whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    {header}
                    <div className="flex flex-col opacity-30 group-hover/th:opacity-100 transition-opacity">
                      <ChevronRight size={10} className={`-rotate-90 -mb-1 ${sortConfig.key === i && sortConfig.direction === 'asc' ? 'text-blue-600 opacity-100' : ''}`} />
                      <ChevronRight size={10} className={`rotate-90 ${sortConfig.key === i && sortConfig.direction === 'desc' ? 'text-blue-600 opacity-100' : ''}`} />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(sortConfig.direction ? sortedData : tableData).map((row, i) => (
              <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-gray-600 font-medium">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div ref={hiddenRef} className="hidden">{children}</div>
    </div>
  );
};

interface CollapsiblePartProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  headerClassName: string;
  contentClassName: string;
  status?: string;
}

const CollapsiblePart: React.FC<CollapsiblePartProps> = ({
  title,
  icon: Icon,
  children,
  headerClassName,
  contentClassName,
  status,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="my-2 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${headerClassName}`}
      >
        <div className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
          <ChevronRight size={14} />
        </div>
        <Icon size={14} />
        <span>{title}</span>
        {status && (
          <span
            className={`ml-auto text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${
              status === "OUTCOME_OK"
                ? "bg-emerald-500/20 text-emerald-600"
                : "bg-red-500/20 text-red-600"
            }`}
          >
            {status === "OUTCOME_OK" ? "Success" : "Error"}
          </span>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className={contentClassName}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ChatMessageItem: React.FC<ChatMessageProps> = ({ message, isStreaming, onUpdateKey, onSaveComponent }) => {
  const isUser = message.role === "user";

  const renderPart = (part: Part, index: number) => {
    // Check for 'thought' property
    // @ts-ignore
    if (part.thought === true || (typeof part.thought === 'string' && part.thought.length > 0)) {
      let title = "Thought Process";
      
      // Dynamic title update during streaming
      if (isStreaming && index === message.parts.length - 1) {
        // @ts-ignore
        const thoughtContent = typeof part.thought === 'string' ? part.thought : (part.text || "");
        
        if (!thoughtContent.trim()) {
           return (
             <div key={index} className="my-2 p-3 bg-purple-50 rounded-lg border border-purple-100 flex items-center gap-3">
               <Loader2 size={14} className="animate-spin text-purple-500" />
               <span className="text-xs font-medium text-purple-700">Analyzing vision data...</span>
             </div>
           );
        }

        // Find the last occurrence of bold text to use as the current thinking step
        const boldMatches = [...thoughtContent.matchAll(/\*\*([^*]+)\*\*/g)];
        if (boldMatches.length > 0) {
           const lastTitle = boldMatches[boldMatches.length - 1][1];
           title = `Thinking - ${lastTitle}`;
        }
      }

      return (
        <CollapsiblePart
          key={index}
          title={title}
          icon={Brain}
          headerClassName="bg-purple-50 text-purple-700 hover:bg-purple-100"
          contentClassName="p-3 bg-purple-50/50 text-purple-800"
        >
          <div className="prose prose-sm max-w-none prose-purple">
             {/* @ts-ignore */}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof part.thought === 'string' ? part.thought : (part.text || "")}</ReactMarkdown>
          </div>
        </CollapsiblePart>
      );
    }

    if (part.executableCode) {
      const code = part.executableCode.code;
      const [copied, setCopied] = useState(false);

      const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      const handleDownload = () => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code-${Date.now()}.${part.executableCode?.language || 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      const handlePreview = () => {
        const html = generatePreviewHtml(code, part.executableCode?.language || 'html');
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      };

      const isTailwind = code.includes('className=') || code.includes('class=');

      return (
        <CollapsiblePart
          key={index}
          title={`Executable Code (${part.executableCode.language})`}
          icon={Code2}
          headerClassName="bg-blue-50 text-blue-700 hover:bg-blue-100"
          contentClassName="p-0 bg-[#1e1e1e] relative group/code"
        >
          <div className="absolute right-2 top-2 flex gap-2 opacity-100 md:opacity-0 md:group-hover/code:opacity-100 transition-opacity z-10">
            {isTailwind && (
              <button 
                onClick={(e) => { e.stopPropagation(); handlePreview(); }}
                className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5 px-3"
                title="Open Live Preview in New Tab"
              >
                <ExternalLink size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Preview UI</span>
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="p-1.5 bg-gray-800/80 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1.5 px-2"
              title="Copy code to clipboard"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="text-[10px] font-medium">{copied ? "Copied!" : "Copy Code"}</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="p-1.5 bg-gray-800/80 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1.5 px-2"
              title="Download full script"
            >
              <Download size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Save</span>
            </button>
          </div>
          <div className="p-3">
            <div className="overflow-x-auto">
              {isStreaming && !code ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8 bg-gray-900/50 rounded-lg border border-dashed border-gray-700/50">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Generating Executable Code</span>
                    <span className="text-[10px] text-gray-500">Processing logic...</span>
                  </div>
                </div>
              ) : (
                <pre className="text-xs text-white font-mono">
                  <code>{code}</code>
                </pre>
              )}
            </div>
          </div>
        </CollapsiblePart>
      );
    }

    if (part.codeExecutionResult) {
       const isSuccess = part.codeExecutionResult.outcome === "OUTCOME_OK";
       return (
         <CollapsiblePart
           key={index}
           title="Execution Result"
           icon={Terminal}
           headerClassName={isSuccess ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-700 hover:bg-red-100"}
           contentClassName="p-3 bg-gray-50 text-gray-800 font-mono text-xs overflow-x-auto"
           status={part.codeExecutionResult.outcome}
         >
            <div className="whitespace-pre-wrap">
                {part.codeExecutionResult.output}
            </div>
         </CollapsiblePart>
       );
    }

    if (part.text) {
      const components: Components = {
        table(props) {
          return <SortableTable>{props.children}</SortableTable>;
        },
        thead(props) {
          return <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">{props.children}</thead>;
        },
        th(props) {
          return <th className="px-4 py-3 font-semibold text-gray-900">{props.children}</th>;
        },
        td(props) {
          return <td className="px-4 py-3 border-t border-gray-100">{props.children}</td>;
        },
        tr(props) {
          return <tr className="hover:bg-gray-50/50 transition-colors">{props.children}</tr>;
        },
        code(props) {
          const {children, className, node, ...rest} = props;
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';
          const codeString = String(children).replace(/\n$/, '');
          const isTailwind = codeString.includes('className=') || codeString.includes('class=');

          // Check if it's a block code (usually has a language or contains newlines)
          const isBlock = match || codeString.includes('\n');

          if (isBlock) {
            return (
              <CodeBlock 
                code={codeString} 
                language={language || 'text'} 
                isTailwind={isTailwind} 
                isStreaming={isStreaming} 
                onSaveComponent={onSaveComponent}
              />
            );
          }
          return <code {...rest} className="bg-gray-100 text-pink-600 px-1 py-0.5 rounded text-xs font-mono">{children}</code>;
        }
      };

      return (
        <div key={index} className="prose prose-sm max-w-none prose-slate prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-xl prose-table:border prose-table:border-gray-200 prose-th:bg-gray-50 prose-th:p-2 prose-td:p-2 prose-td:border-t prose-td:border-gray-100">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{part.text}</ReactMarkdown>
        </div>
      );
    }

    if (part.inlineData) {
      return (
        <div key={index} className="mt-2 mb-2">
            <img
            src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
            alt="Uploaded content"
            className="max-w-full rounded-lg border border-gray-200"
            />
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          isUser ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div
        className={`flex flex-col gap-2 max-w-[95%] md:max-w-[85%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm overflow-hidden w-full ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-white border border-gray-100 rounded-tl-sm text-gray-800"
          }`}
        >
          {message.parts.map((part, i) => renderPart(part, i))}
          {message.isError && message.errorType === 'key' && onUpdateKey && (
            <button
              onClick={onUpdateKey}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <Key size={14} />
              Update API Key
            </button>
          )}
          
          {message.accessibilityReport && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${message.accessibilityReport.score >= 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Accessibility Score</span>
                    <span className={`text-sm font-bold ${message.accessibilityReport.score >= 90 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {message.accessibilityReport.score}/100
                    </span>
                  </div>
                </div>
              </div>
              
              {message.accessibilityReport.issues.length > 0 ? (
                <div className="space-y-2">
                  {message.accessibilityReport.issues.map((issue, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${issue.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : issue.type === 'warning' ? 'bg-orange-50 border-orange-100 text-orange-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold">{issue.message}</span>
                          <p className="text-[10px] opacity-80 leading-relaxed">{issue.suggestion}</p>
                          {issue.element && (
                            <code className="text-[9px] bg-black/5 p-1 rounded mt-1 font-mono break-all">
                              {issue.element}
                            </code>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 flex items-center gap-2">
                  <Check size={14} />
                  <span className="text-xs font-bold">No accessibility issues detected!</span>
                </div>
              )}
            </div>
          )}
        </div>
        <span className="text-xs text-gray-400 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
};
