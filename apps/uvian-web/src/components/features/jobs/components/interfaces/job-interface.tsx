'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Pause,
  MoreHorizontal,
  Copy,
  RefreshCw,
  Trash2,
  ArrowLeft,
} from 'lucide-react';

import { Button } from '@org/ui';
import { Badge } from '@org/ui';
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
  InterfaceContainer,
} from '~/components/shared/ui/interfaces/interface-layout';
import {
  InterfaceError,
  InterfaceLoading,
  InterfaceSection,
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
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <span className="font-mono">
        {duration ? formatJobDuration(duration) : 'Running...'}
      </span>
    </div>
  );
}

function JsonDisplay({
  data,
  title,
  emptyText = 'No data available',
}: {
  data: unknown;
  title: string;
  emptyText?: string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!data || Object.keys(data as object).length === 0) {
    return (
      <div className="text-muted-foreground text-sm italic">{emptyText}</div>
    );
  }

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{title}</h4>
        <div className="flex gap-2">
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

interface JobDetailViewProps {
  jobId: string;
}

export function JobInterface({ jobId }: JobDetailViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: job,
    isLoading,
    error,
    refetch,
  } = useQuery(jobQueries.detail(jobId));

  const cancelJobMutation = useMutation(jobMutations.cancelJob(queryClient));
  const retryJobMutation = useMutation(jobMutations.retryJob(queryClient));
  const deleteJobMutation = useMutation(jobMutations.deleteJob(queryClient));

  const handleBack = () => router.push('/jobs');
  const handleCancel = () => cancelJobMutation.mutate({ jobId });
  const handleRetry = () => retryJobMutation.mutate({ jobId });
  const handleDelete = () => deleteJobMutation.mutate({ jobId });

  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent title="Job" subtitle="Loading..." />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceLoading message="Loading job..." />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  if (error || !job) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Job"
            subtitle="Error"
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
            title="Job Not Found"
            message={
              error?.message || "The job doesn't exist or has been deleted."
            }
            showRetry={true}
            onRetry={() => refetch()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  const statusInfo = getJobStatusInfo(job.status);

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Job"
            subtitle={statusInfo.description}
            actions={
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <JobStatusBadge status={job.status} />
                  <span className="text-sm text-muted-foreground">
                    {formatJobType(job.type)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(job.id)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      suppressHydrationWarning
                    >
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
                        {retryJobMutation.isPending
                          ? 'Retrying...'
                          : 'Retry Job'}
                      </DropdownMenuItem>
                    )}
                    {canDeleteJob(job.status) && (
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive"
                        disabled={deleteJobMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deleteJobMutation.isPending
                          ? 'Deleting...'
                          : 'Delete Job'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            }
          />
        </InterfaceHeader>

        <InterfaceContent spacing="default">
          <InterfaceSection>
            <h3 className="text-sm font-medium mb-4">Status Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Status
                </label>
                <div className="mt-1">
                  <JobStatusBadge status={job.status} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Duration
                </label>
                <div className="mt-1">
                  <JobDuration job={job} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Created
                </label>
                <div className="mt-1 text-sm">
                  {new Date(job.createdAt).toLocaleString()}
                </div>
              </div>
              {job.startedAt && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Started
                  </label>
                  <div className="mt-1 text-sm">
                    {new Date(job.startedAt).toLocaleString()}
                  </div>
                </div>
              )}
              {job.completedAt && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    {job.status === 'failed' ? 'Failed' : 'Completed'}
                  </label>
                  <div className="mt-1 text-sm">
                    {new Date(job.completedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </InterfaceSection>

          <InterfaceSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <JsonDisplay
                  data={job.input}
                  title="Input Data"
                  emptyText="No input data provided"
                />
              </div>
              <div>
                {job.status === 'failed' && job.errorMessage ? (
                  <div>
                    <h4 className="font-medium mb-2">Error Details</h4>
                    <div className="flex items-center gap-2 text-destructive mb-2">
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
                    title="Output Data"
                    emptyText="Job output will appear here when completed"
                  />
                )}
              </div>
            </div>
          </InterfaceSection>

          <InterfaceSection>
            <h3 className="text-sm font-medium mb-4">Technical Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Job ID
                </label>
                <div className="mt-1 font-mono break-all">{job.id}</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Type
                </label>
                <div className="mt-1 capitalize">{formatJobType(job.type)}</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Last Updated
                </label>
                <div className="mt-1">
                  {new Date(job.updatedAt).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total Duration
                </label>
                <div className="mt-1 font-mono">
                  {formatJobDuration(
                    new Date(job.createdAt).getTime() - Date.now()
                  )}
                </div>
              </div>
            </div>
          </InterfaceSection>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
