'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@org/ui';
import { ScrollArea } from '@org/ui';

// ============================================================================
// INTERFACE LAYOUT (Main component with ScrollArea wrapper)
// ============================================================================

export interface InterfaceLayoutProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const InterfaceLayout = React.forwardRef<HTMLDivElement, InterfaceLayoutProps>(
  ({ className, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <div className="h-full flex flex-col">
        <ScrollArea className="flex-1">
          <Comp ref={ref} className="h-full" {...props}>
            {children}
          </Comp>
        </ScrollArea>
      </div>
    );
  }
);
InterfaceLayout.displayName = 'InterfaceLayout';

// ============================================================================
// INTERFACE CONTAINER
// ============================================================================

const interfaceContainerVariants = cva(
  'flex w-full flex-1 flex-col transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-background',
        card: 'bg-card text-card-foreground rounded-lg border shadow-sm',
        bordered: 'bg-background border-t border-l border-r',
        minimal: 'bg-background',
      },
      size: {
        compact: 'max-w-2xl mx-auto',
        default: 'max-w-4xl mx-auto',
        spacious: 'max-w-6xl mx-auto',
        full: 'w-full max-w-none',
      },
      spacing: {
        none: 'p-0',
        compact: 'p-4',
        default: 'p-6',
        spacious: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'full',
      spacing: 'default',
    },
  }
);

export interface InterfaceContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof interfaceContainerVariants> {
  asChild?: boolean;
}

const InterfaceContainer = React.forwardRef<
  HTMLDivElement,
  InterfaceContainerProps
>(({ className, variant, size, spacing, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      ref={ref}
      className={cn(
        interfaceContainerVariants({ variant, size, spacing }),
        className
      )}
      {...props}
    />
  );
});
InterfaceContainer.displayName = 'InterfaceContainer';

// ============================================================================
// INTERFACE BANNER
// ============================================================================

interface InterfaceBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl?: string;
  gradientDirection?: 'to-t' | 'to-b' | 'to-l' | 'to-r';
  gradientOpacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
  height?: 'sm' | 'default' | 'lg' | 'xl';
}

const interfaceBannerVariants = cva('relative overflow-hidden', {
  variants: {
    height: {
      sm: 'h-32',
      default: 'h-48',
      lg: 'h-64',
      xl: 'h-80',
    },
  },
  defaultVariants: {
    height: 'default',
  },
});

const InterfaceBanner = React.forwardRef<HTMLDivElement, InterfaceBannerProps>(
  (
    {
      className,
      imageUrl,
      gradientDirection = 'to-t',
      gradientOpacity = 0.8,
      gradientFrom = 'transparent',
      gradientTo = 'black',
      height = 'default',
      children,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(interfaceBannerVariants({ height }), className)}
      {...props}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div
        className={cn('absolute inset-0', {
          'bg-gradient-to-t': gradientDirection === 'to-t',
          'bg-gradient-to-b': gradientDirection === 'to-b',
          'bg-gradient-to-l': gradientDirection === 'to-l',
          'bg-gradient-to-r': gradientDirection === 'to-r',
        })}
        style={{
          opacity: gradientOpacity,
          background: `linear-gradient(${gradientDirection}, ${gradientFrom} 0%, ${gradientTo} 100%)`,
        }}
      />
      <div className="relative h-full flex items-end">{children}</div>
    </div>
  )
);
InterfaceBanner.displayName = 'InterfaceBanner';

// ============================================================================
// INTERFACE BANNER CONTENT
// ============================================================================

interface InterfaceBannerContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const InterfaceBannerContent = React.forwardRef<
  HTMLDivElement,
  InterfaceBannerContentProps
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('w-full p-6 text-white', className)} {...props}>
    {children}
  </div>
));
InterfaceBannerContent.displayName = 'InterfaceBannerContent';

// ============================================================================
// INTERFACE HEADER
// ============================================================================

const interfaceHeaderVariants = cva(
  'flex flex-col transition-colors duration-200',
  {
    variants: {
      sticky: {
        always:
          'sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b',
        auto: 'sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b',
        never: '',
      },
      spacing: {
        none: 'p-0',
        compact: 'p-4',
        default: 'p-6',
        spacious: 'p-8',
      },
    },
    defaultVariants: {
      sticky: 'never',
      spacing: 'default',
    },
  }
);

export interface InterfaceHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof interfaceHeaderVariants> {
  asChild?: boolean;
}

const InterfaceHeader = React.forwardRef<HTMLDivElement, InterfaceHeaderProps>(
  (
    { className, sticky, spacing, asChild = false, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref}
        className={cn(interfaceHeaderVariants({ sticky, spacing }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
InterfaceHeader.displayName = 'InterfaceHeader';

// ============================================================================
// INTERFACE HEADER CONTENT
// ============================================================================

interface InterfaceHeaderContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const InterfaceHeaderContent = React.forwardRef<
  HTMLDivElement,
  InterfaceHeaderContentProps
>(({ className, title, subtitle, actions, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-start justify-between', className)}
    {...props}
  >
    <div className="space-y-1">
      {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      {children}
    </div>
    {actions && <div className="flex items-center space-x-2">{actions}</div>}
  </div>
));
InterfaceHeaderContent.displayName = 'InterfaceHeaderContent';

// ============================================================================
// INTERFACE CONTENT
// ============================================================================

const interfaceContentVariants = cva('flex flex-1 flex-col min-h-0', {
  variants: {
    spacing: {
      none: 'p-0',
      compact: 'p-4',
      default: 'p-6',
      spacious: 'p-8',
    },
  },
  defaultVariants: {
    spacing: 'default',
  },
});

export interface InterfaceContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof interfaceContentVariants> {
  asChild?: boolean;
}

const InterfaceContent = React.forwardRef<
  HTMLDivElement,
  InterfaceContentProps
>(({ className, spacing, asChild = false, children, ...props }, ref) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      ref={ref}
      className={cn(interfaceContentVariants({ spacing }), className)}
      {...props}
    >
      {children}
    </Comp>
  );
});
InterfaceContent.displayName = 'InterfaceContent';

// ============================================================================
// INTERFACE FOOTER
// ============================================================================

const interfaceFooterVariants = cva(
  'flex items-center transition-colors duration-200',
  {
    variants: {
      sticky: {
        always:
          'sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t',
        auto: 'sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t',
        never: '',
      },
      spacing: {
        none: 'p-0',
        compact: 'p-4',
        default: 'p-6',
        spacious: 'p-8',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
      },
    },
    defaultVariants: {
      sticky: 'never',
      spacing: 'default',
      justify: 'start',
    },
  }
);

export interface InterfaceFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof interfaceFooterVariants> {
  asChild?: boolean;
}

const InterfaceFooter = React.forwardRef<HTMLDivElement, InterfaceFooterProps>(
  (
    {
      className,
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
          interfaceFooterVariants({ sticky, spacing, justify }),
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
InterfaceFooter.displayName = 'InterfaceFooter';

// ============================================================================
// INTERFACE SECTION (for grouping content)
// ============================================================================

const interfaceSectionVariants = cva('space-y-6', {
  variants: {
    variant: {
      default: '',
      card: 'bg-card rounded-lg border p-6',
      separated: 'border-t pt-6 first:border-t-0 first:pt-0',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface InterfaceSectionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof interfaceSectionVariants> {
  title?: string;
  description?: string;
  asChild?: boolean;
}

const InterfaceSection = React.forwardRef<
  HTMLDivElement,
  InterfaceSectionProps
>(
  (
    {
      className,
      variant,
      title,
      description,
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
        className={cn(interfaceSectionVariants({ variant }), className)}
        {...props}
      >
        {(title || description) && (
          <div className="space-y-1">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        {children}
      </Comp>
    );
  }
);
InterfaceSection.displayName = 'InterfaceSection';

// ============================================================================
// EXPORTS
// ============================================================================

export {
  InterfaceLayout,
  InterfaceContainer,
  InterfaceBanner,
  InterfaceBannerContent,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceFooter,
  InterfaceSection,
};
