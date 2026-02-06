'use client';

import * as React from 'react';
import { MoreHorizontal, AlertTriangle } from 'lucide-react';
import { cn } from '@org/ui';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@org/ui';
import type {
  ActionGroupProps,
  ActionButtonProps,
  ActionToolbarProps,
} from '../types/action-manager';

/**
 * Individual action button component
 */
function ActionButton<TItem, TParams = any>({
  action,
  isLoading = false,
  onClick,
  size = 'sm',
}: ActionButtonProps<TItem, TParams>) {
  const Icon = action.icon;

  const buttonVariant =
    action.variant === 'destructive'
      ? 'destructive'
      : action.variant === 'prominent'
      ? 'default'
      : 'outline';

  return (
    <Button
      size={size as any}
      variant={buttonVariant}
      onClick={onClick}
      disabled={isLoading || action.disabled}
      className={cn(
        action.variant === 'prominent' && 'font-semibold',
        action.variant === 'destructive' && 'text-destructive-foreground'
      )}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {action.label}
      {action.requiresConfirmation && (
        <AlertTriangle className="ml-2 h-3 w-3" />
      )}
    </Button>
  );
}

/**
 * Group of actions rendered as a horizontal toolbar
 */
function ActionGroup<TItem, TParams = any>({
  name,
  actions,
  isLoading = false,
  onAction,
  layout = 'horizontal',
}: ActionGroupProps<TItem, TParams>) {
  // Separate actions by priority for better UX
  const prominentActions = actions.filter((a) => a.variant === 'prominent');
  const standardActions = actions.filter((a) => a.variant === 'standard');
  const destructiveActions = actions.filter((a) => a.variant === 'destructive');

  // If layout is dropdown, group all non-prominent actions into a dropdown
  if (
    layout === 'dropdown' ||
    (prominentActions.length === 0 && actions.length > 1)
  ) {
    const primaryAction = actions[0];
    const secondaryActions = actions.slice(1);

    return (
      <div className="flex items-center space-x-2">
        {primaryAction && (
          <ActionButton
            action={primaryAction}
            isLoading={isLoading}
            onClick={() => onAction(primaryAction.id)}
            size="sm"
          />
        )}
        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{name} Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {secondaryActions.map((action) => (
                <DropdownMenuItem
                  key={action.id}
                  onClick={() => onAction(action.id)}
                  disabled={isLoading || action.disabled}
                >
                  {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                  {action.label}
                  {action.requiresConfirmation && (
                    <AlertTriangle className="ml-2 h-3 w-3" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // Horizontal layout - render all actions as buttons
  return (
    <div className="flex items-center space-x-2">
      {prominentActions.map((action) => (
        <ActionButton
          key={action.id}
          action={action}
          isLoading={isLoading}
          onClick={() => onAction(action.id)}
          size="sm"
        />
      ))}

      {standardActions.length > 0 && destructiveActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{name} Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {standardActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => onAction(action.id)}
                disabled={isLoading || action.disabled}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
                {action.requiresConfirmation && (
                  <AlertTriangle className="ml-2 h-3 w-3" />
                )}
              </DropdownMenuItem>
            ))}
            {destructiveActions.length > 0 && <DropdownMenuSeparator />}
            {destructiveActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => onAction(action.id)}
                disabled={isLoading || action.disabled}
                className="text-destructive focus:text-destructive"
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
                {action.requiresConfirmation && (
                  <AlertTriangle className="ml-2 h-3 w-3" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Render remaining standard actions as buttons if no dropdown needed */}
      {standardActions.length > 0 &&
        destructiveActions.length === 0 &&
        standardActions.length <= 2 &&
        standardActions.map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            isLoading={isLoading}
            onClick={() => onAction(action.id)}
            size="sm"
            variant="outline"
          />
        ))}

      {/* Render destructive actions as buttons if few and prominent */}
      {destructiveActions.length > 0 &&
        destructiveActions.length === 1 &&
        prominentActions.length === 0 &&
        destructiveActions.map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            isLoading={isLoading}
            onClick={() => onAction(action.id)}
            size="sm"
          />
        ))}
    </div>
  );
}

/**
 * Main ActionToolbar component that renders groups of actions
 */
export function ActionToolbar<TItem, TParams = any>({
  groupedActions,
  onAction,
  isLoading = false,
  className,
  layout = 'horizontal',
}: ActionToolbarProps<TItem, TParams>) {
  const groupNames = Object.keys(groupedActions);

  if (groupNames.length === 0) {
    return null;
  }

  // For vertical layout, stack groups vertically
  if (layout === 'vertical') {
    return (
      <div className={cn('flex flex-col space-y-2', className)}>
        {groupNames.map((groupName) => (
          <ActionGroup
            key={groupName}
            name={groupName}
            actions={groupedActions[groupName]}
            isLoading={isLoading}
            onAction={onAction || (() => {})}
            layout={layout}
          />
        ))}
      </div>
    );
  }

  // Default horizontal layout
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center space-x-4">
        {groupNames.map((groupName) => (
          <ActionGroup
            key={groupName}
            name={groupName}
            actions={groupedActions[groupName]}
            isLoading={isLoading}
            onAction={onAction || (() => {})}
            layout={layout}
          />
        ))}
      </div>
    </div>
  );
}
