'use client';

/**
 * FAQ Interface Component
 *
 * Simplified FAQ interface using InterfaceLayout and @org/ui Accordion components
 */

import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@org/ui';
import {
  InterfaceContainer,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceSection,
  InterfaceLayout,
} from '~/components/shared/ui/interfaces';

export interface FAQInterfaceProps {
  // Simplified props - no complex configuration needed
  className?: string;
}

export function FAQInterface({ className }: FAQInterfaceProps) {
  // Dynamic content using key-value map structure
  const faqData = {
    'getting-started': {
      question: 'How do I get started?',
      answer:
        'To get started, create an account and complete your profile. You can then explore the platform features and connect with other users.',
    },
    support: {
      question: 'How do I contact support?',
      answer:
        'If you need assistance, please use the contact support option in the help menu. Our team will respond to your inquiry as soon as possible.',
    },
    features: {
      question: 'What features are available?',
      answer:
        'The platform offers various features including messaging, collaboration tools, and profile management. Explore the interface to discover all available capabilities.',
    },
  };

  return (
    <InterfaceLayout>
      <InterfaceContainer className={className}>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Frequently Asked Questions"
            subtitle="Find answers to common questions about using the platform"
          />
        </InterfaceHeader>

        <InterfaceContent>
          <InterfaceSection>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(faqData).map(([key, item]) => (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-muted-foreground">
                      {item.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </InterfaceSection>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
