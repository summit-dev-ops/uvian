'use client';

import * as React from 'react';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
} from '~/components/shared/ui/interfaces';
import { PostList } from '../post-list';

interface PostsInterfaceProps {
  spaceId: string;
}

export function PostsInterface({ spaceId }: PostsInterfaceProps) {
  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader>
          <InterfaceHeaderContent title="Posts" />
        </InterfaceHeader>
        <InterfaceContent>
          <PostList spaceId={spaceId} />
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
