# Cinematic home artwork

`cafe-hero.png` is the original 1920 × 1080 image supplied by the user on 2026-09-28, copied byte-for-byte from their attachment. It remains unchanged.

`cafe-cutout.webp` is a transparent foreground derived from that image using the built-in image generation tool (background-extraction edit, not a new character). As an AI-assisted extraction it is not guaranteed pixel-identical. The returned PNG was encoded with Sharp at WebP quality 92. The original source and generated PNG are retained. The foreground, graphic rings, light planes and typography move independently; mobile has separate framing. No external character artwork was substituted.

## Extraction prompt record

Built-in mode, transparent_background: true, input: `cafe-hero.png`.

Remove ONLY the flat patterned cream wallpaper background, lavender top/bottom border and the lavender cast shadow behind the figure. Preserve the entire existing orange-haired anime character together with her held tray, pancakes, pouring syrup, all visible hands, hair ribbons and dress as a single faithful foreground cutout. Preserve exactly the original face, expression, pose, proportions, colors, outfit, linework, tray geometry, tiny apron emblem and cropping. Do not redraw or redesign the character. Do not invent legs, shoes or unseen parts below the existing bottom crop. Do not add new objects or glow. Keep fine hair edges and the syrup stream. Genuine transparent alpha outside the foreground, including spaces between hair and arm. Crop the empty right-side canvas so this is a tightly framed nearly square cutout of the original foreground, with a small transparent margin. This is a faithful extraction for a website foreground, not a new illustration.

The previous generated silver-haired character is no longer used. Its asset and generation record remain recoverable in Git history.

## Upper-edge cleanup

`cafe-cutout-clean.webp` is a rejected, unused variant: removing the pouring arm/vessel broke the intended action. It is retained only for recovery. The original cutout and source remain unchanged.

Final prompt (built-in mode, transparent_background: true; edit target: `cafe-cutout.webp`):

> Use case: precise-object-edit. Input image: edit target, a transparent anime cafe-character foreground for a scroll animation. Fix ONLY the unwanted upper-edge remnants: remove the disconnected cropped skin-colored arm/hand and silver pouring vessel above her crown, and remove the thin falling honey/syrup stream from that vessel down to the pancakes. Replace these removed objects with transparent alpha, restoring any tiny hair boundary they overlap naturally. Keep the entire existing character's face, eyes, expression, orange hair silhouette including the upward curl, ribbons, yellow plaid outfit, pose, body proportions, apron emblem, visible arm supporting the tray, metal tray and pancake stack with syrup coating unchanged. Do not redesign, restyle, recolor, smooth or beautify her. Maintain the same framing, nearly square canvas and existing bottom skirt crop; no additional body parts. Leave a small transparent safety margin above the complete crown and hair curl so no opaque content touches the top edge. Genuine transparent background, no white background, no checkerboard baked into output, no glow or shadow. Only remove the cropped top objects and dangling honey stream, preserve all other pixels as closely as possible.

## Complete pouring pose for mobile

The mobile foreground now uses `cafe-cutout-complete.webp`; desktop uses the original `cafe-cutout.webp`. Built-in image-generation outpainting reconstructed the missing upper hand, raised arm and pitcher while preserving the pouring action. This is an AI-assisted reconstruction, not recovered original artwork. WebP quality 92, transparent alpha preserved. The removed-hand version is no longer referenced by the page.

Final prompt (built-in mode, transparent_background: true; edit target: `cafe-cutout.webp`):

> Use case: identity-preserve / precise-object-edit outpainting. Edit target: the attached transparent original orange-haired anime cafe character pouring honey onto pancakes. The source is clipped at the TOP: a raised arm and a silver syrup pitcher extend outside the image. EXTEND THE CANVAS UPWARD to reveal the complete existing pouring action. Reconstruct the missing portion of the ONE raised arm behind her head, its elbow/forearm, natural hand gripping the handle of the tipped silver syrup pitcher, with honey flowing continuously from its spout along the original stream onto the pancake stack. This is her own arm, connected anatomically to the far shoulder behind her hair; the other existing arm continues holding the tray. Exactly two arms and two hands, no detached limbs. Keep the entire original region as unchanged as possible: same face, eyes, open-mouth smile, orange hair, ribbons, yellow plaid dress, apron, supported tray, pancake stack, original lower crop. Do not remove the existing hand, pitcher or honey. Do not change the pose or redesign her. Only outpaint missing content ABOVE the old top edge and minimally join its edges; no extension below the skirt, no new props or text. Portrait canvas with about 25 percent extra height above the original square, fully visible pouring hand, elbow and vessel, and a clear transparent safety margin above them. Genuine transparent alpha background; no scene, no checkerboard baked in, no glow, no cast shadow. Match original detailed anime linework, lighting and colors.

## Interaction references

- https://www.apple.com/airpods-pro/ — immersive product presentation reference.
- https://github.com/NickMezacapa/Apple-AirPod-Pro-Rebuild — scroll-linked image sequence approach.
- https://gsap.com/docs/v3/Plugins/ScrollTrigger/ — pinning and scrubbing concepts.

The implementation uses native CSS sticky positioning and a reversible requestAnimationFrame timeline. No code or Apple image sequence was copied, and no GSAP dependency is installed. The foreground remains a still illustration, not a 3D model or character motion video. Reduced-motion preference uses a static opening without a long scroll sequence.
