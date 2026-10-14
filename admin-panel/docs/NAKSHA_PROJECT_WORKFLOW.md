# Naksha / Hippo-style project workflow

How to publish an interactive township page like Hippo’s map (hover plot details + Inquiry / Book Now).

The **public site never runs OCR**. Visitors only read Project + Plot data from the API. OCR is an optional admin shortcut to create plot rows from a scanned layout.

## Checklist (per township)

1. **Create the project** (Admin → Projects → Add)
   - Name, city/location, base rate, description, RERA if any
2. **Upload the naksha / layout image**
   - Sets `mapImageUrl` (required for the interactive map)
3. **Fill marketing content**
   - Highlights, amenities, location advantages (Overview section on `/projects/{id}`)
4. **Create plot inventory** — pick one path:
   - **OCR path:** Naksha AI OCR tool or Plot Management → Upload Gov. Naksa → review → **Approve**  
     (writes plots, can seed empty highlights/amenities, stores percent boxes for colored shapes)
   - **Manual path:** Plot Management → add plots (plot no, size, dimensions, type, status)
5. **Place every plot on the map**
   - Plot Management canvas: pin plots that have no OCR box  
   - Without a pin **or** a percent bounding box/polygon, the plot will not appear as a hotspot
6. **Keep status live**
   - `AVAILABLE` / `BOOKED` / `PENDING` / `SOLD` drives colors and Book Now
7. **Verify on the landing site**
   - Open `/projects/{id}`
   - Confirm overview stats, hover card (type, area, dimensions, PLC, status), Inquiry / Book Now → sidebar form

## What visitors see

| UI piece | Data source |
|----------|-------------|
| Overview (location, total, available) | Project + plot status counts |
| Amenities / highlights / advantages | Project fields |
| Colored shapes / pins + hover | Plots (`coordinates` / `polygon` / `marker`) + `mapImageUrl` |
| Inquiry / Book Now | Selects plot → scrolls to inquiry form → `POST /public/inquiries` |

## Tips

- Prefer a clear JPG/PNG naksha (PDF is not supported for OCR).
- Free-tier Gemini quotas can make full 9-tile OCR fail; wait a minute and retry, or add plots manually.
- After Approve, re-check pins for any plot lacking a shape.
- Book Now is enabled only when status is `AVAILABLE`.
