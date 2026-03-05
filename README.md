# Backyard Planner

A visual garden design tool built with React and Konva.js. Plan your garden layout with drag-and-drop beds, sun exposure analysis, fixed features, and climate-based planting recommendations — all in the browser, no account required.

**Live demo**: https://backyard-planner-production.up.railway.app/

---

## Features

### Garden Beds
- Drag and drop bed templates onto the canvas: rectangle, circle, oval, raised box, keyhole, and stadium (pill) shapes
- Resize and rotate beds freely
- Label beds and set sun requirements (full sun, part shade, full shade)
- Color-coded by sun requirement

### Fixed Features
- Place fixed site features: house walls, fences, trees, water spigots, concrete pads, and downspouts
- Polygon features (walls, fences, concrete pads) drawn by clicking points, double-click to finish
- Point features (trees, spigots, downspouts) placed with a single click
- Concrete pads support greyscale surface color swatches (concrete, asphalt, gravel, pavers)
- Fence segments render with a double-rail visual; house walls render thicker with shadow

### Sun Exposure Analysis
- Draw your garden boundary, enter your address, and click **Compute ☀️** to calculate real sun exposure
- Uses `suncalc` to sample sun altitude every 30 minutes on June 21 and December 21
- Overlays color-coded sun zones: full sun (yellow), partial shade (orange), full shade (blue)
- Manual shade zone drawing also available as an alternative
- Sun zone labels show exposure classification

### Climate & Recommendations Panel
- Collapsible bottom drawer with 4 climate inputs: current date, USDA hardiness zone, Köppen climate code, and prevailing wind direction
- Compass rose UI for selecting wind direction
- Live rule-based recommendations that update as you fill in data:
  - Sun mismatch warnings (full-sun bed in shaded area)
  - Wind protection suggestions based on prevailing direction
  - Seasonal planting suggestions based on hardiness zone and date
  - Climate-specific tips (arid, tropical, continental)
  - Spacing and access reminders

### Canvas Tools
- Pan (middle mouse / space + drag) and zoom (scroll wheel)
- Grid with optional snapping
- Unit toggle: feet or meters
- Measurement display on beds and boundaries

### Design Management
- Undo / redo (Ctrl+Z / Ctrl+Shift+Z)
- Save design to browser localStorage and reload on next visit
- Export canvas as PNG
- Clear all to start fresh

### Onboarding Tour
- First-visit step-by-step tour highlighting toolbar, bed panel, canvas, sun panel, and climate panel
- Restart anytime via the `?` button in the toolbar

---

## Tech Stack

| Layer | Library |
|-------|---------|
| UI framework | React 19 |
| Canvas rendering | react-konva + Konva.js |
| Styling | Tailwind CSS v4 |
| State management | Zustand |
| Sun calculations | suncalc |
| Geocoding | Nominatim (OpenStreetMap) |
| Build tool | Vite 7 |
| Language | TypeScript |

---

## Running Locally

```bash
git clone https://github.com/djdmkim94/backyard-planner.git
cd backyard-planner
npm install
npm run dev
```

Open http://localhost:5173

### Build for production

```bash
npm run build
npx serve dist -s
```

---

## Deployment

The app is deployed on Railway. The `railway.json` config handles build and start automatically. Any push to `main` triggers a new deployment.

---

## Project Structure

```
src/
├── components/
│   ├── canvas/       # Konva layers (beds, boundary, sun overlay, features, warnings)
│   ├── layout/       # Toolbar, StatusBar, ClimatePanel, TourOverlay
│   └── sidebar/      # Bed panel, sun panel, properties panel, fixed features
├── constants/        # Canvas defaults, sun data, fixed feature configs
├── hooks/            # Keyboard shortcuts
├── store/            # Zustand stores (design, canvas, history)
├── types/            # TypeScript interfaces
└── utils/            # Sun calculations, recommendations engine, geometry helpers
```

---

## License

MIT
