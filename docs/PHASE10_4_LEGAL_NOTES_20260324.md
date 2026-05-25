# PHASE10_4 Legal Notes (Updated 2026-05-20)

This file records legal/compliance updates for the firmware bundle.

## Current status

- `Arduino_DriveBus` has been removed from the firmware source dependency graph.
- FT3168 touch support now uses product-side `Wire` code in
  `hal_touch_ft3168_driver.h`.
- Shipped notices must not list Arduino_DriveBus unless that library is
  reintroduced in a future build.

## Completed in this patch

1. Added `LICENSES/` directory and populated license texts for audited dependencies.
2. Rebuilt `THIRD_PARTY_NOTICES.txt` with versioned component entries.
3. Corrected critical license classification:
   - `Arduino_DriveBus` is GPL-3.0 (not "to be confirmed").
4. Added SensorLib Bosch subcomponent notice file.
5. Added source-offer template for copyleft compliance workflow.
6. Added website-ready open-source notice text.
7. Reclassified `shark-minister/atlas_bey` integration as MIT and added
   `LICENSES/MIT-shark-minister-atlas_bey.txt`.

## Distribution package checklist

- `THIRD_PARTY_NOTICES.txt`
- `LICENSES/` (all files)
- `docs/OPEN_SOURCE_NOTICE_WEB.md` (for web legal page)
- `LICENSES/SOURCE_OFFER_TEMPLATE.txt` filled with your real contact info

## Known commercial risk

- Historical note: the earlier dependency graph included `Arduino_DriveBus`
  (GPL-3.0).
- Current build no longer links this library. If it is reintroduced,
  commercial closed-source distribution has high legal risk without full GPL
  compliance.

## Suggested gate before release

1. Confirm `Arduino_DriveBus` is not linked by current firmware source.
2. Re-run compliance audit and update notice files if any Waveshare library is
   reintroduced.
