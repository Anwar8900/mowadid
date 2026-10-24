/**
 * نشر التطبيق على GitHub Pages عبر فرع gh-pages.
 *
 * الاستخدام: npm run deploy
 * - يبني المشروع بقاعدة المسارات المناسبة للمستودع (مثال: /mowadid/)
 * - ينشئ فرع gh-pages حديثًا يحتوي ملفات dist فقط ويدفعه إلى origin
 * - لا يحتاج صلاحية "workflow" في GitHub، ولا إعداد أسرار في المستودع
 *
 * لتغيير اسم المستودع/المسار يدويًا: PAGES_BASE=/my-repo/ npm run deploy
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const run = (command, options = {}) => execSync(command, { stdio: 'inherit', ...options });

const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
const repoName = remote
  .replace(/\.git$/, '')
  .split(/[\\/]/)
  .pop();

// مستودع <user>.github.io يُنشر على الجذر، وباقي المستودعات تحت /<repo>/
const base = process.env.PAGES_BASE || (repoName.endsWith('.github.io') ? '/' : `/${repoName}/`);

console.log(`\n▶ بناء التطبيق للنشر على https://<user>.github.io${base}\n`);

run('npm run build', { env: { ...process.env, DEPLOY_BASE: base } });

const distDir = join(process.cwd(), 'dist');
const deployDir = join(process.cwd(), '.deploy');

if (!existsSync(join(distDir, 'index.html'))) {
  console.error('✖ لم يتم العثور على dist/index.html — فشل البناء.');
  process.exit(1);
}

rmSync(deployDir, { recursive: true, force: true });
mkdirSync(deployDir, { recursive: true });
cpSync(distDir, deployDir, { recursive: true });
// يمنع معالجة Jekyll للملفات التي تبدأ بشرطة سفلية
writeFileSync(join(deployDir, '.nojekyll'), '');

const readConfig = (key, fallback) => {
  try {
    return execSync(`git config ${key}`, { encoding: 'utf8' }).trim() || fallback;
  } catch {
    return fallback;
  }
};

const userName = readConfig('user.name', 'GitHub Pages');
const userEmail = readConfig('user.email', 'gh-pages@users.noreply.github.com');

run('git init -b gh-pages', { cwd: deployDir });
run('git add -A', { cwd: deployDir });
run(
  `git -c user.name="${userName}" -c user.email="${userEmail}" commit -m "deploy: ${new Date().toISOString()}"`,
  { cwd: deployDir },
);
run(`git push --force "${remote}" gh-pages`, { cwd: deployDir });

rmSync(deployDir, { recursive: true, force: true });

console.log('\n✔ تم النشر. قد يستغرق ظهور الموقع على GitHub Pages دقيقة تقريبًا.\n');
