import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..'); // Adjust if your utils folder is nested differently

export function getPath(...segments) {
  return path.join(appRoot, ...segments);
}

export function getSrcPath(...segments) {
  return path.join(appRoot, 'src', ...segments);
}

export function getPagesPath(...segments) {
  return path.join(appRoot, 'src', 'pages', ...segments);
}
