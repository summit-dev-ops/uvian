import { ComponentType } from 'react';

// Modal state interface
export interface ModalState {
  isOpen: boolean;
  props: Record<string, any>;
}

// Modal Registration Interface
export interface ModalRegistration {
  id: string;
  Component: ComponentType<any>;
  defaultProps?: Record<string, any>;
}
