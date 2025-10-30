# Logo Setup

## Adding the HashMatrix Logo

To complete the logo integration, please copy your `HashMatrix.png` file to:

```
public/logo.png
```

### Quick Setup (Linux/Mac)

Run the setup script:
```bash
./setup-logo.sh
```

Or manually copy the file:
```bash
# If HashMatrix.png is in the project root:
cp HashMatrix.png public/logo.png

# Or if it's already in public/:
cp public/HashMatrix.png public/logo.png

# Or from anywhere:
cp /path/to/HashMatrix.png public/logo.png
```

### Verification

Check if the file exists:
```bash
ls -lh public/logo.png
file public/logo.png
```

## Logo Requirements

- Format: PNG
- Recommended size: At least 512x512 pixels for best quality
- The logo will automatically scale to the required sizes
- Dark/light mode compatible with drop shadows already configured

## Application Integration

The application is configured to use `/logo.png` in:
- ✅ App header (top-left, 48px height) - falls back to warehouse icon if missing
- ✅ Favicon (`index.html`)
- ✅ PWA icons (192x192 and 512x512 in `vite.config.ts`)
- ✅ Splash screen (centered on app load, 2 seconds)

### Fallback Behavior

If `logo.png` is not found:
- Header: Shows warehouse icon instead
- Splash screen: Shows "HashMatrix" text
- Browser console will show a warning message

## After Adding the Logo

1. **Restart the Vite dev server**:
   ```bash
   # Stop current server (Ctrl+C) then:
   npm run dev
   ```

2. **Clear browser cache** if favicon doesn't update:
   - Chrome/Edge: Ctrl+Shift+R or Ctrl+F5
   - Firefox: Ctrl+Shift+R
   - Or hard refresh: Ctrl+Shift+Delete → Clear cache

3. **Verify the logo appears**:
   - Splash screen on app load (2 seconds)
   - Header logo on all pages
   - Browser tab favicon
   - PWA manifest icons

## Troubleshooting

### Logo not showing?

1. **Check file exists**: `ls -la public/logo.png`
2. **Check file permissions**: Should be readable (`-rw-r--r--`)
3. **Check browser console**: Look for 404 errors or warnings
4. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
5. **Restart dev server**: Stop and restart `npm run dev`

### Still not working?

- Verify the file is actually a PNG: `file public/logo.png`
- Check the file size is reasonable (not 0 bytes)
- Try accessing directly: `http://localhost:8080/logo.png`
- Check Vite is serving public files correctly

