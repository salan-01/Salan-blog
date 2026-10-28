import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicAssets = resolve(projectRoot, "public", "assets");
const mirroredAssets = resolve(
	projectRoot,
	"src",
	"assets",
	"public",
	"assets",
);
for (const directory of ["desktop-banner", "mobile-banner"]) {
	const targetDirectory = resolve(mirroredAssets, directory);
	await mkdir(targetDirectory, { recursive: true });
	for (let index = 1; index <= 4; index += 1) {
		await cp(
			resolve(publicAssets, directory, `${index}.webp`),
			resolve(targetDirectory, `${index}.webp`),
		);
	}
}

console.log("Prepared mirrored banner images.");
