import { mkdir, writeFile } from 'node:fs/promises';
const assets = [
  ['hero', 'photo-1504674900247-0877df9cc836', 1440, 810],
  ['food', 'photo-1544025162-d76694265947', 640, 430],
  ['coffee', 'photo-1442512595331-e89e73853f31', 640, 430],
  ['landscape', 'photo-1464822759023-fed622ff2c3b', 800, 640],
  ['restaurant', 'photo-1414235077428-338989a2e8c0', 640, 430],
  ['bakery', 'photo-1509440159596-0249088772ff', 640, 430],
  ['forest', 'photo-1441974231531-c6227db76b6e', 640, 430],
  ['hills', 'photo-1472396961693-142e6e269027', 640, 430],
  ['patio', 'photo-1555396273-367ea4eb4db5', 640, 430],
];
await mkdir('public/media', { recursive: true });
const sources = [];
for (const [name, id, width, height] of assets) {
  const url = `https://images.unsplash.com/${id}?fit=crop&w=${width}&h=${height}&fm=webp&q=80`;
  const response = await fetch(url);
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/'))
    throw new Error(`Failed image: ${name} (${response.status})`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(`public/media/${name}.webp`, buffer);
  sources.push({
    file: `${name}.webp`,
    url,
    license: 'https://unsplash.com/license',
    illustrationOnly: true,
    bytes: buffer.length,
    width,
    height,
  });
  console.log(`${name}.webp: ${(buffer.length / 1024).toFixed(1)} KB`);
}
await writeFile('public/data/media-sources.json', JSON.stringify(sources, null, 2) + '\n');
