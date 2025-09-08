declare module '*.mdx' {
  import type { ComponentType } from 'react';
  
  export const meta: {
    title: string;
    date: string;
    author: string;
    description: string;
    tags?: string[];
  };
  
  const MDXComponent: ComponentType;
  export default MDXComponent;
}