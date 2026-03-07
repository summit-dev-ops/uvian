import React, { Suspense } from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageWrapper,
  PageWrapperContent,
  PageWrapperSidebar
} from '~/components/shared/ui/pages/page-container';
import { PageModals } from '~/components/shared/ui/modals/page-modals';
import { PostDetailPageBreadcrumb } from '~/components/features/posts/components/pages/breadcrumbs/post-detail-page-breadcrumb';
import { PostDetailInterface } from '~/components/features/posts/components/interfaces/post-detail-interface';
import { ModalProvider } from '~/components/shared/ui/modals';
import {
  PostDetailPageActionProvider,
  PostDetailPageActions,
} from '~/components/features/posts/components/pages/actions/post-detail-page-action-provider';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ spaceId: string; postId: string }>;
}) {
  const { spaceId, postId } = await params;

  return (
    <ModalProvider>
      <PostDetailPageActionProvider spaceId={spaceId} postId={postId}>
        <PageWrapper>
          <PageWrapperSidebar/>
          <PageWrapperContent>
            <PageContainer
              size={'full'}
              className="flex flex-1 flex-col min-h-0 relative"
            >
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <PostDetailPageBreadcrumb spaceId={spaceId} postId={postId} />
                <PageActions>
                  <PostDetailPageActions />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <Suspense fallback={<div>Loading post...</div>}>
                  <PostDetailInterface spaceId={spaceId} postId={postId} />
                </Suspense>
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </PostDetailPageActionProvider>
    </ModalProvider>
  );
}
