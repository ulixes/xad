# Neo Brutalism Theme Documentation

## Overview

This project implements a **Neo Brutalism** design system using **shadcn/ui** components with **Tailwind CSS v4** and the **@tailwindcss/vite** plugin. The theme provides a bold, high-contrast aesthetic with sharp edges, offset black shadows, and vibrant colors.

## 🎨 Theme Characteristics

### Visual Style
- **Zero border radius** - All components have sharp, square edges
- **Offset black shadows** - 4px offset drop shadows for depth
- **High contrast colors** - Bold reds, yellows, and blues
- **Thick black borders** - Strong visual boundaries
- **Brutalist typography** - DM Sans and Space Mono fonts

### Color Palette

#### Light Mode
```css
--primary: #ff3333        /* Bright red */
--primary-foreground: #ffffff
--secondary: #ffff00      /* Bright yellow */
--secondary-foreground: #000000
--accent: #0066ff         /* Blue */
--accent-foreground: #ffffff
--destructive: #000000    /* Black (very brutalist!) */
--destructive-foreground: #ffffff
--background: #ffffff
--foreground: #000000
--border: #000000         /* Black borders everywhere */
--muted: #f0f0f0
--muted-foreground: #333333
```

#### Dark Mode
```css
--primary: #ff6666        /* Lighter red for dark mode */
--secondary: #ffff33      /* Lighter yellow for dark mode */
--accent: #3399ff         /* Lighter blue for dark mode */
--destructive: #ffffff    /* White destructive on dark */
--background: #000000
--foreground: #ffffff
--border: #ffffff         /* White borders on dark */
```

## 🛠️ Technical Setup

### Architecture
- **Framework**: WXT (Web Extension Toolkit) 
- **Build Tool**: Vite 7.1.3 (used internally by WXT)
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS v4 with @tailwindcss/vite plugin
- **Theme Source**: [tweakcn Neo Brutalism theme](https://tweakcn.com/editor/theme)

### File Structure
```
src/
├── styles/
│   └── globals.css           # Main theme configuration
├── components/
│   ├── ui/                   # shadcn/ui base components
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   └── separator.tsx
│   └── TaskPanel.tsx         # Custom application components
├── lib/
│   └── utils.ts              # cn() utility function
wxt.config.ts                 # WXT configuration with Tailwind plugin
components.json               # shadcn/ui configuration
tsconfig.json                 # TypeScript paths configuration
```

### Configuration Files

#### 1. WXT Configuration (`wxt.config.ts`)
```typescript
import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  // ... manifest config
});
```

#### 2. Theme Configuration (`src/styles/globals.css`)
```css
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));

:root {
  /* Color variables */
  /* Shadow variables - key to brutalist look */
  --shadow-sm: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  /* Typography */
  --font-sans: DM Sans, sans-serif;
  --font-mono: Space Mono, monospace;
  /* Zero radius for sharp edges */
  --radius: 0px;
}

@theme inline {
  /* Maps CSS variables to Tailwind utilities */
}
```

#### 3. TypeScript Paths (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### 4. shadcn/ui Config (`components.json`)
```json
{
  "style": "new-york",
  "tailwind": {
    "css": "src/styles/globals.css",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## 🧱 Component Guidelines

### Adding New shadcn/ui Components

1. **Installation**
```bash
bunx shadcn@latest add [component-name]
```

2. **Auto-styling**: Components automatically inherit Neo Brutalism theme
   - Sharp corners (no border radius)
   - Offset black shadows
   - Theme color palette
   - Brutalist typography

### Custom Component Development

#### Best Practices
```tsx
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const CustomComponent = ({ className, ...props }) => {
  return (
    <Card className={cn("shadow-sm border-2", className)}>
      <CardHeader>
        <CardTitle className="text-primary">Title</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Badge variant="destructive">Status</Badge>
      </CardContent>
    </Card>
  )
}
```

#### Key Classes to Use
- **Shadows**: `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`
- **Colors**: `bg-primary`, `text-primary`, `bg-secondary`, `text-accent`
- **Borders**: `border-2`, `border-4` (thick borders)
- **Typography**: `font-sans`, `font-mono`, `font-semibold`
- **Spacing**: `space-y-4`, `space-y-6`, `gap-4`

#### Avoid These Classes
- `rounded-*` (use sharp edges)
- `shadow-lg` with blur (use offset shadows)
- Muted colors for primary elements
- Small border widths

### Component Variants

#### Buttons
```tsx
// Primary action - bright red
<Button variant="default">Primary Action</Button>

// Secondary action - bright yellow  
<Button variant="secondary">Secondary Action</Button>

// Destructive action - black
<Button variant="destructive">Delete</Button>
```

#### Badges
```tsx
// Status indicators
<Badge variant="default">Active</Badge>       // Red
<Badge variant="secondary">Pending</Badge>    // Yellow  
<Badge variant="destructive">Error</Badge>    // Black
<Badge variant="outline">Neutral</Badge>      // Black border
```

#### Cards
```tsx
// Standard card with brutalist shadows
<Card className="shadow-md border-2">
  <CardHeader className="border-b-2">
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent className="p-6">
    Content with proper spacing
  </CardContent>
</Card>
```

## 🔧 Maintenance & Updates

### Updating the Theme

1. **Modify colors** in `src/styles/globals.css`
2. **Rebuild** with `bun run build`
3. **Test** both light and dark modes

### Adding New Colors
```css
:root {
  --new-color: #hexvalue;
}

@theme inline {
  --color-new-color: var(--new-color);
}
```

### Updating Shadows
All shadows follow the pattern: `4px 4px 0px 0px #000`
- Modify the offset values while keeping the sharp edges
- Avoid blur values to maintain brutalist aesthetic

### Dependencies
```json
{
  "@tailwindcss/vite": "^4.1.12",
  "tailwindcss": "^4.1.12", 
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1",
  "lucide-react": "^0.542.0"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Styles not applying**
   - Check CSS import path in components
   - Verify Tailwind plugin in `wxt.config.ts`
   - Rebuild with `bun run build`

2. **Components look wrong**
   - Ensure `@import "tailwindcss"` is first in globals.css
   - Check `@theme inline` mapping
   - Verify color variable names

3. **Build errors**
   - Check Vite config function syntax: `vite: () => ({})`
   - Ensure all imports are correct
   - Clear `.output` folder and rebuild

### Debug Commands
```bash
# Rebuild extension
bun run build

# Check generated CSS
cat .output/chrome-mv3/assets/sidepanel-*.css | grep -A5 -B5 "shadow"

# Verify theme variables
cat .output/chrome-mv3/assets/sidepanel-*.css | grep -A10 ":root"
```

## 📚 References

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/v4-beta)
- [tweakcn Theme Generator](https://tweakcn.com/editor/theme)
- [Neo Brutalism Design System](https://tweakcn.com/r/themes/neo-brutalism.json)
- [WXT Documentation](https://wxt.dev)

## 🎯 Future Enhancements

### Potential Additions
- [ ] More shadow variants (larger offsets)
- [ ] Additional accent colors  
- [ ] Custom brutalist animations
- [ ] Extended typography scale
- [ ] Component-specific shadow utilities

### Performance Considerations
- CSS file size: ~20KB (optimized for used classes)
- Build time: ~2-3 seconds
- Theme switching: Instant (CSS variables)

---

**Last Updated**: August 2025  
**Theme Version**: Neo Brutalism v1.0  
**Tailwind Version**: v4.1.12