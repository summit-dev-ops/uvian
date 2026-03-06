'use client';

import Markdown from 'react-markdown';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export function MarkdownView({ content, className }: MarkdownViewProps) {
  return (
    <article className="prose prose dark:prose-invert max-w-none">
      <Markdown
        components={{
          p: ({ children }) => (
            <p className="break-words mb-2 last:mb-0">{children}</p>
          ),
          pre: ({ children }) => (
            <div className="w-full overflow-x-auto my-3 rounded-lg">
              <pre className="p-4 whitespace-pre-wrap break-all">
                {children}
              </pre>
            </div>
          ),
          ul: ({ children }) => (
            <ul className="list-disc ml-4 mb-2 break-words">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-4 mb-2 break-words">{children}</ol>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-primary underline break-all">
              {children}
            </a>
          ),
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold mb-1">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-muted px-1 py-0.5 rounded text-sm">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </Markdown>
    </article>
  );
}
