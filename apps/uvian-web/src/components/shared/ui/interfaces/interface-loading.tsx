'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@org/ui';
import { Spinner, Skeleton } from '@org/ui';

// ============================================================================
// INTERFACE LOADING CONTAINER
// ============================================================================

const InterfaceLoadingContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col items-center justify-center gap-3 transition-all duration-200 text-muted-foreground min-h-[200px] p-4',
      className
    )}
    {...props}
  />
));
InterfaceLoadingContainer.displayName = 'InterfaceLoadingContainer';

// ============================================================================
// INTERFACE LOADING SPINNER
// ============================================================================

const InterfaceLoadingSpinner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={className} {...props}>
    <Spinner className="h-6 w-6 animate-spin" />
  </div>
));
InterfaceLoadingSpinner.displayName = 'InterfaceLoadingSpinner';

// ============================================================================
// INTERFACE LOADING MESSAGE
// ============================================================================

interface InterfaceLoadingMessageProps
  extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

const InterfaceLoadingMessage = React.forwardRef<
  HTMLDivElement,
  InterfaceLoadingMessageProps
>(({ className, message = 'Loading...', ...props }, ref) => (
  <p ref={ref} className={cn('text-sm font-medium', className)} {...props}>
    {message}
  </p>
));
InterfaceLoadingMessage.displayName = 'InterfaceLoadingMessage';

// ============================================================================
// INTERFACE LOADING (MAIN COMPONENT)
// ============================================================================

const interfaceLoadingVariants = cva(
  'flex flex-col items-center justify-center gap-3 transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'text-muted-foreground',
        card: 'text-muted-foreground bg-card rounded-lg border p-8',
        bordered: 'text-muted-foreground border-t border-l border-r p-6',
      },
      size: {
        sm: 'min-h-[100px]',
        default: 'min-h-[200px]',
        lg: 'min-h-[300px]',
        full: 'min-h-[400px]',
      },
      spacing: {
        none: '',
        default: 'p-4',
        compact: 'p-6',
        spacious: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      spacing: 'default',
    },
  }
);

export interface InterfaceLoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof interfaceLoadingVariants> {
  asChild?: boolean;
  message?: string;
  showLoader?: boolean;
}

const InterfaceLoading = React.forwardRef<
  HTMLDivElement,
  InterfaceLoadingProps
>(
  (
    {
      className,
      variant,
      size,
      spacing,
      asChild = false,
      message = 'Loading...',
      showLoader = true,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref}
        className={cn(
          interfaceLoadingVariants({ variant, size, spacing }),
          className
        )}
        {...props}
      >
        {showLoader && <InterfaceLoadingSpinner />}
        {message && <InterfaceLoadingMessage message={message} />}
        {children}
      </Comp>
    );
  }
);
InterfaceLoading.displayName = 'InterfaceLoading';

// ============================================================================
// INTERFACE LOADING SKELETON CONTAINER
// ============================================================================

const InterfaceLoadingSkeletonContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col gap-3 transition-all duration-200 min-h-[200px] p-4',
      className
    )}
    {...props}
  />
));
InterfaceLoadingSkeletonContainer.displayName =
  'InterfaceLoadingSkeletonContainer';

// ============================================================================
// INTERFACE LOADING SKELETON ITEM
// ============================================================================

interface InterfaceLoadingSkeletonItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
}

const InterfaceLoadingSkeletonItem = React.forwardRef<
  HTMLDivElement,
  InterfaceLoadingSkeletonItemProps
>(({ className, delay = 0, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('h-4 w-full', className)}
    style={{
      animationDelay: `${delay}s`,
      animationDuration: '1s',
    }}
    {...props}
  >
    <Skeleton
      className="h-full w-full"
      style={{
        animationDelay: `${delay}s`,
        animationDuration: '1s',
      }}
    />
  </div>
));

InterfaceLoadingSkeletonItem.displayName = 'InterfaceLoadingSkeletonItem';

// ============================================================================
// INTERFACE LOADING SKELETON LINES
// ============================================================================

interface InterfaceLoadingSkeletonLinesProps
  extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

const InterfaceLoadingSkeletonLines = React.forwardRef<
  HTMLDivElement,
  InterfaceLoadingSkeletonLinesProps
>(({ className, lines = 3, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-3', className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <InterfaceLoadingSkeletonItem key={i} delay={i * 0.1} />
    ))}
  </div>
));
InterfaceLoadingSkeletonLines.displayName = 'InterfaceLoadingSkeletonLines';

// ============================================================================
// INTERFACE LOADING SKELETON VARIANTS
// ============================================================================

const interfaceLoadingSkeletonVariants = cva(
  'flex flex-col gap-3 transition-all duration-200',
  {
    variants: {
      variant: {
        default: '',
        card: 'bg-card rounded-lg border p-6',
        bordered: 'border-t border-l border-r p-4',
      },
      size: {
        sm: 'min-h-[100px]',
        default: 'min-h-[200px]',
        lg: 'min-h-[300px]',
        full: 'min-h-[400px]',
      },
      spacing: {
        none: '',
        default: 'p-4',
        compact: 'p-6',
        spacious: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      spacing: 'default',
    },
  }
);

export interface InterfaceLoadingSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof interfaceLoadingSkeletonVariants> {
  asChild?: boolean;
  lines?: number;
}

const InterfaceLoadingSkeleton = React.forwardRef<
  HTMLDivElement,
  InterfaceLoadingSkeletonProps
>(
  (
    { className, variant, size, spacing, asChild = false, lines = 3, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref}
        className={cn(
          interfaceLoadingSkeletonVariants({ variant, size, spacing }),
          className
        )}
        {...props}
      >
        <InterfaceLoadingSkeletonLines lines={lines} />
      </Comp>
    );
  }
);
InterfaceLoadingSkeleton.displayName = 'InterfaceLoadingSkeleton';

// ============================================================================
// EXPORTS
// ============================================================================

export {
  InterfaceLoadingContainer,
  InterfaceLoadingSpinner,
  InterfaceLoadingMessage,
  InterfaceLoading,
  InterfaceLoadingSkeletonContainer,
  InterfaceLoadingSkeletonItem,
  InterfaceLoadingSkeletonLines,
  InterfaceLoadingSkeleton,
};
