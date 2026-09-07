from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "assets" / "skip" / "optimized"
SOURCES = {
    "hero-sky": ROOT / "input" / "hero-sky-background.png",
    "hero-foreground": ROOT / "input" / "hero-foreground.png",
}
WIDTHS = (1600, 2400, 3200)


OUTPUT.mkdir(parents=True, exist_ok=True)
for stem, source in SOURCES.items():
    with Image.open(source) as image:
        image.load()
        for width in WIDTHS:
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            destination = OUTPUT / f"{stem}-{width}.webp"
            resized.save(destination, "WEBP", quality=84, method=6, exact=True)
