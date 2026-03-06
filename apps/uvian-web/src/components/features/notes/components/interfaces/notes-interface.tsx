'use client';

import * as React from 'react';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
} from '~/components/shared/ui/interfaces';
import { NotesList } from './notes-list';

interface NotesInterfaceProps {
  spaceId: string;
}

export function NotesInterface({ spaceId }: NotesInterfaceProps) {
  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader>
          <InterfaceHeaderContent title="Notes" />
        </InterfaceHeader>
        <InterfaceContent>
          <NotesList spaceId={spaceId} />
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
