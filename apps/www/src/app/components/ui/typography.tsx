import { ComponentProps } from 'react';

function H1({ className, ...rest }: ComponentProps<'h1'>) {
  return (
    <h1
      {...rest}
      className={`scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl ${className ?? ''}`}
    />
  );
}

function H2({ className, ...rest }: ComponentProps<'h2'>) {
  return (
    <h2
      {...rest}
      className={`scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 ${className ?? ''}`}
    />
  );
}

function H3({ className, ...rest }: ComponentProps<'h3'>) {
  return (
    <h3
      {...rest}
      className={`scroll-m-20 text-2xl font-semibold tracking-tight ${className ?? ''}`}
    />
  );
}

function H4({ className, ...rest }: ComponentProps<'h4'>) {
  return (
    <h4
      {...rest}
      className={`scroll-m-20 text-xl font-semibold tracking-tight ${className ?? ''}`}
    />
  );
}

function P({ className, ...rest }: ComponentProps<'p'>) {
  return (
    <p
      {...rest}
      className={`leading-7 [&:not(:first-child)]:mt-6 ${className ?? ''}`}
    />
  );
}

function Blockquote({ className, ...rest }: ComponentProps<'blockquote'>) {
  return (
    <blockquote
      {...rest}
      className={`mt-6 border-l-2 pl-6 italic ${className ?? ''}`}
    />
  );
}

function InlineCode({ className, ...rest }: ComponentProps<'code'>) {
  return (
    <code
      {...rest}
      className={`bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold ${className ?? ''}`}
    />
  );
}

function Lead({ className, ...rest }: ComponentProps<'p'>) {
  return (
    <p
      {...rest}
      className={`text-muted-foreground text-xl ${className ?? ''}`}
    />
  );
}

function Large({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      {...rest}
      className={`text-lg font-semibold ${className ?? ''}`}
    />
  );
}

function Muted({ className, ...rest }: ComponentProps<'p'>) {
  return (
    <p
      {...rest}
      className={`text-muted-foreground text-sm ${className ?? ''}`}
    />
  );
}

export { Blockquote, H1, H2, H3, H4, InlineCode, Large, Lead, Muted, P };
