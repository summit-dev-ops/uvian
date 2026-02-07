// TypeScript interfaces for dynamic breadcrumb component system

export interface BreadcrumbItem {
  id?: string;
  label: string;
  href?: string;
  type?: 'link' | 'page';
  disabled?: boolean;
}

export interface BreadcrumbConfig {
  maxVisibleItems?: number; // Default: 4
  className?: string;
}
