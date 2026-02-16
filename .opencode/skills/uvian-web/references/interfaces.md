
# Interface Composition System
Interfaces are the standard building block of the application, they encapsulate and orcheastrate client side react behaviour, fetch data, perform updates, mounts hooks. They are almost always placed inside pages but can appear in panels, dialogs etc.

## 1. Core Hierarchy
All interfaces must follow this strict DOM nesting to ensure consistent scroll behavior and spacing:
1. `InterfaceLayout`: The absolute root. Provides the `ScrollArea`.
2. `InterfaceContainer`: The visual boundary. Sets the max-width (`size`) and card style (`variant`).
3. `InterfaceHeader` OR `InterfaceBanner`: Top-level branding/navigation.
4. `InterfaceContent`: The primary data area.
5. `InterfaceFooter`: Sticky or static actions at the bottom.

## 2. Layout Patterns

### A. The "Layered Overlap" Pattern (Discord/Social Style)
Used for profiles or entity cards where an avatar overlaps a banner.
* **Structure:**
    1. `InterfaceContainer` must have `spacing="none"` and `variant="card"`.
    2. `InterfaceBanner` is the first child.
    3. `InterfaceContent` follows with `spacing="compact"` and `className="pt-0"`.
    4. **The Overlap:** Wrap the Avatar in a `div` with `-mt-{size}` (usually `-mt-12`) to pull it into the banner. The Avatar must have a thick border matching the background color (`border-card` or `border-background`).

### B. The "Standard Dashboard" Pattern
Used for settings, forms, or data views.
* **Structure:**
    1. `InterfaceHeader` with `InterfaceHeaderContent` (title/subtitle/actions).
    2. `Separator`.
    3. `InterfaceContent` with `spacing="default"`.
    4. Multiple `InterfaceSection` components to group logic.

### C. The "Card-in-Card" Pattern (Mutuals/List Groups)
Used to group related links or metadata rows.
* **Structure:** Use `InterfaceSection variant="card"` with `className="p-0 overflow-hidden"`. 
* **Rows:** Use buttons or divs with `w-full flex justify-between p-3 hover:bg-muted`.
* **Dividers:** Use `Separator` between rows inside the section.

## 3. Component-Specific Rules

### InterfaceBanner
* **Gradients:** Use standard CSS directions in the `gradientDirection` prop (e.g., `to top`, `to right`). 
* **Solid Colors:** For solid branding colors, set `gradientFrom` and `gradientTo` to the same hex code and set `gradientOpacity={1}`.
* **Placement:** Always placed above `InterfaceContent`.

### InterfaceSection
* Use `variant="separated"` for long-form content to automatically handle borders and top-padding.
* Use `variant="card"` for high-density metadata or interactive lists.

### InterfaceContent
* If the section starts with a banner, always use `pt-0`.
* Default to `spacing="compact"` for "Card" views and `spacing="default"` for "Full Page" views.

## 4. Visual Styles & Physics
* **Borders:** Use the `Separator` component rather than manual border-bottoms.
* **Typography:** 
    * Main Titles: Use `h1` inside `InterfaceHeaderContent`.
    * Section Headers: Use the `title` prop on `InterfaceSection`.
    * Metadata Labels: Use `text-[10px] uppercase font-bold tracking-wider text-muted-foreground`.
* **Interactive Rows:** Any list item inside an `InterfaceSection` should have a hover state: `transition-colors hover:bg-accent/50`.

## 5. Constraint Checklist for Agents
* [ ] Is `InterfaceLayout` the root?
* [ ] If there is a banner, is the container spacing set to `none`?
* [ ] Are avatars using negative top margins for overlap?
* [ ] Are list groups wrapped in a `p-0` variant="card" section?
* [ ] Is `InterfaceHeaderContent` used for the page title?

---

### Implementation Example (Reference Blueprint)
```tsx
<InterfaceLayout>
  <InterfaceContainer variant="card" size="compact" spacing="none">
    <InterfaceBanner height="sm" gradientFrom="#COLOR" gradientTo="#COLOR" gradientOpacity={1} />
    <InterfaceContent spacing="compact" className="pt-0">
      <div className="-mt-12 relative z-10">
        <Avatar className="border-[6px] border-card" />
      </div>
      <InterfaceSection title="Section" variant="card" className="p-0 overflow-hidden">
        {/* Row Pattern */}
        <div className="flex justify-between p-3 hover:bg-muted">
           <span>Label</span>
           <ChevronRight />
        </div>
      </InterfaceSection>
    </InterfaceContent>
  </InterfaceContainer>
</InterfaceLayout>
```