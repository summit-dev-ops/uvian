'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@org/ui';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from '@org/ui';

// ============================================================================
// INTERFACE EMPTY CONTAINER
// ============================================================================

const InterfaceEmptyContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Empty ref={ref} className={className} {...props} />
));
InterfaceEmptyContainer.displayName = 'InterfaceEmptyContainer';

// ============================================================================
// INTERFACE EMPTY MEDIA (Custom dotted circle for backward compatibility)
// ============================================================================

interface InterfaceEmptyMediaProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'icon';
}

const InterfaceEmptyMedia = React.forwardRef<
  HTMLDivElement,
  InterfaceEmptyMediaProps
>(({ className, variant = 'icon', ...props }, ref) => {
  if (variant === 'default') {
    return (
      <EmptyMedia
        ref={ref}
        variant={variant}
        className={className}
        {...props}
      />
    );
  }

  // Custom dotted circle for backward compatibility
  return (
    <div
      ref={ref}
      className={cn(
        'h-8 w-8 rounded-full bg-muted flex items-center justify-center',
        className
      )}
      {...props}
    >
      <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
    </div>
  );
});
InterfaceEmptyMedia.displayName = 'InterfaceEmptyMedia';

// ============================================================================
// INTERFACE EMPTY TITLE
// ============================================================================

const InterfaceEmptyTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <EmptyTitle ref={ref} className={className} {...props} />
));
InterfaceEmptyTitle.displayName = 'InterfaceEmptyTitle';

// ============================================================================
// INTERFACE EMPTY DESCRIPTION
// ============================================================================

const InterfaceEmptyDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <EmptyDescription ref={ref} className={className} {...props} />
));
InterfaceEmptyDescription.displayName = 'InterfaceEmptyDescription';

// ============================================================================
// INTERFACE EMPTY ACTION
// ============================================================================

interface InterfaceEmptyActionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode;
}

const InterfaceEmptyAction = React.forwardRef<
  HTMLDivElement,
  InterfaceEmptyActionProps
>(({ className, action, ...props }, ref) => {
  if (!action) {
    return null;
  }

  return (
    <div ref={ref} className={cn('flex gap-2', className)} {...props}>
      {action}
    </div>
  );
});
InterfaceEmptyAction.displayName = 'InterfaceEmptyAction';

// ============================================================================
// INTERFACE EMPTY (MAIN COMPONENT)
// ============================================================================

const interfaceEmptyVariants = cva(
  'flex flex-col items-center justify-center gap-4 transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'text-muted-foreground',
        card: 'text-muted-foreground bg-card rounded-lg border p-8',
        bordered: 'text-muted-foreground border-t border-l border-r p-6',
      },
      size: {
        sm: 'min-h-[150px]',
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

export interface InterfaceEmptyProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof interfaceEmptyVariants> {
  asChild?: boolean;
  title?: string;
  message?: string;
  showIcon?: boolean;
  action?: React.ReactNode;
}

const InterfaceEmpty = React.forwardRef<HTMLDivElement, InterfaceEmptyProps>(
  (
    {
      className,
      variant,
      size,
      spacing,
      asChild = false,
      title = 'Nothing here yet',
      message = 'This section is empty.',
      showIcon = true,
      action,
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
          interfaceEmptyVariants({ variant, size, spacing }),
          className
        )}
        {...props}
      >
        {showIcon && <InterfaceEmptyMedia />}
        <EmptyHeader>
          <InterfaceEmptyTitle>{title}</InterfaceEmptyTitle>
          <InterfaceEmptyDescription>{message}</InterfaceEmptyDescription>
        </EmptyHeader>
        <InterfaceEmptyAction action={action} />
        {children}
      </Comp>
    );
  }
);
InterfaceEmpty.displayName = 'InterfaceEmpty';

// ============================================================================
// EXPORTS
// ============================================================================

export {
  InterfaceEmptyContainer,
  InterfaceEmptyMedia,
  InterfaceEmptyTitle,
  InterfaceEmptyDescription,
  InterfaceEmptyAction,
  InterfaceEmpty,
};
