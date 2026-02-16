'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Pause,
  ArrowLeft,
  MoreHorizontal,
  Copy,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import { Button } from '@org/ui';
import { Badge } from '@org/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@org/ui';
import { ScrollArea } from '@org/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@org/ui';

import { jobQueries } from '~/lib/domains/jobs/api/queries';
import { jobMutations } from '~/lib/domains/jobs/api/mutations';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
} from '~/components/shared/ui/interfaces/interface-layout';
import {
  InterfaceError,
  InterfaceLoading,
} from '~/components/shared/ui/interfaces';
import {
  getJobStatusInfo,
  formatJobDuration,
  formatJobType,
  canCancelJob,
  canRetryJob,
  canDeleteJob,
} from '~/lib/domains/jobs/utils';
import type { JobUI, JobStatus } from '~/lib/domains/jobs/types';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';

// ============================================================================
// Status Display Component
// ============================================================================

function JobStatusBadge({ status }: { status: JobStatus }) {
  const statusInfo = getJobStatusInfo(status);

  const iconMap = {
    queued: Clock,
    processing: Activity,
    completed: CheckCircle2,
    failed: XCircle,
    cancelled: Pause,
  };

  const Icon = iconMap[status];

  return (
    <Badge variant="outline" className={`${statusInfo.color} border-current`}>
      <Icon className="w-3 h-3 mr-1" />
      {statusInfo.label}
    </Badge>
  );
}

// ============================================================================
// Duration Display Component
// ============================================================================

function JobDuration({ job }: { job: JobUI }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (job.status === 'processing') {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [job.status]);

  const duration = React.useMemo(() => {
    const created = new Date(job.createdAt).getTime();
    const endTime = job?.completedAt && new Date(job?.completedAt).getTime();
    return endTime ? endTime - created : null;
  }, [job.createdAt, job.completedAt, job.status, now]);

  return (
    <div className="flex items-center space-x-2">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <span className="font-mono">
        {duration ? formatJobDuration(duration) : 'Running...'}
      </span>
    </div>
  );
}

// ============================================================================
// JSON Display Component
// ============================================================================

function JsonDisplay({
  data,
  title,
  emptyText = 'No data available',
}: {
  data: any;
  title: string;
  emptyText?: string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-muted-foreground text-sm italic">{emptyText}</div>
    );
  }

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{title}</h4>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(jsonString)}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>
      <ScrollArea
        className={`border rounded-md p-3 ${isExpanded ? 'h-96' : 'h-32'}`}
      >
        <pre className="text-sm font-mono whitespace-pre-wrap break-words">
          {jsonString}
        </pre>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface JobDetailViewProps {
  jobId: string;
}

export function JobInterface({ jobId }: JobDetailViewProps) {
  const { activeProfileId } = useUserSessionStore();
  const {
    data: job,
    isLoading,
    error,
  } = useQuery(jobQueries.detail(activeProfileId, jobId));
  const router = useRouter();
  const queryClient = useQueryClient();

  // Job mutations
  const cancelJobMutation = useMutation(jobMutations.cancelJob(queryClient));
  const retryJobMutation = useMutation(jobMutations.retryJob(queryClient));
  const deleteJobMutation = useMutation(jobMutations.deleteJob(queryClient));

  // Action handlers
  const handleBack = () => router.push('/jobs');
  const handleCancel = () =>
    cancelJobMutation.mutate({ authProfileId: activeProfileId, jobId });
  const handleRetry = () =>
    retryJobMutation.mutate({ authProfileId: activeProfileId, jobId });
  const handleDelete = () =>
    deleteJobMutation.mutate({ authProfileId: activeProfileId, jobId });

  // Early return for loading state
  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Job Details"
            subtitle="Loading job details..."
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceLoading
            variant="default"
            message="Loading job details..."
            size="lg"
            className="min-h-[400px]"
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Job Details"
            subtitle="Error loading job"
            actions={
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
            }
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            variant="card"
            title="Job Not Found"
            message={
              error.message ||
              "The job you're looking for doesn't exist or has been deleted."
            }
            showRetry={true}
            showHome={true}
            onRetry={handleBack}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  // Early return for null job data
  if (!job) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Job Details"
            subtitle="Job data unavailable"
            actions={
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
            }
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            variant="card"
            title="Job Not Found"
            message="The job data is unavailable."
            showRetry={true}
            showHome={true}
            onRetry={handleBack}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  const statusInfo = getJobStatusInfo(job.status);

  return (
    <InterfaceLayout>
      <InterfaceHeader spacing="compact">
        <InterfaceHeaderContent
          title="Job Details"
          subtitle={`Job ID: ${job.id}`}
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Jobs
                </DropdownMenuItem>
                {canCancelJob(job.status) && (
                  <DropdownMenuItem
                    onClick={handleCancel}
                    className="text-destructive"
                    disabled={cancelJobMutation.isPending}
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    {cancelJobMutation.isPending
                      ? 'Cancelling...'
                      : 'Cancel Job'}
                  </DropdownMenuItem>
                )}
                {canRetryJob(job.status) && (
                  <DropdownMenuItem
                    onClick={handleRetry}
                    disabled={retryJobMutation.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {retryJobMutation.isPending ? 'Retrying...' : 'Retry Job'}
                  </DropdownMenuItem>
                )}
                {canDeleteJob(job.status) && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                    disabled={deleteJobMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteJobMutation.isPending ? 'Deleting...' : 'Delete Job'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          }
        >
          <div className="flex items-center space-x-3">
            <JobStatusBadge status={job.status} />
            <span className="text-sm text-muted-foreground">
              Type: {formatJobType(job.type)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(job.id)}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </InterfaceHeaderContent>
      </InterfaceHeader>
      <InterfaceContent spacing="default">
        {/* Status Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Status Information</span>
            </CardTitle>
            <CardDescription>{statusInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div>
                  <JobStatusBadge status={job.status} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Duration
                </label>
                <JobDuration job={job} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Created
                </label>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{job.createdAt.toLocaleString()}</span>
                </div>
              </div>
              {job.startedAt && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Started
                  </label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{job.startedAt.toLocaleString()}</span>
                  </div>
                </div>
              )}
              {job.completedAt && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {job.status === 'failed' ? 'Failed' : 'Completed'}
                  </label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{job.completedAt.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle>Input Data</CardTitle>
            </CardHeader>
            <CardContent>
              <JsonDisplay
                data={job.input}
                title="Job Input"
                emptyText="No input data provided"
              />
            </CardContent>
          </Card>

          {/* Output or Error */}
          <Card>
            <CardHeader>
              <CardTitle>
                {job.status === 'failed' ? 'Error Details' : 'Output Data'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {job.status === 'failed' && job.errorMessage ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Error Message</span>
                  </div>
                  <div className="p-3 border border-destructive/20 rounded-md bg-destructive/5">
                    <code className="text-sm">{job.errorMessage}</code>
                  </div>
                </div>
              ) : (
                <JsonDisplay
                  data={job.output}
                  title="Job Output"
                  emptyText="Job output will appear here when completed"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-muted-foreground">
                  Job ID
                </label>
                <div className="font-mono break-all">{job.id}</div>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">
                  Type
                </label>
                <div>{formatJobType(job.type)}</div>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">
                  Last Updated
                </label>
                <div>{job.updatedAt.toLocaleString()}</div>
              </div>
              {job.duration && (
                <div>
                  <label className="font-medium text-muted-foreground">
                    Total Duration
                  </label>
                  <div className="font-mono">
                    {formatJobDuration(job.duration)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </InterfaceContent>
    </InterfaceLayout>
  );
}
