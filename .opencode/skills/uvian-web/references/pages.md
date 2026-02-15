# Pages

Pages are the pages that are mounted within a standard NextJs route page. We have two types of pages. 

1. Dashboard pages
2. Standalone pages

ALL PAGES ARE SERVER SIDE. You must always define an interface components that are client side to actually mount the content.

## Dashboard pages
Dashboard pages live within layouts that surrond the page with a sidebar. These pages need to follow very strict structures. To make this easier we have a special folder that provides helper components: `apps/uvian-web/src/components/shared/ui/pages`

## Standalone pages
Standalone pages are less defined. They should try to use the helper components: `apps/uvian-web/src/components/shared/ui/pages` from but are not required to mount the header. They are meant for starker pages like `sign-up` or onboarding.
