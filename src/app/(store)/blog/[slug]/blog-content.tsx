"use client";

import ReactMarkdown from "react-markdown";

export function BlogContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-3" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
          p: ({ node, ...props }) => <p className="text-sm leading-relaxed mb-3" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 text-sm" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 text-sm" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          a: ({ node, ...props }) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4" {...props} />
          ),
          code: ({ node, inline, ...props }: any) =>
            inline ? (
              <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
            ) : (
              <pre className="bg-secondary p-3 rounded-md overflow-x-auto my-3">
                <code className="text-xs font-mono" {...props} />
              </pre>
            ),
          img: ({ node, alt, ...props }) => (
            <img
              alt={typeof alt === "string" ? alt : "blog image"}
              className="rounded-md my-3 w-full"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
