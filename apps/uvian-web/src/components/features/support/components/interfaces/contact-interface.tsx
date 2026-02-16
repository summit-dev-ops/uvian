'use client';

/**
 * Contact Interface Component
 *
 * Simplified contact interface using InterfaceLayout and reusable ContactForm component
 */

import * as React from 'react';

import {
  InterfaceContainer,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceSection,
  InterfaceLayout,
} from '~/components/shared/ui/interfaces';
import {
  ContactForm,
  type ContactFormData,
} from '~/components/features/support/components/forms/contact-form';

export interface ContactInterfaceProps {
  onSubmitTicket?: (ticket: ContactFormData) => void;
}

export function ContactInterface({ onSubmitTicket }: ContactInterfaceProps) {
  const handleFormSubmit = async (data: ContactFormData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onSubmitTicket?.(data);
    } catch (error) {
      console.error('Failed to submit contact form:', error);
    }
  };

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Contact Support"
            subtitle="Send us a message and we'll get back to you as soon as possible"
          />
        </InterfaceHeader>

        <InterfaceContent>
          <InterfaceSection>
            <ContactForm
              onSubmit={handleFormSubmit}
              submitLabel="Send Message"
            />
          </InterfaceSection>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
