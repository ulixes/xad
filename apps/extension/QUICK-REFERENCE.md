# Neo Brutalism Quick Reference

## 🚀 Quick Start

### Add New Component
```bash
bunx shadcn@latest add [component-name]
```

### Essential Classes
```tsx
// Shadows (brutalist signature)
className="shadow-sm"     // Light shadow
className="shadow-md"     // Medium shadow  
className="shadow-lg"     // Heavy shadow

// Colors
className="bg-primary text-primary-foreground"    // Red button
className="bg-secondary text-secondary-foreground" // Yellow button
className="bg-destructive text-destructive-foreground" // Black button

// Borders (always thick)
className="border-2"      // Standard
className="border-4"      // Extra thick

// Typography
className="font-sans font-semibold"  // DM Sans bold
className="font-mono"                // Space Mono
```

### Component Templates

#### Basic Card
```tsx
<Card className="shadow-md border-2">
  <CardHeader className="border-b-2">
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent className="p-6 space-y-4">
    Content
  </CardContent>
</Card>
```

#### Action Button
```tsx
<Button className="shadow-sm border-2">
  Action
</Button>
```

#### Status Badge
```tsx
<Badge variant="destructive" className="shadow-xs">
  Status
</Badge>
```

## 🎨 Color Palette

| Usage | Light | Dark | Class |
|-------|-------|------|-------|
| Primary | `#ff3333` | `#ff6666` | `bg-primary` |
| Secondary | `#ffff00` | `#ffff33` | `bg-secondary` |
| Accent | `#0066ff` | `#3399ff` | `bg-accent` |
| Destructive | `#000000` | `#ffffff` | `bg-destructive` |

## 🔧 Build Commands

```bash
# Development
bun run dev

# Production build
bun run build

# Add component
bunx shadcn@latest add [component]
```

## ⚡ Key Rules

1. **Always use shadows** - `shadow-sm` minimum
2. **No rounded corners** - avoid `rounded-*`
3. **Thick borders** - `border-2` or higher  
4. **High contrast** - primary/secondary colors
5. **Sharp typography** - `font-semibold` preferred

## 🐛 Quick Fixes

**Styles not working?**
```bash
bun run build  # Rebuild
```

**Component looks wrong?**
- Check `className` has `shadow-*`
- Use `border-2` minimum
- Avoid `rounded-*` classes

**Colors not showing?**
- Use semantic classes: `bg-primary`, not `bg-red-500`
- Check light/dark mode variables