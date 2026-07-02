const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts');
const ZIP_URL =
  'https://github.com/dejavu-fonts/dejavu-fonts/releases/download/version_2_37/dejavu-fonts-ttf-2.37.zip';
const ZIP_PATH = path.join(FONT_DIR, 'dejavu.zip');
const NEEDED = ['DejaVuSans.ttf', 'DejaVuSans-Bold.ttf', 'DejaVuSansMono.ttf'];

function hasFonts() {
  return NEEDED.every((f) => fs.existsSync(path.join(FONT_DIR, f)));
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          file.close();
          fs.unlinkSync(dest);
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(FONT_DIR, { recursive: true });
  if (hasFonts()) {
    console.log('Ticket fonts already present');
    return;
  }

  console.log('Downloading DejaVu fonts for ticket rendering...');
  await download(ZIP_URL, ZIP_PATH);

  const isWin = process.platform === 'win32';
  if (isWin) {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Path '${ZIP_PATH}' -DestinationPath '${path.join(FONT_DIR, 'extract')}' -Force"`,
      { stdio: 'inherit' }
    );
    const extractRoot = path.join(FONT_DIR, 'extract');
    const ttfDir = fs
      .readdirSync(extractRoot)
      .map((d) => path.join(extractRoot, d, 'ttf'))
      .find((d) => fs.existsSync(d));
    if (!ttfDir) throw new Error('Could not find ttf folder in DejaVu zip');
    for (const file of NEEDED) {
      fs.copyFileSync(path.join(ttfDir, file), path.join(FONT_DIR, file));
    }
  } else {
    execSync(`unzip -j "${ZIP_PATH}" "*/DejaVuSans.ttf" "*/DejaVuSans-Bold.ttf" "*/DejaVuSansMono.ttf" -d "${FONT_DIR}"`, {
      stdio: 'inherit',
    });
  }

  fs.rmSync(ZIP_PATH, { force: true });
  console.log('Ticket fonts ready');
}

main().catch((err) => {
  console.error('Font setup failed:', err.message);
  process.exit(1);
});
