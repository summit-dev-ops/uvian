import { computePosition, flip, shift } from '@floating-ui/dom';
import { posToDOMRect, ReactRenderer } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import type {
  SuggestionProps,
  SuggestionKeyDownProps,
} from '@tiptap/suggestion';
import { QueryClient } from '@tanstack/react-query';
import MentionList from './mention-list';
import { chatQueries } from '~/lib/domains/chat/api';
import { profileQueries } from '~/lib/domains/profile/api';

const updatePosition = (editor: Editor, element: HTMLElement) => {
  const virtualElement = {
    getBoundingClientRect: () =>
      posToDOMRect(
        editor.view,
        editor.state.selection.from,
        editor.state.selection.to
      ),
  };

  computePosition(virtualElement, element, {
    placement: 'bottom-start',
    strategy: 'absolute',
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    element.style.width = 'max-content';
    element.style.position = strategy;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  });
};

// FACTORY FUNCTION
export const createSuggestionConfig = (
  queryClient: QueryClient,
  authProfileId: string | undefined,
  { conversationId }: { conversationId: string }
) => ({
  items: async ({ query }: { query: string }) => {
    const conversationMembers = await queryClient.fetchQuery(
      chatQueries.conversationMembers(authProfileId, conversationId)
    );
    const conversationMembersProfiles = await Promise.all(
      conversationMembers.map((member) =>
        queryClient.fetchQuery(profileQueries.profile(member.profileId))
      )
    );
    const conversationMembersWithProfiles = conversationMembers.map(
      (member, index) => ({
        ...member,
        profile: conversationMembersProfiles[index],
      })
    );

    return conversationMembersWithProfiles;
  },

  render: () => {
    let component: any;

    return {
      onStart: (props: SuggestionProps) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) return;

        component.element.style.position = 'absolute';
        component.element.style.zIndex = '50'; // Ensure it's above other elements
        document.body.appendChild(component.element);

        updatePosition(props.editor, component.element);
      },

      onUpdate(props: SuggestionProps) {
        component.updateProps(props);
        if (!props.clientRect) return;
        updatePosition(props.editor, component.element);
      },

      onKeyDown(props: SuggestionKeyDownProps) {
        if (props.event.key === 'Escape') {
          component.destroy();
          return true;
        }
        return component.ref?.onKeyDown(props);
      },

      onExit() {
        if (component) {
          component.element.remove();
          component.destroy();
        }
      },
    };
  },
});
