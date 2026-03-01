
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { generatePreviewHtml } from "../utils/preview";

interface LivePreviewProps {
  code: string;
  language: string;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ code, language }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    setIsLoading(true);

    const html = generatePreviewHtml(code, language);

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;

    const handleLoad = () => setIsLoading(false);
    iframeRef.current.addEventListener('load', handleLoad);
    
    // Fallback if load event doesn't fire
    setTimeout(() => setIsLoading(false), 1000);

    return () => {
      URL.revokeObjectURL(url);
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleLoad);
      }
    };
  }, [code, language]);


  return (
    <div className="relative w-full h-[60vh] md:h-[500px] min-h-[400px] border border-gray-200 rounded-b-lg overflow-hidden bg-white">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <Loader2 className="animate-spin text-blue-500" size={24} />
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Live Preview"
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};
