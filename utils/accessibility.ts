export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
  element?: string;
}

export interface AccessibilityReport {
  score: number;
  issues: AccessibilityIssue[];
}

export const checkAccessibility = (code: string): AccessibilityReport => {
  const issues: AccessibilityIssue[] = [];
  let score = 100;

  // Basic regex-based checks for common issues
  
  // 1. Check for missing alt text on images
  const imgRegex = /<img\s+([^>]*?)>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(code)) !== null) {
    const attrs = imgMatch[1];
    if (!/alt\s*=\s*["'][^"']*["']/i.test(attrs)) {
      issues.push({
        type: 'error',
        message: 'Missing alt text on image',
        suggestion: 'Add a descriptive alt attribute to the <img> tag for screen readers.',
        element: imgMatch[0]
      });
      score -= 10;
    } else if (/alt\s*=\s*["']\s*["']/i.test(attrs)) {
      issues.push({
        type: 'warning',
        message: 'Empty alt text on image',
        suggestion: 'If the image is decorative, an empty alt is fine. Otherwise, add descriptive text.',
        element: imgMatch[0]
      });
      score -= 2;
    }
  }

  // 2. Check for missing labels on buttons
  const buttonRegex = /<button\s+([^>]*?)>(.*?)<\/button>/gis;
  let buttonMatch;
  while ((buttonMatch = buttonRegex.exec(code)) !== null) {
    const attrs = buttonMatch[1];
    const content = buttonMatch[2].trim();
    
    // Check if button has no text content and no aria-label
    if (!content && !/aria-label\s*=\s*["'][^"']*["']/i.test(attrs) && !/title\s*=\s*["'][^"']*["']/i.test(attrs)) {
      issues.push({
        type: 'error',
        message: 'Icon-only button missing accessible label',
        suggestion: 'Add an aria-label or title attribute to the button so screen readers can identify its purpose.',
        element: buttonMatch[0].substring(0, 100) + (buttonMatch[0].length > 100 ? '...' : '')
      });
      score -= 15;
    }
  }

  // 3. Check for low contrast color combinations (Simplified check for common Tailwind classes)
  const lowContrastClasses = [
    'text-gray-300', 'text-gray-400', 'text-slate-300', 'text-slate-400',
    'bg-white text-gray-200', 'bg-gray-100 text-gray-400'
  ];
  
  lowContrastClasses.forEach(cls => {
    if (code.includes(cls)) {
      issues.push({
        type: 'warning',
        message: `Potential low contrast issue with class "${cls}"`,
        suggestion: 'Ensure the text color has a contrast ratio of at least 4.5:1 against its background.',
      });
      score -= 5;
    }
  });

  // 4. Check for keyboard navigation (missing focus states)
  const interactiveElements = ['<button', '<a ', '<input', '<select', '<textarea'];
  let missingFocus = false;
  interactiveElements.forEach(el => {
    if (code.includes(el) && !code.includes('focus:')) {
      missingFocus = true;
    }
  });

  if (missingFocus) {
    issues.push({
      type: 'warning',
      message: 'Missing focus states on interactive elements',
      suggestion: 'Add focus:ring or focus:outline classes to provide visual feedback for keyboard users.',
    });
    score -= 10;
  }

  // 5. Check for semantic HTML
  const landmarks = ['<main', '<section', '<nav', '<header', '<footer', '<aside', '<article'];
  const missingLandmarks = landmarks.filter(l => !code.includes(l));
  if (missingLandmarks.length > 3) {
    issues.push({
      type: 'info',
      message: 'Limited use of semantic HTML landmarks',
      suggestion: 'Incorporate tags like <main>, <section>, <nav>, <header>, and <footer> to provide a clear document structure for assistive technologies. This helps users navigate content more efficiently.',
    });
    score -= 5;
  }

  // 6. Check for heading hierarchy (Simplified)
  if (code.includes('<h2') && !code.includes('<h1')) {
    issues.push({
      type: 'warning',
      message: 'Heading hierarchy issue: <h2> used without <h1>',
      suggestion: 'Always start your heading structure with an <h1>. Headings should follow a logical nesting order (h1 > h2 > h3) to maintain a clear outline for screen readers.',
    });
    score -= 8;
  }

  // 7. Check for ARIA attributes on complex components
  if ((code.includes('modal') || code.includes('dialog') || code.includes('dropdown')) && !code.includes('aria-')) {
    issues.push({
      type: 'warning',
      message: 'Complex UI component missing ARIA attributes',
      suggestion: 'For modals, dropdowns, or tabs, use ARIA attributes like aria-expanded, aria-haspopup, aria-modal, and aria-controls to communicate state and relationships to screen readers.',
    });
    score -= 10;
  }

  // 8. Check for redundant title attributes
  if (code.includes('title=') && code.includes('aria-label=')) {
    issues.push({
      type: 'info',
      message: 'Redundant labeling: both title and aria-label used',
      suggestion: 'Using both title and aria-label can cause screen readers to announce the label twice. Prefer aria-label for accessibility and title for visual tooltips only if they provide unique information.',
    });
    score -= 2;
  }

  // 9. Check for click handlers on non-interactive elements
  const clickOnDivRegex = /<div[^>]*onClick=[^>]*>/gi;
  if (clickOnDivRegex.test(code)) {
    issues.push({
      type: 'error',
      message: 'Click handler on non-interactive element (<div>)',
      suggestion: 'Interactive elements should use <button> or <a> tags. If you must use a <div>, add role="button", tabIndex={0}, and handle keyboard events (Enter/Space) to ensure keyboard accessibility.',
    });
    score -= 15;
  }

  return {
    score: Math.max(0, score),
    issues
  };
};
