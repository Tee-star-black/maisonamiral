# Original Maison Amiral product image integration

Source: user-supplied `Maison (1).zip`. The JPEGs were optimised as WebP without changing their designs. Original garment graphics were extracted to transparent PNGs for the interactive 3D mannequin.

## Verified mapping

- Automobile Tee: `Automobile front.jpg` (front), `Automobile 2.jpg` (back), `Automobile back.jpg` (detail).
- Guerrilla Tee: `Guerilla.jpg` (front), `Guerilla 2.jpg` (on-body).
- Emblem Tee: `Emblem front.jpg` (front), `Emblem back.jpg` (reverse), `Edit.jpg` (on-body).
- Flag Staple Tee: no unambiguous flat-lay product photo. The existing flag editorial film remains until a verified shot is supplied.

The reference shots showing a white protective suit, the standalone ships, and duplicate variants have not been assigned to any garment.

## Required binary assets

Thirteen binary assets belong in `public/products/edition-001/{automobile,guerrilla,emblem}/`. The image files are intentionally not in this text-only GitHub commit. Import the companion `Maison_Product_Images_Ready.zip` supplied in the ChatGPT conversation before previewing the feature branch. The archive contains the optimised images and transparent print layers, plus a PowerShell installer.

**Do not merge or release this branch until the images are imported and a build and browser review have passed.**

The new paths are used by the collection grid, individual product galleries, homepage Emblem photography, photo mode, and 3D mannequin prints.
