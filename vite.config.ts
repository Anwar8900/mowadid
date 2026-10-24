import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * GitHub Pages ينشر المشروع تحت https://<user>.github.io/<repo>/، لذلك يجب أن
 * تكون كل المسارات مسبوقة باسم المستودع. محليًا يبقى الجذر "/".
 * يُمرَّر عبر DEPLOY_BASE أثناء البناء للنشر فقط (انظر scripts/deploy-pages.mjs).
 */
const base = process.env.DEPLOY_BASE || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        id: base,
        name: 'مواعيدي',
        short_name: 'مواعيدي',
        description: 'تطبيق إدارة المواعيد - تسجيل وتنظيم ومتابعة المواعيد',
        lang: 'ar',
        dir: 'rtl',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${base}icon-512-maskable.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: `${base}index.html`,
      },
    }),
    {
      // GitHub Pages لا يدعم إعادة التوجيه لصفحة واحدة (SPA)، فيعود لأي مسار غير موجود
      // إلى 404.html. نسخ index.html إليه يجعل الروابط المباشرة (مثل /reset-password)
      // تعمل، ويقرأ React Router المسار الحقيقي من العنوان.
      name: 'spa-404-fallback',
      closeBundle() {
        const distDir = join(process.cwd(), 'dist');
        const indexHtml = join(distDir, 'index.html');
        if (existsSync(indexHtml)) {
          copyFileSync(indexHtml, join(distDir, '404.html'));
        }
      },
    },
  ],
});
