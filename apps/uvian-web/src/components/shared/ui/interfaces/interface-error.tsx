'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { cn } from '@org/ui';
import { Button } from '@org/ui';

// ============================================================================
// INTERFACE ERROR CONTAINER
// ============================================================================

const InterfaceErrorContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col items-center justify-center gap-4 transition-all duration-200 text-muted-foreground min-h-[200px] p-4',
      className
    )}
    {...props}
  />
));
InterfaceErrorContainer.displayName = 'InterfaceErrorContainer';

// ============================================================================
// INTERFACE ERROR ICON
// ============================================================================

const InterfaceErrorIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('h-8 w-8 text-destructive', className)}
    {...props}
  >
    <AlertCircle className="h-8 w-8" />
  </div>
));
InterfaceErrorIcon.displayName = 'InterfaceErrorIcon';

// ============================================================================
// INTERFACE ERROR CONTENT
// ============================================================================

interface InterfaceErrorContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
}

const InterfaceErrorContent = React.forwardRef<
  HTMLDivElement,
  InterfaceErrorContentProps
>(
  (
    {
      className,
      title = 'Something went wrong',
      message = 'We encountered an error while loading this content.',
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn('text-center space-y-2', className)}
      {...props}
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
    </div>
  )
);
InterfaceErrorContent.displayName = 'InterfaceErrorContent';

// ============================================================================
// INTERFACE ERROR ACTIONS
// ============================================================================

interface InterfaceErrorActionsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
}

const InterfaceErrorActions = React.forwardRef<
  HTMLDivElement,
  InterfaceErrorActionsProps
>(
  (
    { className, showRetry = false, showHome = false, onRetry, ...props },
    ref
  ) => {
    const router = useRouter();

    const handleRetry = () => {
      if (onRetry) {
        onRetry();
      } else {
        window.location.reload();
      }
    };

    const handleHome = () => {
      router.push('/');
    };

    if (!showRetry && !showHome) {
      return null;
    }

    return (
      <div ref={ref} className={cn('flex gap-2', className)} {...props}>
        {showRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
        {showHome && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleHome}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        )}
      </div>
    );
  }
);
InterfaceErrorActions.displayName = 'InterfaceErrorActions';

// ============================================================================
// INTERFACE ERROR (MAIN COMPONENT)
// ============================================================================

const interfaceErrorVariants = cva(
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

export interface InterfaceErrorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof interfaceErrorVariants> {
  asChild?: boolean;
  title?: string;
  message?: string;
  showIcon?: boolean;
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
}

const InterfaceError = React.forwardRef<HTMLDivElement, InterfaceErrorProps>(
  (
    {
      className,
      variant,
      size,
      spacing,
      asChild = false,
      title = 'Something went wrong',
      message = 'We encountered an error while loading this content.',
      showIcon = true,
      showRetry = false,
      showHome = false,
      onRetry,
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
          interfaceErrorVariants({ variant, size, spacing }),
          className
        )}
        {...props}
      >
        {showIcon && <InterfaceErrorIcon />}
        <InterfaceErrorContent title={title} message={message} />
        <InterfaceErrorActions
          showRetry={showRetry}
          showHome={showHome}
          onRetry={onRetry}
        />
        {children}
      </Comp>
    );
  }
);
InterfaceError.displayName = 'InterfaceError';

// ============================================================================
// EXPORTS
// ============================================================================

export {
  InterfaceErrorContainer,
  InterfaceErrorIcon,
  InterfaceErrorContent,
  InterfaceErrorActions,
  InterfaceError,
};
