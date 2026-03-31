import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const packageJsonPath = path.join(repoRoot, "package.json");
const packageLockPath = path.join(repoRoot, "package-lock.json");
const nodeModulesPath = path.join(repoRoot, "node_modules");

const bannedPackageVersions = new Map([
  ["axios", new Set(["1.14.1", "0.30.4"])],
  ["plain-crypto-js", new Set(["4.2.1"])],
]);

const bannedStrings = [
  "sfrclak.com",
  "142.11.206.73",
  "f7d335205b8d7b20208fb3ef93ee6dc817905dc3ae0c10a0b164f4e7d07121cd",
  "617b67a8e1210e4fc87c92d1d1da45a2f311c08d26e89b12307cf583c900d101",
  "92ff08773995ebc8d55ec4b8e1a225d0d1e51efa4ef88b8849d0071230c9645a",
];

const violations = [];

function recordViolation(message) {
  violations.push(message);
}

function checkRequestedRanges(pkgJson) {
  for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    const deps = pkgJson[field] ?? {};
    for (const [name, range] of Object.entries(deps)) {
      const bannedVersions = bannedPackageVersions.get(name);
      if (!bannedVersions) {
        continue;
      }

      for (const bannedVersion of bannedVersions) {
        if (String(range).includes(bannedVersion)) {
          recordViolation(`package.json ${field}.${name} requests banned version ${bannedVersion}`);
        }
      }
    }
  }
}

function checkLockPackages(lockJson) {
  const packages = lockJson.packages ?? {};
  for (const [pkgPath, meta] of Object.entries(packages)) {
    if (!meta || typeof meta !== "object" || !meta.name || !meta.version) {
      continue;
    }

    const bannedVersions = bannedPackageVersions.get(meta.name);
    if (!bannedVersions?.has(meta.version)) {
      continue;
    }

    const location = pkgPath || "root package";
    recordViolation(`package-lock.json resolves ${meta.name}@${meta.version} at ${location}`);
  }
}

function scanTextForIndicators(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const indicator of bannedStrings) {
    if (content.includes(indicator)) {
      recordViolation(`${path.relative(repoRoot, filePath)} contains IOC ${indicator}`);
    }
  }
}

function scanInstalledPackageManifests(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return;
  }

  const queue = [rootDir];
  while (queue.length > 0) {
    const currentDir = queue.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      if (entry.name.startsWith(".")) {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);

      if (entry.name === "node_modules") {
        queue.push(fullPath);
        continue;
      }

      if (entry.name.startsWith("@")) {
        queue.push(fullPath);
        continue;
      }

      const manifestPath = path.join(fullPath, "package.json");
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
          const bannedVersions = bannedPackageVersions.get(manifest.name);
          if (bannedVersions?.has(manifest.version)) {
            recordViolation(
              `installed dependency ${manifest.name}@${manifest.version} found at ${path.relative(repoRoot, fullPath)}`,
            );
          }
        } catch {
          recordViolation(`could not parse ${path.relative(repoRoot, manifestPath)}`);
        }
      }

      queue.push(fullPath);
    }
  }
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
checkRequestedRanges(packageJson);

if (fs.existsSync(packageLockPath)) {
  const packageLock = JSON.parse(fs.readFileSync(packageLockPath, "utf8"));
  checkLockPackages(packageLock);
  scanTextForIndicators(packageLockPath);
}

scanTextForIndicators(packageJsonPath);
scanInstalledPackageManifests(nodeModulesPath);

if (violations.length > 0) {
  console.error("Dependency safety check failed.");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Dependency safety check passed.");
