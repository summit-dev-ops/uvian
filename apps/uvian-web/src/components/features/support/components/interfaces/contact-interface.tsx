'use client';

/**
 * Contact Interface Component
 *
 * Contact form and support options for users to get direct help
 * from the support team.
 */

import * as React from 'react';
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Send,
  AlertCircle,
  CheckCircle,
  FileText,
  Zap,
} from 'lucide-react';
import { Button } from '@org/ui';
import { Input } from '@org/ui';
import { Textarea } from '@org/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@org/ui';
import { InterfaceError } from '~/components/shared/ui/interfaces/interface-error';
import { InterfaceLoading } from '~/components/shared/ui/interfaces/interface-loading';
import { ScrollArea } from '@org/ui';
import { Badge } from '@org/ui';
import { Label } from '@org/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui';

export interface ContactInterfaceProps {
  // Configuration
  defaultCategory?: string;
  showFAQ?: boolean;
  showKnowledgeBase?: boolean;
  showLiveChat?: boolean;

  // Callbacks
  onSubmitTicket?: (ticket: ContactFormData) => void;
  onFAQClick?: () => void;
  onKnowledgeBaseClick?: () => void;
  onLiveChatClick?: () => void;

  // Styling
  className?: string;
}

export interface ContactFormData {
  subject: string;
  message: string;
  category:
    | 'general'
    | 'technical'
    | 'billing'
    | 'feature-request'
    | 'bug-report';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  email?: string;
  name?: string;
}

export function ContactInterface({
  defaultCategory = 'general',
  showFAQ = true,
  showKnowledgeBase = true,
  showLiveChat = true,
  onSubmitTicket,
  onFAQClick,
  onKnowledgeBaseClick,
  onLiveChatClick,
  className,
}: ContactInterfaceProps) {
  const [formData, setFormData] = React.useState<ContactFormData>({
    subject: '',
    message: '',
    category: defaultCategory as ContactFormData['category'],
    priority: 'medium',
    email: '',
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<
    'idle' | 'success' | 'error'
  >('idle');

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      onSubmitTicket?.(formData);
      setSubmitStatus('success');

      // Reset form
      setFormData({
        subject: '',
        message: '',
        category: 'general',
        priority: 'medium',
        email: '',
        name: '',
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    {
      value: 'general',
      label: 'General Question',
      description: 'General questions about Uvian',
    },
    {
      value: 'technical',
      label: 'Technical Support',
      description: 'Technical issues or bugs',
    },
    {
      value: 'billing',
      label: 'Billing & Payments',
      description: 'Questions about billing and payments',
    },
    {
      value: 'feature-request',
      label: 'Feature Request',
      description: 'Suggest new features or improvements',
    },
    {
      value: 'bug-report',
      label: 'Bug Report',
      description: 'Report bugs or errors',
    },
  ];

  const priorities = [
    {
      value: 'low',
      label: 'Low',
      description: 'Not urgent, general questions',
    },
    { value: 'medium', label: 'Medium', description: 'Normal priority issues' },
    {
      value: 'high',
      label: 'High',
      description: 'Important issues affecting work',
    },
    {
      value: 'urgent',
      label: 'Urgent',
      description: 'Critical issues blocking work',
    },
  ];

  const supportOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      action: 'Start Chat',
      onClick: onLiveChatClick,
      available: showLiveChat,
      color: 'text-green-600',
    },
    {
      icon: FileText,
      title: 'Knowledge Base',
      description: 'Browse our comprehensive help articles',
      action: 'Browse Articles',
      onClick: onKnowledgeBaseClick,
      available: showKnowledgeBase,
      color: 'text-blue-600',
    },
    {
      icon: Zap,
      title: 'FAQ',
      description: 'Quick answers to common questions',
      action: 'View FAQ',
      onClick: onFAQClick,
      available: showFAQ,
      color: 'text-purple-600',
    },
  ];

  return (
    <ScrollArea className="flex-1">
      <div className={`space-y-6 p-6 ${className || ''}`}>
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Contact Support</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Need help? We're here for you. Choose the best way to get support or
            send us a message directly.
          </p>
        </div>

        {/* Support Options */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Get Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {supportOptions
              .filter((option) => option.available)
              .map((option) => {
                const Icon = option.icon;
                return (
                  <Card
                    key={option.title}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={option.onClick}
                  >
                    <CardContent className="p-6 text-center">
                      <Icon
                        className={`h-8 w-8 ${option.color} mx-auto mb-3`}
                      />
                      <h3 className="font-semibold mb-2">{option.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {option.description}
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        {option.action}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </section>

        {/* Contact Form */}
        <section className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Send us a Message
              </CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as
                possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Message sent successfully!
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    We've received your message and will get back to you within
                    24 hours.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">
                      Failed to send message
                    </span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Please try again or contact us through one of the other
                    support options.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name and Email Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (Optional)</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                {/* Category and Priority Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleInputChange('category', value)
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        handleInputChange('priority', value)
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem
                            key={priority.value}
                            value={priority.value}
                          >
                            {priority.label} - {priority.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Brief description of your issue"
                    value={formData.subject}
                    onChange={(e) =>
                      handleInputChange('subject', e.target.value)
                    }
                    required
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Please provide as much detail as possible about your issue or question..."
                    value={formData.message}
                    onChange={(e) =>
                      handleInputChange('message', e.target.value)
                    }
                    rows={6}
                    required
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Response Time Information */}
        <section className="text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Response Times</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Urgent issues:</span>
                  <Badge variant="destructive">~2 hours</Badge>
                </div>
                <div className="flex justify-between">
                  <span>High priority:</span>
                  <Badge variant="secondary">~4 hours</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Normal priority:</span>
                  <Badge variant="outline">~24 hours</Badge>
                </div>
                <div className="flex justify-between">
                  <span>General questions:</span>
                  <Badge variant="outline">~48 hours</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Information */}
        <section className="text-center border-t pt-6">
          <h3 className="font-semibold mb-4">Other Ways to Reach Us</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="text-sm">support@uvian.com</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span className="text-sm">+1 (555) 123-4567</span>
            </div>
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}
