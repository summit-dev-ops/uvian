'use client';

import * as React from 'react';
import {
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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@org/ui';
import { Button } from '@org/ui';
import { createJobColumns } from './job-columns';
import { useActionManager } from '~/components/shared/actions/hooks/use-action-manager';
import { createTableSelectionState } from '~/components/shared/actions/utils/create-selection-state';
import { ActionToolbar } from '~/components/shared/actions/ui/action-toolbar';
import type { ActionConfig } from '~/components/shared/actions/types/action-manager';
import { useJobsTable } from '../hooks/use-jobs-table';
import { useJobCreation } from '../hooks/use-job-creation';
import type { JobUI, JobFilters } from '~/lib/domains/jobs/types';
import {
  canCancelJob,
  canRetryJob,
  canDeleteJob,
} from '~/lib/domains/jobs/utils';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
} from '~/components/shared/ui/interfaces';

interface JobDataTableProps {
  filters?: JobFilters;
  onFiltersChange?: (filters: JobFilters) => void;
}

function useJobActions(
  jobs: JobUI[],
  onView: (jobId: string) => void,
  onCancel: (jobId: string) => void,
  onRetry: (jobId: string) => void,
  onDelete: (jobId: string) => void,
  openCreateModal: () => void
) {
  const jobActions: ActionConfig<JobUI>[] = React.useMemo(
    () => [
      {
        id: 'createJob',
        label: 'Create Job',
        variant: 'prominent',
        group: 'job-management',
        visibility: {
          minSelection: 0,
          maxSelection: 0,
        },
        perform: () => {
          openCreateModal();
        },
      },
      {
        id: 'cancelJobs',
        label: 'Cancel Selected',
        variant: 'destructive',
        group: 'job-management',
        visibility: {
          requireSelection: true,
        },
        selectionValidator: (selection: unknown) =>
          (selection as { selectedItems: JobUI[] }).selectedItems.every((job) =>
            canCancelJob(job.status)
          ),
        perform: async (selection: unknown) => {
          const selectedItems = (selection as { selectedItems: JobUI[] })
            .selectedItems;
          const promises = selectedItems.map((job) => onCancel(job.id));
          await Promise.all(promises);
        },
      },
      {
        id: 'retryJobs',
        label: 'Retry Selected',
        variant: 'standard',
        group: 'job-management',
        visibility: {
          requireSelection: true,
        },
        selectionValidator: (selection: unknown) =>
          (selection as { selectedItems: JobUI[] }).selectedItems.every((job) =>
            canRetryJob(job.status)
          ),
        perform: async (selection: unknown) => {
          const selectedItems = (selection as { selectedItems: JobUI[] })
            .selectedItems;
          const promises = selectedItems.map((job) => onRetry(job.id));
          await Promise.all(promises);
        },
      },
      {
        id: 'deleteJobs',
        label: 'Delete Selected',
        variant: 'destructive',
        group: 'job-management',
        visibility: {
          requireSelection: true,
        },
        selectionValidator: (selection: unknown) =>
          (selection as { selectedItems: JobUI[] }).selectedItems.every((job) =>
            canDeleteJob(job.status)
          ),
        perform: async (selection: unknown) => {
          const selectedItems = (selection as { selectedItems: JobUI[] })
            .selectedItems;
          const promises = selectedItems.map((job) => onDelete(job.id));
          await Promise.all(promises);
        },
        requiresConfirmation: true,
      },
    ],
    [onView, onCancel, onRetry, onDelete]
  );

  return jobActions;
}

export function JobDataTable({ filters, onFiltersChange }: JobDataTableProps) {
  const {
    jobs,
    isLoading,
    onView,
    onCancel,
    onRetry,
    onDelete,
    refetch,
    isRefetching,
  } = useJobsTable(filters);

  const { openModal: openCreateModal } = useJobCreation({
    onCreated: refetch,
  });

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns = React.useMemo(
    () => createJobColumns(onView, onCancel, onRetry, onDelete),
    [onView, onCancel, onRetry, onDelete]
  );

  const jobActions = useJobActions(
    jobs,
    onView,
    onCancel,
    onRetry,
    onDelete,
    openCreateModal
  );

  const selectionState = React.useMemo(
    () => createTableSelectionState(jobs, rowSelection),
    [jobs, rowSelection]
  );

  const { groupedActions, performAction } = useActionManager(
    selectionState,
    jobActions
  );

  const table = useReactTable({
    data: jobs,
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

  const handleRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const totalJobs = table.getFilteredRowModel().rows.length;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const subtitle =
    selectedCount > 0
      ? `${selectedCount} of ${totalJobs} selected`
      : `${totalJobs} job${totalJobs !== 1 ? 's' : ''}`;

  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader>
          <InterfaceHeaderContent title="Jobs" subtitle="Loading..." />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading jobs...</p>
            </div>
          </div>
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceHeader>
        <InterfaceHeaderContent
          title="Jobs"
          subtitle={subtitle}
          actions={
            <Button
              onClick={handleRefresh}
              disabled={isRefetching}
              variant="outline"
              size="sm"
            >
              {isRefetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          }
        />
      </InterfaceHeader>

      <InterfaceContent spacing="compact">
        <ActionToolbar
          groupedActions={groupedActions}
          onAction={performAction}
          layout="horizontal"
        />
      </InterfaceContent>

      <InterfaceContent spacing="default">
        <div className="rounded-md border">
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="text-center">
                      <p className="text-lg font-medium">No jobs found</p>
                      <p className="text-muted-foreground">
                        Create a new job to get started
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex gap-2">
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
      </InterfaceContent>
    </InterfaceLayout>
  );
}
