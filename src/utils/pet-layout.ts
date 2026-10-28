export interface PetViewport { left: number; top: number; width: number; height: number }
export interface PetPosition { x: number; y: number }
export type PetPose = "idle" | "right" | "left" | "star";
export const PET_EDGE_GAP = 6;

// Visible alpha bounds of the 136px artwork, unioned over all animation frames.
// The greeting and controls are deliberately NOT part of the drag boundary.
export function petBounds(pose: PetPose) {
	if (pose === "star") return { left: 4, top: 4, right: 48, bottom: 48 };
	if (pose === "right") return { left: 1, top: 0, right: 115, bottom: 136 };
	if (pose === "left") return { left: 21, top: 0, right: 135, bottom: 136 };
	return { left: 24, top: 1, right: 117, bottom: 133 };
}
function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(value, Math.max(min, max)));
}
export function layoutPet(position: PetPosition, pose: PetPose, viewport: PetViewport) {
	const b = petBounds(pose), gap = PET_EDGE_GAP;
	const left = viewport.left + gap, top = viewport.top + gap;
	const right = viewport.left + viewport.width - gap, bottom = viewport.top + viewport.height - gap;
	const x = clamp(position.x, left - b.left, right - b.right);
	const y = clamp(position.y, top - b.top, bottom - b.bottom);
	const speechWidth = Math.min(196, viewport.width - gap * 2);
	const speechX = clamp(x + (b.left + b.right) / 2 - speechWidth / 2, left, right - speechWidth);
	const above = y + b.top - 76;
	const speechY = clamp(above >= top ? above : y + b.bottom + 12, top, bottom - 64);
	// Move the fold control to the inward side when the pet reaches the right edge.
	const foldX = clamp(x + b.right + 44 <= right ? x + b.right : x + b.left - 44, left, right - 44);
	const foldY = clamp(y + b.top + 28, top, bottom - 44);
	return { x, y, speechX, speechY, speechWidth, foldX, foldY };
}

// Changing back from the wider running pose must not leave a fresh invisible gap.
export function keepPetAtEdge(position: PetPosition, from: PetPose, to: PetPose, viewport: PetViewport) {
	const a = petBounds(from), b = petBounds(to), gap = PET_EDGE_GAP;
	let { x, y } = position;
	if (x + a.left <= viewport.left + gap + 1) x = viewport.left + gap - b.left;
	else if (x + a.right >= viewport.left + viewport.width - gap - 1) x = viewport.left + viewport.width - gap - b.right;
	if (y + a.top <= viewport.top + gap + 1) y = viewport.top + gap - b.top;
	else if (y + a.bottom >= viewport.top + viewport.height - gap - 1) y = viewport.top + viewport.height - gap - b.bottom;
	return { x, y };
}
