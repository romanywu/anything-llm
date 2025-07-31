import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for managing text selection within LLM response blocks
 * Handles selection detection, validation, and follow-up button positioning
 */
export function useTextSelection() {
  const [selection, setSelection] = useState({
    text: "",
    isValid: false,
    range: null,
    boundingRect: null,
  });
  
  const selectionTimeoutRef = useRef(null);
  
  // Validate selection based on requirements
  const validateSelection = useCallback((selectedText, range) => {
    if (!selectedText || !range) return false;
    
    // Check minimum length (5 characters excluding whitespace)
    const trimmedText = selectedText.trim();
    if (trimmedText.length < 5) return false;
    
    // Check if it's not just punctuation or empty space
    if (/^[\s\p{P}]*$/u.test(trimmedText)) return false;
    
    // Check if selection is within a single LLM response block
    const container = range.commonAncestorContainer;
    const messageElement = container.nodeType === Node.TEXT_NODE 
      ? container.parentElement 
      : container;
    
    // Look for the closest message container
    const messageContainer = messageElement.closest('[data-message-role="assistant"]');
    if (!messageContainer) return false;
    
    // Check if the message is streaming/incomplete - disable follow-up for streaming responses
    const isStreaming = messageContainer.querySelector('.dot-falling');
    if (isStreaming) return false;
    
    // Ensure selection doesn't span multiple message blocks
    const startContainer = range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : range.startContainer;
    const endContainer = range.endContainer.nodeType === Node.TEXT_NODE
      ? range.endContainer.parentElement
      : range.endContainer;
    
    const startMessage = startContainer.closest('[data-message-role="assistant"]');
    const endMessage = endContainer.closest('[data-message-role="assistant"]');
    
    return startMessage === endMessage && startMessage === messageContainer;
  }, []);
  
  // Handle text selection events
  const handleSelectionChange = useCallback(() => {
    // Clear any existing timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }
    
    // Debounce selection handling to avoid excessive calls
    selectionTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString();
      
      if (!selectedText || selection.rangeCount === 0) {
        setSelection({
          text: "",
          isValid: false,
          range: null,
          boundingRect: null,
        });
        return;
      }
      
      const range = selection.getRangeAt(0);
      const isValid = validateSelection(selectedText, range);
      
      if (isValid) {
        const rect = range.getBoundingClientRect();
        setSelection({
          text: selectedText.trim(),
          isValid: true,
          range: range.cloneRange(),
          boundingRect: {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          },
        });
      } else {
        setSelection({
          text: "",
          isValid: false,
          range: null,
          boundingRect: null,
        });
      }
    }, 100);
  }, [validateSelection]);
  
  // Handle click outside to clear selection
  const handleClickOutside = useCallback((e) => {
    // Check if click is outside message areas and not on the follow-up button
    const messageContainer = e.target.closest('[data-message-role="assistant"]');
    const followupButton = e.target.closest('[data-followup-button="true"]');
    
    if (!messageContainer && !followupButton) {
      // Clear selection if clicking outside message areas
      window.getSelection().removeAllRanges();
      setSelection({
        text: "",
        isValid: false,
        range: null,
        boundingRect: null,
      });
    }
  }, []);
  
  // Clear selection programmatically
  const clearSelection = useCallback(() => {
    window.getSelection().removeAllRanges();
    setSelection({
      text: "",
      isValid: false,
      range: null,
      boundingRect: null,
    });
  }, []);
  
  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("click", handleClickOutside);
    
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("click", handleClickOutside);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [handleSelectionChange, handleClickOutside]);
  
  return {
    selection,
    clearSelection,
  };
}