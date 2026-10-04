'use client'

import React, { useEffect, useRef, useState } from 'react';
import { IChatMessage } from '@/types';
import useECharts from '@/hooks/useECharts';

interface MessageProps {
  message: IChatMessage;
}

export default function Message({ message }: MessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);
  const { initECharts, disposeECharts } = useECharts({ message });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Initialize ECharts after component mounts
    const timeoutId = setTimeout(() => {
      initECharts('chart', 'chart-0');
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      disposeECharts();
    };
  }, [initECharts, disposeECharts]);

  // Process message content to handle markdown and ECharts code blocks
  const processContent = (content: string) => {
    if (!mounted || typeof window === 'undefined') {
      // Server side fallback - just escape dangerous content but preserve echarts
      return content
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/```echarts\n([\s\S]*?)\n```/g, (match, configStr) => {
          const chartId = `chart-${Math.floor(Math.random() * 1000)}`;
          const encodedConfig = encodeURIComponent(configStr.trim());
          return `<div class="echarts-container" id="${chartId}" data-echarts-config="${encodedConfig}" style="width: 100%; height: 300px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 1rem 0;"></div>`;
        });
    }

    // Client side processing
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const MarkdownIt = require('markdown-it');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require('dompurify');
    
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true
    });

    // First, handle ECharts code blocks before markdown processing
    let processedContent = content;
    let chartIndex = 0;

    // Replace echarts code blocks with placeholder divs
    processedContent = processedContent.replace(/```echarts\n([\s\S]*?)\n```/g, (match, configStr) => {
      const chartId = `chart-${chartIndex++}`;
      const encodedConfig = encodeURIComponent(configStr.trim());
      
      return `<div class="echarts-container" id="${chartId}" data-echarts-config="${encodedConfig}" style="width: 100%; height: 300px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 1rem 0;"></div>`;
    });

    // Process markdown
    const htmlContent = md.render(processedContent);

    // Sanitize the HTML using DOMPurify with allowlist for ECharts
    const cleanContent = DOMPurify.sanitize(htmlContent, {
      ALLOWED_TAGS: [
        'div', 'p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a',
        'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span'
      ],
      ALLOWED_ATTR: [
        'class', 'id', 'data-echarts-config', 'style', 'href', 'src', 
        'alt', 'title', 'target', 'rel'
      ],
      ALLOW_DATA_ATTR: true,
    });

    return cleanContent;
  };

  const isUser = message.role === 'user';

  return (
    <div id={message.id} ref={messageRef} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-md border ${
        isUser 
          ? 'bg-blue-500/90 backdrop-blur-sm text-white border-blue-400/30 ml-auto' 
          : 'bg-white/70 backdrop-blur-sm text-gray-800 border-white/30'
      }`}>
        {isUser ? (
          <div 
            className="prose prose-sm max-w-none text-white prose-headings:text-white prose-strong:text-white prose-code:text-blue-100 prose-pre:bg-blue-600/20"
            dangerouslySetInnerHTML={{ __html: processContent(message.content) }}
          />
        ) : mounted ? (
          <div 
            className="prose prose-sm max-w-none text-gray-800 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-code:text-purple-700 prose-pre:bg-gray-100/50"
            dangerouslySetInnerHTML={{ __html: processContent(message.content) }}
          />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`} suppressHydrationWarning={true}>
          {mounted ? message.timestamp.toLocaleTimeString() : '--:--:--'}
        </div>
      </div>
    </div>
  );
}