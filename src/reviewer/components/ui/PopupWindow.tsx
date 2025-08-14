import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";

interface PopupWindowProps {
  children: React.ReactNode;
  title?: string;
  onClose?: () => void;
  features?: string;
}

const PopupWindow: React.FC<PopupWindowProps> = ({
  children,
  title = "Suggestions",
  onClose,
}) => {
  const [externalWindow, setExternalWindow] = useState<Window | null>(null);
  const containerElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const targetHeight = Math.floor(window.screen.height / 2); // Half screen height
    const targetWidth = Math.floor(window.screen.width / 4); // Quarter screen width

    const defaultFeatures = `width=${targetWidth},height=${targetHeight},menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes,status=no`;

    // console.log(
    //   "[PopupWindow] Calculated targetHeight for popup:",
    //   targetHeight
    // );
    // console.log("[PopupWindow] Calculated targetWidth for popup:", targetWidth);
    // console.log(
    //   "[PopupWindow] defaultFeatures for window.open:",
    //   defaultFeatures
    // );

    const newWindow = window.open("about:blank", "_blank", defaultFeatures);

    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
              /* Basic Reset */
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              html, body {
                height: 100%; /* Ensure html and body take full viewport height */
                display: flex; /* Make body a flex container */
                flex-direction: column; /* Stack children vertically */
                overflow: hidden; /* Prevent scrollbars on html/body themselves */
                font-family: sans-serif; /* Provide a basic default font */
                background-color: #f0f0f0; /* Basic background, will be overridden by copied styles */
              }
              #popup-root {
                flex-grow: 1; /* Allow #popup-root to grow and fill the body */
                display: flex; /* Make #popup-root a flex container for its children */
                flex-direction: column; /* Stack children of #popup-root vertically */
                /* overflow-y: auto; /* REMOVED: Scrolling handled by inner panel */
                min-height: 0; /* Important for nested flex scrolling */
                /* Diagnostic border removed from here, will be applied via setAttribute */
              }
            </style>
        </head>
        <body>
            <div id="popup-root"></div>
        </body>
        </html>
      `);
      newWindow.document.title = title;
      newWindow.document.close();

      // Attempt to focus the new window to help with clipboard API requirements
      newWindow.focus();

      const portalRoot = newWindow.document.getElementById(
        "popup-root"
      ) as HTMLDivElement | null;

      if (portalRoot) {
        // Apply diagnostic border to portalRoot via setAttribute
        // portalRoot.setAttribute('style', 'border: 3px solid blue !important; padding: 1px;');
        // console.log('[PopupWindow] Applied diagnostic border to #popup-root via setAttribute.');

        containerElRef.current = portalRoot;
        setExternalWindow(newWindow);

        // Re-enable stylesheet copying
        Array.from(document.styleSheets).forEach((styleSheet) => {
          try {
            if (styleSheet.cssRules) {
              const newStyleEl = newWindow.document.createElement("style");
              Array.from(styleSheet.cssRules).forEach((rule) => {
                newStyleEl.appendChild(
                  newWindow.document.createTextNode(rule.cssText)
                );
              });
              newWindow.document.head.appendChild(newStyleEl);
            } else if (styleSheet.href) {
              const newLinkEl = newWindow.document.createElement("link");
              newLinkEl.rel = "stylesheet";
              newLinkEl.href = styleSheet.href;
              newWindow.document.head.appendChild(newLinkEl);
            }
          } catch (e) {
            // console.warn(
            //   "[PopupWindow] Could not copy stylesheet to popup:",
            //   styleSheet.href || "inline style",
            //   e
            // );
          }
        });

        const timerId = setTimeout(() => {
          if (newWindow && !newWindow.closed) {
            newWindow.document.title = title;
            newWindow.focus(); // Reinforce focus, just in case
          }
        }, 0);

        const handleBeforeUnload = () => {
          if (onClose) {
            onClose();
          }
        };
        newWindow.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
          clearTimeout(timerId);
          newWindow.removeEventListener("beforeunload", handleBeforeUnload);
          if (newWindow && !newWindow.closed) {
            newWindow.close();
          }
          if (onClose) {
            onClose();
          }
        };
      } else {
        console.error(
          "[PopupWindow] Could not find #popup-root in the new window."
        );
        if (newWindow && !newWindow.closed) newWindow.close();
        if (onClose) {
          onClose();
        }
      }
    } else {
      // console.warn("[PopupWindow] Popup window was blocked or failed to open.");
      if (onClose) {
        onClose();
      }
    }
  }, [title, onClose]);

  useEffect(() => {
    return () => {
      if (externalWindow && !externalWindow.closed) {
        externalWindow.close();
      }
    };
  }, [externalWindow]);

  if (!externalWindow || !containerElRef.current) {
    return null;
  }

  return ReactDOM.createPortal(children, containerElRef.current);
};

export default PopupWindow;
