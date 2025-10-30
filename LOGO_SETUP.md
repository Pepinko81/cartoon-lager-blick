# Logo Setup

## Adding the HashMatrix Logo

To complete the logo integration, please copy your `HashMatrix.png` file to:

```
public/logo.png
```

The application is already configured to use this logo in:
- App header (top-left, 48px height)
- Favicon
- PWA icons (192x192 and 512x512)
- Splash screen (centered on app load)

## Logo Requirements

- Format: PNG
- Recommended size: At least 512x512 pixels for best quality
- The logo will automatically scale to the required sizes
- Dark/light mode compatible with drop shadows already configured

## After Adding the Logo

1. Restart the Vite dev server if running
2. Clear browser cache if favicon doesn't update
3. The splash screen will appear on every app load (2 seconds)
4. The logo will appear in the header on all pages

