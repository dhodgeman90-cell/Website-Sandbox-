"""
Removes industrial rivet hardware details from the cabinet-hero.jpg image.
Only the narrow left/right frame member strips and corner bracket zones are
touched. The drawer face area (x ≈ 490–760) is never modified.
"""

from pathlib import Path

from PIL import Image, ImageFilter
import numpy as np

ASSETS = Path(__file__).resolve().parent.parent / "assets"


def remove_rivets(img, x1, y1, x2, y2, window=41):
    """
    For each row in the target strip, replace each pixel with the median of a
    vertical window of that same column.  This removes point-like rivets (local
    outliers in the y direction) while keeping the natural left-right gradient
    intact.  No adjacent pixels outside the strip are touched.
    """
    arr = np.array(img, dtype=np.uint8)
    strip = arr[y1:y2, x1:x2].copy()   # shape (h, w, 3)
    h = strip.shape[0]
    half = window // 2
    result = strip.copy()

    for y in range(h):
        lo = max(0, y - half)
        hi = min(h, y + half + 1)
        result[y] = np.median(strip[lo:hi], axis=0)

    arr[y1:y2, x1:x2] = result
    return Image.fromarray(arr)


img = Image.open(ASSETS / "cabinet-hero.jpg")

# ── LEFT FRAME MEMBER  (≈23 px wide — stays off the drawer face)
img = remove_rivets(img, 462, 392, 486, 958, window=51)

# ── TOP-LEFT CORNER BRACKET  (slightly wider to cover the screw cluster)
img = remove_rivets(img, 462, 392, 528, 442, window=41)

# ── RIGHT FRAME MEMBER
img = remove_rivets(img, 762, 392, 790, 958, window=51)

# ── TOP-RIGHT CORNER BRACKET
img = remove_rivets(img, 734, 392, 790, 442, window=41)

# ── BOTTOM CORNERS  (toe-kick hardware)
img = remove_rivets(img, 462, 912, 528, 958, window=31)
img = remove_rivets(img, 734, 912, 790, 958, window=31)

img.save(ASSETS / "cabinet-hero-flat.jpg", quality=95)
print("Saved: assets/cabinet-hero-flat.jpg")
