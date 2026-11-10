// Draws the Velentis V as PNG pictures for the app icon and the start screen.
// The build runs this for you, so you never have to upload any images.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const BG = '#0A0A0B';
const INK = '#F4F4F2';

mkdirSync('assets', { recursive: true });

// The V is two spear blades and a ring. It fits in a box 88 wide and 104 tall,
// and its middle sits at the point (0, -38).
function vMark() {
  const blade = (deg) =>
    `<g transform="rotate(${deg})">` +
    `<polygon points="0,-94 -9,4 0,4" fill="${INK}"/>` +
    `<polygon points="0,-94 9,4 0,4" fill="${INK}" fill-opacity=".6"/>` +
    `</g>`;
  return `${blade(-24)}${blade(24)}<circle r="11" fill="${INK}"/><circle r="6" fill="${BG}"/>`;
}

function picture(size, heightShare, withBackground, withMark = true) {
  const k = (size * heightShare) / 104;
  const background = withBackground ? `<rect width="${size}" height="${size}" fill="${BG}"/>` : '';
  const mark = withMark
    ? `<g transform="translate(${size / 2} ${size / 2 + 38 * k}) scale(${k})">${vMark()}</g>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${background}${mark}</svg>`;
}

async function save(name, svg) {
  await sharp(Buffer.from(svg)).png().toFile(`assets/${name}`);
  console.log('made', name);
}

await save('icon-only.png', picture(1024, 0.56, true));
await save('icon-foreground.png', picture(1024, 0.4, false));
await save('icon-background.png', picture(1024, 0, true, false));
await save('splash.png', picture(2732, 0.13, true));
await save('splash-dark.png', picture(2732, 0.13, true));
