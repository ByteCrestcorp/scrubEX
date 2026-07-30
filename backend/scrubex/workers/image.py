"""Image worker: jpg, jpeg, png, webp, gif, tiff, heic/heif. Implemented in P4c.

ExifTool and Pillow. EXIF (including GPS), IPTC, XMP, ICC.

Strips with one engine and verifies with the other, so a shared blind spot
cannot produce a false clean result (N5).

Sensor and encoder fingerprints (PRNU noise, quantization tables, chroma
subsampling) are detected and reported under ``residual_findings``, never
stripped: they are properties of the pixel data rather than attached metadata,
and removing them requires re-encoding, which degrades the file and leaves a
new fingerprint anyway.
"""
