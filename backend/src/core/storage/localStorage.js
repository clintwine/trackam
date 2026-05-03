const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

const storageDirectory = path.resolve(process.env.STORAGE_DIRECTORY || "storage");

function ensureStorageDir() {
  fs.mkdirSync(storageDirectory, { recursive: true });
}

async function writeFile(name, data) {
  ensureStorageDir();
  const targetPath = path.join(storageDirectory, name);
  await fsPromises.writeFile(targetPath, data);
  return targetPath;
}

async function readFile(name) {
  const targetPath = path.join(storageDirectory, name);
  return fsPromises.readFile(targetPath);
}

function urlFor(name) {
  const prefix = process.env.STORAGE_URL_PREFIX || "/storage";
  const normalizedPrefix = prefix.replace(/\/$/, "");
  return `${normalizedPrefix}/${name}`;
}

module.exports = {
  storageDirectory,
  ensureStorageDir,
  writeFile,
  readFile,
  urlFor,
};
