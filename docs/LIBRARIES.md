# Current Library Dependency List

Last updated: 2026-05-20

This file records the third-party libraries used by the current
`Beyblade_Speed_Watch` firmware build.

## Build libraries

| Component | Version / source | License | Notes |
| --- | --- | --- | --- |
| Waveshare ESP32-S3-Touch-AMOLED-2.06 example repository | upstream example bundle | Apache-2.0 | Hardware baseline and example-derived integration. |
| Arduino-ESP32 Core | 3.3.7 | LGPL-2.1-or-later | As declared by upstream project. |
| LVGL | 9.3.0 | MIT | UI framework. |
| SensorLib | 0.3.1 | MIT | Bosch subcomponents are BSD-3-Clause; see `LICENSES/SensorLib-THIRD_PARTY_NOTICES.md`. |
| XPowersLib | 0.3.0 | MIT | AXP2101 PMU support. |
| Arduino_GFX | 1.6.0 | BSD | CO5300 display support. |
| es8311 files | source files in this tree | Apache-2.0 | Audio codec support. |
| shark-minister atlas_bey core | integrated source | MIT | See `analyzer_packet_logic.h`. |
| Source Han Sans SC | generated LVGL font bitmaps | SIL OFL 1.1 | CJK glyph source for generated UI fonts. |
| Montserrat | LVGL built-in font data | SIL OFL 1.1 | LVGL default Latin font family. |
| Font Awesome Free | LVGL built-in symbol font data | SIL OFL 1.1 / MIT / CC BY 4.0 | LVGL symbols and icon font notices. |

## Removed dependency

`Arduino_DriveBus` is not linked by this firmware build. FT3168 touch support
is implemented in product-side source code at `hal_touch_ft3168_driver.h`.

Before release, run:

```bash
rg "Arduino_DriveBus|Arduino_DriveBus_Library|Arduino_FT3x68"
```

The command should return no firmware source dependency. Historical legal notes
may still mention the removed dependency for audit history.
