/**
 * Job Data Table Column Definitions
 *
 * Defines columns for the job management data table following TanStack React Table patterns.
 */

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Clock, Play, Pause, MoreHorizontal } from 'lucide-react';
import { Button } from '@org/ui';
import { Checkbox } from '@org/ui';
import { Badge } from '@org/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@org/ui';
import {
  formatJobDuration,
  getRelativeTime,
  getJobStatusInfo,
  canCancelJob,
  canRetryJob,
  canDeleteJob,
} from '~/lib/domains/jobs/utils';
import type { JobUI } from '~/lib/domains/jobs/types';

// ============================================================================
// Column Types
// ============================================================================

/**
 * Props for job action cell
 */
interface JobActionCellProps {
  job: JobUI;
  onView: (jobId: string) => void;
  onCancel: (jobId: string) => void;
  onRetry: (jobId: string) => void;
  onDelete: (jobId: string) => void;
}

/**
 * Props for job status badge cell
 */
interface JobStatusCellProps {
  job: JobUI;
}

/**
 * Props for job duration cell
 */
interface JobDurationCellProps {
  job: JobUI;
}

// ============================================================================
// Cell Components
// ============================================================================

/**
 * Job Status Badge Cell Component
 */
function JobStatusCell({ job }: JobStatusCellProps) {
  const statusInfo = getJobStatusInfo(job.status);

  return (
    <Badge
      variant="outline"
      className={`capitalize font-medium ${statusInfo.color}`}
    >
      {statusInfo.label}
    </Badge>
  );
}

/**
 * Job Duration Cell Component
 */
function JobDurationCell({ job }: JobDurationCellProps) {
  if (!job.duration && job.status === 'processing') {
    return (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Running...</span>
      </div>
    );
  }

  return (
    <div className="text-sm">
      {job.duration ? formatJobDuration(job.duration) : '-'}
    </div>
  );
}

/**
 * Job Actions Cell Component
 */
function JobActionCell({
  job,
  onView,
  onCancel,
  onRetry,
  onDelete,
}: JobActionCellProps) {
  const canView = true; // Always can view job details
  const canCancel = canCancelJob(job.status);
  const canRetry = canRetryJob(job.status);
  const canDelete = canDeleteJob(job.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(job.id)} disabled={!canView}>
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onCancel(job.id)}
          disabled={!canCancel}
          className="text-orange-600"
        >
          <Pause className="h-4 w-4 mr-2" />
          Cancel Job
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRetry(job.id)}
          disabled={!canRetry}
          className="text-blue-600"
        >
          <Play className="h-4 w-4 mr-2" />
          Retry Job
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(job.id)}
          disabled={!canDelete}
          className="text-red-600"
        >
          Delete Job
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Column Definitions
// ============================================================================

/**
 * Create column definitions for the job data table
 */
export function createJobColumns(
  onView: (jobId: string) => void,
  onCancel: (jobId: string) => void,
  onRetry: (jobId: string) => void,
  onDelete: (jobId: string) => void
): ColumnDef<JobUI>[] {
  return [
    // Selection checkbox for bulk operations
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all jobs"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select job ${row.original.id}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // Job ID column
    {
      accessorKey: 'id',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Job ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const jobId = row.getValue('id') as string;
        return (
          <button
            onClick={() => onView(jobId)}
            className="font-mono text-sm text-blue-600 hover:underline text-left"
          >
            {jobId.slice(0, 8)}...
          </button>
        );
      },
    },

    // Job type column
    {
      accessorKey: 'type',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <div className="capitalize font-medium">{type.replace('-', ' ')}</div>
        );
      },
    },

    // Job status column
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const job = row.original;
        return <JobStatusCell job={job} />;
      },
    },

    // Created date column
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return (
          <div className="text-sm">
            <div>{date.toLocaleDateString()}</div>
            <div className="text-muted-foreground text-xs">
              {getRelativeTime(date)}
            </div>
          </div>
        );
      },
    },

    // Duration column
    {
      accessorKey: 'duration',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Duration
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const job = row.original;
        return <JobDurationCell job={job} />;
      },
    },

    // Actions column
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const job = row.original;
        return (
          <JobActionCell
            job={job}
            onView={onView}
            onCancel={onCancel}
            onRetry={onRetry}
            onDelete={onDelete}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
