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
import { SpacePostsPageBreadcrumb } from '~/components/features/posts/components/pages/breadcrumbs/space-posts-page-breadcrumb';
import { PostsInterface } from '~/components/features/posts/components/interfaces/posts-interface';
import { ModalProvider } from '~/components/shared/ui/modals';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import {
  PostsPageActionProvider,
  PostsPageActions,
} from '~/components/features/posts/components/pages/actions';

export default async function SpacePostsPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;

  return (
    <ModalProvider>
      <PostsPageActionProvider spaceId={spaceId}>
        <PageWrapper>
          <PageWrapperSidebar/>
          <PageWrapperContent>
            <PageContainer
              size={'full'}
              className="flex flex-1 flex-col min-h-0 relative"
            >
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <SpacePostsPageBreadcrumb spaceId={spaceId} />
                <PageActions>
                  <PostsPageActions spaceId={spaceId} />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <Suspense fallback={<div>Loading posts...</div>}>
                  <PostsInterface spaceId={spaceId} />
                </Suspense>
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </PostsPageActionProvider>
    </ModalProvider>
  );
}
