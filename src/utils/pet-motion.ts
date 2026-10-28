export type PetFacing = "left" | "right";

// Use incremental travel, not distance from pointer-down, so mid-drag turns work.
export function updatePetFacing(facing: PetFacing, anchorX: number, currentX: number) {
	const travel = currentX - anchorX;
	if (Math.abs(travel) < 2) return { facing, anchorX };
	return { facing: (travel < 0 ? "left" : "right") as PetFacing, anchorX: currentX };
}
