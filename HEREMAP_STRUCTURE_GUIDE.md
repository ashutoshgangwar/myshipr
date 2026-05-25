# HereMapScreen Refactoring - Complete Structure Guide

## 📊 Project Structure

```
HereMapScreen/
├── HereMapScreen.js                    ← Main Component (1,376 lines → was 1,900+)
├── HereMapScreen.styles.js             ← Styles
│
├── components/                         ← UI Components
│   ├── HereMap/                       ← HERE SDK map integration
│   │   ├── HereMapModule.js           ← Native HERE module bridge
│   │   ├── HereMapView.js             ← React Native map view wrapper
│   │   ├── Routegeometry.js           ← Route trimming + snapping logic
│   │   └── index.js                   ← Exports HereMapView + HereMapModule
│   ├── NavigationControls.js          ← Toolbar buttons (Camera, Route, Navigate, etc)
│   └── NavigationInfo.js              ← Info bar (ETA, distance, arrival time)
│
├── hooks/                              ← Custom React Hooks
│   └── useSmoothLocation.js           ← GPS location animation logic
│
├── services/                           ← Placeholder folder inside screen
│   └── (empty)                        ← Actual HERE service lives in src/services/hereTruckService.js
│
├── utils/                              ← Utility Functions
│   ├── coordinateValidation.js        ← Validate lat/lng coordinates
│   ├── mathUtils.js                   ← Math calculations (bearing, distance, snapping)
│   └── polylineDecoder.js             ← Decode HERE & Google polylines
│
└── constants/                          ← Configuration Values
    └── navigationConstants.js          ← Navigation settings
```

---

## 📝 File Breakdown & Purpose

### **1. HereMapScreen.js** (Main Component)
**Purpose:** Core screen component that orchestrates everything
**Responsibilities:**
- Manage state (source, destination, navigation mode, etc)
- Handle user interactions (button clicks, map interactions)
- Initialize HERE Map SDK
- Coordinate between components
- Render UI

**What it imports:**
```javascript
✓ React hooks (useState, useEffect, useRef, useCallback)
✓ React Native components (View, Text, TouchableOpacity, etc)
✓ Navigation utilities (getCurrentLocation, watchCurrentLocation)
✓ Route calculation service
✓ Custom hooks (useSmoothLocation)
✓ UI Components (NavigationControls, NavigationInfo, HereSearchCard)
✓ Utility functions (math, validation, polyline decoders)
✓ Constants (navigation settings)
```

---

### **2. Components/** (Reusable UI)

#### **NavigationControls.js**
**Purpose:** Toolbar with map control buttons
**Exports:**
- `ToolbarButton` - Single button component
- `NavigationControls` - Full toolbar (6 buttons)

**Features:**
- Shows/hides based on navigation mode
- Buttons: Camera, Markers, Location, Route, Navigate, Clear

---

#### **NavigationInfo.js**
**Purpose:** Display navigation information
**Exports:**
- `NavigationInfo` - Info display component

**Features:**
- Shows during navigation: ETA, distance, arrival time, Stop button
- Shows during preview: route distance & duration
- Renders nothing when no relevant data

---

### **3. Hooks/** (Custom React Logic)

#### **useSmoothLocation.js**
**Purpose:** Smooth GPS location updates with animation
**Exports:**
- `useSmoothLocation()` - Custom hook
- Re-exports: `isValidCoord`, `isUsableNavCoord`

**Key Features:**
- Animates position changes smoothly (700ms duration)
- Calculates bearing from previous position
- Calculates speed from distance/time
- Observer pattern (subscribe/unsubscribe)
- Ref-based state for performance

**Usage in HereMapScreen:**
```javascript
const smooth = useSmoothLocation();
smooth.pushLocation(lat, lng, bearing, speed);  // Push new GPS fix
const unsub = smooth.subscribe(pos => {...});   // Listen to updates
smooth.cleanup();                               // Cleanup
```

---

### **4. Services/** (Business Logic)

#### **Route + Search API**
**Purpose:** Central HERE API service logic
**Location:** `src/services/hereTruckService.js`

**Exports:**
- `autosuggest(query, coords, limit)` - HERE location suggestions
- `calculateTruckRouteREST(origin, destination, vehicle)` - HERE truck routing API
- `lookup(placeId)` - HERE place lookup helper
- `findSequence(params)` - HERE sequence optimization helper

**Why it lives outside HereMapScreen/**
- `HereMapScreen` uses the shared service for route and autosuggest data
- Search and route logic are centralized for reuse
- The screen folder no longer has an active local route service implementation

---

### **5. Utils/** (Pure Functions)

#### **coordinateValidation.js**
**Purpose:** Validate GPS coordinates
**Exports:**
- `isValidCoord(lat, lng)` - Check if lat/lng are valid numbers
- `isUsableNavCoord(lat, lng)` - Check if valid AND not Null Island (0,0)

---

#### **mathUtils.js**
**Purpose:** Math calculations for navigation
**Exports:**
- `haversineDistanceMeters(lat1, lng1, lat2, lng2)` - Distance between two points
- `computeBearing(fromLat, fromLng, toLat, toLng)` - Direction angle
- `smallestBearingDelta(a, b)` - Smallest angle difference
- `lerp(a, b, t)` - Linear interpolation
- `lerpBearing(from, to, t)` - Bearing interpolation
- `projectPointOnSegment(...)` - Project point onto line segment
- `directionAwareSnap(...)` - Intelligent point snapping to route
- `sanitizeRouteCoords(coords, origin, dest)` - Clean & validate route coordinates
- `resolveLiveSpeedMps(position)` - Extract speed from position object

---

#### **polylineDecoder.js**
**Purpose:** Decode polyline encoding formats
**Exports:**
- `decodeFlexiblePolyline(encoded)` - Decode HERE Flexible Polyline format
- `decodeGooglePolyline(encoded)` - Decode Google Polyline format (fallback)

**Why two decoders?**
- HERE API v7 can return either format
- Tries Flexible first, falls back to Google if returns 0 coords

---

### **6. Constants/** (Configuration)

> Note: `HereSearchCard` is no longer registered as a separate navigation screen. It is rendered directly inside `HereMapScreen` as an overlay component.


#### **navigationConstants.js**
**Purpose:** Centralize all navigation settings
**Constants:**
```javascript
// Camera & Animation
NAVIGATION_ZOOM = 14.0
NAVIGATION_CAMERA_DURATION_MS = 220
NAVIGATION_MARKER_ANIMATION_MS = 120

// Movement Thresholds
NAVIGATION_MIN_MOVE_METERS = 0.2
NAVIGATION_MIN_TURN_DEGREES = 0.5
NAVIGATION_MIN_SPEED_MPS = 1.8

// Rerouting Logic
REROUTE_INTERVAL_MS = 12000          // Check for reroute every 12 sec
OFF_ROUTE_THRESHOLD = 55             // meters
WRONG_WAY_BEARING_THRESHOLD = 135    // degrees

// Map Markers & Styling
NAVIGATION_MARKER = {size: 120, iconAsset: 'truck_icon.svg'}
NAVIGATION_ROUTE_WIDTH = 14

// Default Locations
ORIGIN = {lat: 50.1109, lng: 8.6821}
DESTINATION = {lat: 48.1374, lng: 11.5755}
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    HereMapScreen.js                         │
│                    (Main Component)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         ┌──────▼──────┐     │      ┌──────▼──────┐
         │  Components │     │      │    Hooks    │
         ├─────────────┤     │      ├─────────────┤
         │ Navigation  │     │      │   Smooth    │
         │ Controls    │     │      │  Location   │
         │             │     │      │  (GPS Anim) │
         │ Navigation  │     │      └─────────────┘
         │ Info        │     │
         └─────────────┘     │
                         ┌───▼────────┐
                         │   Utils    │
                         ├────────────┤
                         │ Validation │
                         │   Math     │
                         │  Decoder   │
                         └────────────┘

GPS Position Input
       ↓
useSmoothLocation Hook (Animation)
       ↓
HereMapScreen subscribes to smooth location
       ↓
Update map marker position & camera
       ↓
Check for reroute conditions
       ↓
Calculate new route (if needed)
       ↓
Extract polyline & setup geometry
       ↓
Display on map
```

---

## 🎯 Component Integration

### **Navigation Flow:**

1. **User selects destination** → HereSearchCard updates state
2. **Preview route** → `calculateTruckRouteREST()` from `src/services/hereTruckService.js` → extractRoutePolyline → setup geometry
3. **User taps Navigate** → handleStartNavigation
4. **GPS watch starts** → watchCurrentLocation callback
5. **Each GPS fix:**
   - smooth.pushLocation() updates animated position
   - Smooth location hook fires subscriber
   - HereMapScreen.useEffect subscription callback:
     - Snap to route (if geometry exists)
     - Update marker & camera
     - Check reroute conditions
     - Periodic reroute check (every 12 sec)
6. **Reroute triggered:**
   - calculateTruckRouteREST (new route)
   - updateRouteGeometryOnly (redraw polyline)
7. **Navigation ends** → stopNavigation (cleanup)

---

## ✅ Benefits of This Refactoring

| Before | After |
|--------|-------|
| 1,900+ lines in one file | 1,376 lines (split across 10 files) |
| Hard to test | Each utility is testable |
| Duplicate logic | DRY principle applied |
| Tightly coupled | Loosely coupled modules |
| Hard to reuse | Components & hooks are reusable |
| One responsibility | Single Responsibility Principle |

---

## 🚀 How to Use Components

### **Add to another screen:**
```javascript
// Use the same utilities
import {useSmoothLocation} from '../HereMapScreen/hooks/useSmoothLocation';
import {computeBearing} from '../HereMapScreen/utils/mathUtils';

// Or reuse components
import {NavigationInfo} from '../HereMapScreen/components/NavigationInfo';
```

### **Extend functionality:**
```javascript
// Add new utility
export function newMathFunction() { ... }

// Add new component
export function NewComponent() { ... }

// Use in HereMapScreen.js
import {newMathFunction} from './utils/mathUtils';
```

---

## 📌 Key Implementation Details

### **Refs vs State:**
- **State** - For UI updates (sourceLocation, destinationLocation, isNavigating)
- **Refs** - For performance (routeGeometryRef, smooth.smoothPos.current)

### **Subscription Pattern (useSmoothLocation):**
- Hook maintains list of subscribers
- Each GPS update notifies all subscribers
- Subscribers can unsubscribe to prevent memory leaks

### **Direction-Aware Snapping:**
- Not just nearest point on route
- Respects vehicle heading direction
- Prevents lateral jumping

### **Rerouting Logic:**
- Periodic check (every 12 sec)
- Immediate check if off-route (>55m)
- Wrong-way detection with streak counter
