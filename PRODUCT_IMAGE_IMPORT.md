# Original Maison Amiral product image integration

Source: user-supplied `Maison (1).zip`. The JPEGs were optimised as WebP without changing their designs. Original garment graphics were extracted to transparent PNGs for the interactive 3D mannequin.

## Verified mapping

- Automobile Tee: `Automobile front.jpg` (front), `Automobile 2.jpg` (back), `Automobile back.jpg` (detail).
- Guerrilla Tee: `Guerilla.jpg` (front), `Guerilla 2.jpg` (on-body).
- Emblem Tee: `Emblem front.jpg` (front), `Emblem back.jpg` (reverse), `Edit.jpg` (on-body).
- Only three pieces are for sale: Automobile, Guerrilla, and Emblem. Flag Staple has been removed from the catalogue.

The reference shots showing a white protective suit, the standalone ships, and duplicate variants have not been assigned to any garment.

## Required binary assets

Thirteen binary assets belong in `public/products/edition-001/{automobile,guerrilla,emblem}/`. The original JPEG files are now committed directly under `public/` and are wired into the product cards, galleries and homepage. The 3D viewer still requires the five transparent print PNGs from the companion `Maison_Product_Images_Ready.zip` supplied in the ChatGPT conversation to display the authentic graphics on the model. Do not assume JPEG photos provide transparent 3D decals. The archive contains the optimised images and transparent print layers, plus a PowerShell installer.

**Product photography is now wired to the uploaded JPEGs.** Import the transparent print PNGs for accurate 3D decals, and complete build/browser review before merging or releasing.

The new paths are used by the collection grid, individual product galleries, homepage Emblem photography, photo mode, and 3D mannequin prints.
