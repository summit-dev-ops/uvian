'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Shield, UserX, Trash2, Users } from 'lucide-react';

import {
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@org/ui';
import { ConversationMemberRole, ConversationMemberUI } from '~/lib/domains/chat/types';
import { useActionManager } from '~/components/shared/actions/hooks/use-action-manager';
import { createTableSelectionState } from '~/components/shared/actions/utils/create-selection-state';
import { ActionToolbar } from '~/components/shared/actions/ui/action-toolbar';
import type { ActionConfig } from '~/components/shared/actions/types/action-manager';
import { MODAL_IDS, usePageActionContext } from '~/components/shared/page-actions/page-action-context';

interface MemberDataTableProps {
  data: ConversationMemberUI[];
  isAdmin: boolean;
  onRemove: (profileId: string) => void;
  onUpdateRole: (profileId: string, role: ConversationMemberRole["name"]) => void;
}

export function MemberDataTable({
  data,
  isAdmin,
  onRemove,
  onUpdateRole,
}: MemberDataTableProps) {
  const context = usePageActionContext();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const handleInviteMember = React.useCallback(async () => {
    context.openModal(MODAL_IDS.INVITE_MEMBERS);
  }, [context]);

  // Configure actions for member management
  const memberActions: ActionConfig<ConversationMemberUI>[] =
    React.useMemo(() => {
      if (!isAdmin) return [];

      return [
        {
          id: 'inviteMember',
          label: 'Invite Member',
          variant: 'prominent',
          group: 'member-management',
          visibility: {
            minSelection: 0,
            maxSelection: 0, // Only show when no items are selected
          },
          perform: async (selection, params, context) => {
            handleInviteMember()
          },
          icon: Users,
        },
        {
          id: 'promoteToAdmin',
          label: 'Promote to Admin',
          variant: 'prominent',
          group: 'member-management',
          visibility: {
            minSelection: 1,
            selectionValidator: (selection) =>
              selection.selectedItems.some(
                (member) => member.role?.name !== 'admin'
              ),
          },
          perform: async (selection, params, context) => {
            const promises = selection.selectedItems.map((member) =>
              onUpdateRole(member.profileId, 'admin')
            );
            await Promise.all(promises);
          },
          icon: Shield,
        },
        {
          id: 'demoteToMember',
          label: 'Demote to Member',
          variant: 'standard',
          group: 'member-management',
          visibility: {
            minSelection: 1,
            selectionValidator: (selection) =>
              selection.selectedItems.some(
                (member) => member.role?.name === 'admin'
              ),
          },
          perform: async (selection, params, context) => {
            const promises = selection.selectedItems.map((member) =>
              onUpdateRole(member.profileId, 'member')
            );
            await Promise.all(promises);
          },
          icon: UserX,
        },
        {
          id: 'removeSelected',
          label: 'Remove Selected',
          variant: 'destructive',
          group: 'member-management',
          visibility: { requireSelection: true },
          perform: async (selection, params, context) => {
            const promises = selection.selectedItems.map((member) =>
              onRemove(member.profileId)
            );
            await Promise.all(promises);
          },
          icon: Trash2,
          requiresConfirmation: true,
        },
      ];
    }, [isAdmin, onRemove, onUpdateRole]);

  // Create selection state and integrate with action manager
  const selectionState = React.useMemo(
    () => createTableSelectionState(data, rowSelection),
    [data, rowSelection]
  );

  const { groupedActions, performAction } = useActionManager(
    selectionState,
    memberActions
  );

  const columns: ColumnDef<ConversationMemberUI>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'profileId',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Profile ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue('profileId')}</div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as any;
        return (
          <div className="capitalize">
            {typeof role === 'string' ? role : role?.name || 'Unknown'}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'))
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <ActionToolbar
        groupedActions={groupedActions}
        onAction={performAction}
        className="mb-4"
        layout="horizontal"
      >

        <h1 className="text-3xl font-bold">Edit Members</h1>
      </ActionToolbar>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
