# App Icons Setup

For now, I've created a placeholder SVG icon. To create proper PNG icons for your app:

## Option 1: Use an Online Tool (Easiest)

1. Go to: https://www.favicon-generator.org/
2. Upload a 512x512 image (could be your logo, or the credit card emoji)
3. Download the generated icons
4. Rename them:
   - `android-icon-192x192.png` → `icon-192.png`
   - `android-icon-512x512.png` → `icon-512.png`
5. Place them in the `public/` folder

## Option 2: Use ImageMagick (If installed)

If you have ImageMagick installed, run:

```bash
cd /Users/mediad/mobile-payment-terminal/public
convert -size 192x192 xc:"#6366f1" -font Arial -pointsize 100 -fill white -gravity center -annotate +0+0 "💳" icon-192.png
convert -size 512x512 xc:"#6366f1" -font Arial -pointsize 280 -fill white -gravity center -annotate +0+0 "💳" icon-512.png
```

## Option 3: Keep Using SVG (Temporary)

The app will work without PNG icons, but they're better for phone home screens.

---

For now, you can proceed with testing and deployment. Add proper icons later when you're ready! 🎨
