
// src/hooks/use-clipboard.ts
import { useState } from 'react';

interface UseClipboardReturn {
  copyToClipboard: (text: string) => Promise<boolean>;
  copied: boolean;
}

export function useClipboard(resetTimeout = 2000): UseClipboardReturn {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard API not available');
      return false;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      setTimeout(() => {
        setCopied(false);
      }, resetTimeout);
      
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopied(false);
      return false;
    }
  };
  
  return { copyToClipboard, copied };
}
