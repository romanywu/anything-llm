import React from "react";
import { ChatCircleText } from "@phosphor-icons/react";
import { PROMPT_INPUT_EVENT } from "../WorkspaceChat/ChatContainer/PromptInput";

/**
 * Floating Follow-up button that appears when text is selected in LLM responses
 * Positioned near the end of selected text and allows quick follow-up on that content
 */
export default function FollowUpButton({ selection, onFollowUp }) {
  if (!selection.isValid || !selection.boundingRect) {
    return null;
  }

  const handleClick = () => {
    try {
      const followUpText = `Follow up on: "${selection.text}"`;
      
      // Update the prompt input using the same event system as the existing codebase
      window.dispatchEvent(
        new CustomEvent(PROMPT_INPUT_EVENT, {
          detail: followUpText,
        })
      );
      
      // Focus the textarea
      const textarea = document.querySelector('textarea[placeholder*="message"]');
      if (textarea) {
        textarea.focus();
        // Place cursor at the end
        setTimeout(() => {
          textarea.setSelectionRange(followUpText.length, followUpText.length);
        }, 0);
      }
      
      // Call the onFollowUp callback to clear selection
      if (onFollowUp) {
        onFollowUp();
      }
    } catch (error) {
      console.error("Error handling follow-up button click:", error);
    }
  };

  // Calculate button position
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const buttonWidth = 100; // Approximate button width
  const buttonHeight = 40; // Approximate button height
  
  let top = selection.boundingRect.bottom + 8;
  let left = selection.boundingRect.right - 50; // Position near end of selection
  let transform = "translateX(-50%)";
  
  // Adjust horizontal position if button would go off-screen
  if (left - buttonWidth / 2 < 0) {
    // Too far left, align to left edge of selection
    left = selection.boundingRect.left;
    transform = "translateX(0)";
  } else if (left + buttonWidth / 2 > viewportWidth) {
    // Too far right, align to right edge of selection
    left = selection.boundingRect.right;
    transform = "translateX(-100%)";
  }
  
  // Adjust vertical position if button would go off-screen
  if (top + buttonHeight > viewportHeight) {
    // Position above the selection instead
    top = selection.boundingRect.top - buttonHeight - 8;
  }
  
  const buttonStyle = {
    position: "fixed",
    top: `${top}px`,
    left: `${left}px`,
    zIndex: 1000,
    transform,
  };

  return (
    <button
      data-followup-button="true"
      onClick={handleClick}
      className="flex items-center gap-x-1 px-3 py-2 bg-theme-bg-primary border border-theme-border rounded-lg shadow-lg hover:bg-theme-bg-secondary transition-colors duration-200 text-theme-text-primary text-sm font-medium"
      style={buttonStyle}
    >
      <ChatCircleText className="w-4 h-4" />
      Follow-up
    </button>
  );
}