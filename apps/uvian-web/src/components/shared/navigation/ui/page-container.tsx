'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { Button, cn, Separator, SidebarTrigger } from '@org/ui';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ============================================================================
// PAGE CONTAINER
// ============================================================================

const pageContainerVariants = cva(
  'relative flex w-full flex-1 flex-col transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-background',
        card: 'bg-card text-card-foreground rounded-lg border shadow-sm',
        bordered: 'bg-background border-t border-l border-r',
      },
      size: {
        default: 'max-w-4xl mx-auto',
        full: 'w-full max-w-none',
        contained: 'max-w-6xl mx-auto',
        wide: 'max-w-7xl mx-auto',
      },
      spacing: {
        none: 'p-0',
        default: 'p-2',
        compact: 'p-4',
        spacious: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'full',
      spacing: 'default',
    },
  }
);

export interface PageContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageContainerVariants> {
  asChild?: boolean;
}

const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, variant, size, spacing, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref}
        className={cn(
          pageContainerVariants({ variant, size, spacing }),
          className
        )}
        {...props}
      />
    );
  }
);
PageContainer.displayName = 'PageContainer';

// ============================================================================
// PAGE HEADER
// ============================================================================

const pageHeaderVariants = cva('flex flex-col transition-colors duration-200', {
  variants: {
    variant: {
      default: '',
      card: 'p-2 pb-0',
      bordered: '',
    },
    sticky: {
      true: 'sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b',
      false: '',
    },
    spacing: {
      none: 'p-0',
      default: 'p-2',
      compact: 'p-4',
      spacious: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    sticky: false,
    spacing: 'default',
  },
});

export interface PageHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageHeaderVariants> {
  asChild?: boolean;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      className,
      variant,
      sticky,
      spacing,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    
    const router = useRouter()
    const handleBack = () => {
      router.back();
    };

    const Comp = asChild ? Slot : 'div';
    return (
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <Comp
            ref={ref}
            className={cn(
              pageHeaderVariants({ variant, sticky, spacing }),
              className
            )}
            {...props}
          >
            {children}
          </Comp>
        </div>
      </header>
    );
  }
);
PageHeader.displayName = 'PageHeader';

// ============================================================================
// PAGE CONTENT (Always Scrollable)
// ============================================================================

const pageContentVariants = cva('flex flex-1 flex-col min-h-0', {
  variants: {
    variant: {
      default: '',
      card: 'p-6 pt-0',
      bordered: '',
    },
    spacing: {
      none: 'p-0',
      default: 'p-2',
      compact: 'p-4',
      spacious: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    spacing: 'default',
  },
});

export interface PageContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageContentVariants> {
  asChild?: boolean;
}

const PageContent = React.forwardRef<HTMLDivElement, PageContentProps>(
  (
    { className, variant, spacing, asChild = false, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'div';

    return (
      <Comp
        ref={ref}
        className={cn(pageContentVariants({ variant, spacing }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
PageContent.displayName = 'PageContent';

// ============================================================================
// PAGE FOOTER
// ============================================================================

const pageFooterVariants = cva(
  'flex items-center border-t transition-colors duration-200',
  {
    variants: {
      variant: {
        default: '',
        card: 'p-6 pt-0',
        bordered: '',
      },
      sticky: {
        true: 'sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        false: '',
      },
      spacing: {
        default: 'p-2',
        compact: 'p-4',
        spacious: 'p-6',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
      },
    },
    defaultVariants: {
      variant: 'default',
      sticky: false,
      spacing: 'default',
      justify: 'start',
    },
  }
);

export interface PageFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageFooterVariants> {
  asChild?: boolean;
}

const PageFooter = React.forwardRef<HTMLDivElement, PageFooterProps>(
  (
    {
      className,
      variant,
      sticky,
      spacing,
      justify,
      asChild = false,
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
          pageFooterVariants({ variant, sticky, spacing, justify }),
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
PageFooter.displayName = 'PageFooter';

// ============================================================================
// EXPORTS
// ============================================================================

export { PageContainer, PageHeader, PageContent, PageFooter };
