'use client';

import { useEffect } from 'react';

export function WebViewRedirect() {
  useEffect(() => {
    // Function to detect if running in WebView
    const isWebView = () => {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Detect various in-app browsers / WebViews
      const isInAppBrowser = (
        // Instagram
        /Instagram/i.test(ua) ||
        // Facebook
        /FBAN|FBAV/i.test(ua) ||
        // Twitter
        /Twitter/i.test(ua) ||
        // LinkedIn
        /LinkedInApp/i.test(ua) ||
        // WhatsApp
        /WhatsApp/i.test(ua) ||
        // Snapchat
        /Snapchat/i.test(ua) ||
        // TikTok
        /TikTok|musical_ly/i.test(ua) ||
        // Line
        /Line/i.test(ua) ||
        // WeChat
        /MicroMessenger/i.test(ua) ||
        // Generic WebView detection
        /wv|WebView/i.test(ua) ||
        // Android WebView
        (/Android/i.test(ua) && /Version\/[\d.]+.*Safari/i.test(ua) && !/Chrome/i.test(ua))
      );

      return isInAppBrowser;
    };

    // Function to get the appropriate browser URL scheme
    const openInBrowser = () => {
      const currentUrl = window.location.href;
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);

      if (isIOS) {
        // For iOS, use googlechrome:// or Safari fallback
        // Try to open in Chrome first, fallback to Safari
        const chromeUrl = currentUrl.replace(/^https?:\/\//, 'googlechrome://');
        window.location.href = chromeUrl;
        
        // Fallback to Safari after a short delay
        setTimeout(() => {
          window.location.href = currentUrl;
        }, 500);
      } else if (isAndroid) {
        // For Android, use intent URL to open in default browser
        const intentUrl = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;action=android.intent.action.VIEW;end;`;
        window.location.href = intentUrl;
        
        // Fallback to direct URL after a short delay
        setTimeout(() => {
          window.location.href = currentUrl;
        }, 500);
      } else {
        // For other platforms, just reload in regular browser
        window.location.href = currentUrl;
      }
    };

    // Check if in WebView and redirect
    if (isWebView()) {
      console.log('[WebViewRedirect] Detected WebView, redirecting to browser...');
      
      // Show a message before redirecting
      const shouldRedirect = true; // You can add a confirmation here if needed
      
      if (shouldRedirect) {
        openInBrowser();
      }
    }
  }, []);

  return null; // This component doesn't render anything
}
