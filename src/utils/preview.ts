
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const generatePreviewHtml = (code: string, language: string) => {
  const isReact = language === 'tsx' || language === 'jsx' || code.includes('React') || code.includes('className=');
  
  if (isReact) {
    let cleanCode = code
      .replace(/import.*?;?/g, '')
      .replace(/export default function/g, 'function')
      .replace(/export function/g, 'function')
      .replace(/export const/g, 'const');

    const componentMatch = cleanCode.match(/(?:function|const)\s+([A-Z]\w*)/);
    const componentName = componentMatch ? componentMatch[1] : 'App';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://unpkg.com/lucide@latest"></script>
          <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <style>
            body { margin: 0; padding: 1rem; font-family: sans-serif; background-color: #f8fafc; }
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: #f1f1f1; }
            ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            const { useState, useEffect, useRef } = React;
            
            const IconMock = ({ name, ...props }) => {
              return React.createElement('i', {
                'data-lucide': name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
                ...props
              });
            };
            
            window.LucideIcons = new Proxy({}, {
              get: function(target, prop) {
                return (props) => React.createElement(IconMock, { name: prop, ...props });
              }
            });

            try {
              ${cleanCode}

              const root = ReactDOM.createRoot(document.getElementById('root'));
              root.render(React.createElement(${componentName}));
              
              setTimeout(() => {
                lucide.createIcons();
              }, 100);
            } catch (err) {
              document.getElementById('root').innerHTML = '<div style="color: red; padding: 20px; font-family: monospace;">Error rendering component: ' + err.message + '</div>';
            }
          </script>
        </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://unpkg.com/lucide@latest"></script>
          <style>
            body { margin: 0; padding: 1rem; font-family: sans-serif; background-color: #f8fafc; }
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: #f1f1f1; }
            ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          </style>
        </head>
        <body>
          ${code}
          <script>
            lucide.createIcons();
          </script>
        </body>
      </html>
    `;
  }
};
