// declaration.d.ts
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          virtualKeyboardMode?: string;
          readonly?: boolean;
          value?: string;
          onInput?: (event: Event) => void;
          onChange?: (event: Event) => void;
        },
        HTMLElement
      >;
    }
  }
}

export {};