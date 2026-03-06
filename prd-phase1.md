# PRD - Phase 1: Core Temperature Exploration
## Kandilli Temperature Visual Exploration Platform

**Version:** 1.1
**Date:** March 2026
**Scope:** Warming Charts + Seasonal Onset Detection + Daily Data Viewer

---

## 1. Overview

### 1.1 Purpose
This document defines the requirements for **Phase 1** of the Kandilli Temperature Visual Exploration Platform. Phase 1 focuses on three core features:

1. **Warming Chart With Different Scales** - Flexible temperature trend exploration
2. **Shift in Seasonal Onset** - Season boundary detection and analysis
3. **Daily Data Viewer** - Hourly data display with original document preview

### 1.2 Out of Scope (Future Phases)
- Extreme Heat/Cool Analysis (Tab 4)
- Variability Analysis (Tab 5)
- Cyclicality Detection (Tab 6)
- Advanced export features
- User authentication

### 1.3 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React + Vite + TypeScript |
| Charts | Recharts |
| State | Zustand |
| Styling | Tailwind CSS |
| Data Parsing | xlsx / SheetJS |
| Date Handling | date-fns |

---

## 2. Data Foundation

### 2.1 Source Data
- **File:** `Sicaklik renk.xlsx`
- **Format:** Date column + 24 hourly temperature columns
- **Range:** 1934 - present (~90 years)
- **Location:** Kandilli Observatory, Istanbul

### 2.2 Derived Daily Metrics

| Metric | Calculation | Description |
|--------|-------------|-------------|
| `dailyAvg` | Mean of 24 hours | Overall thermal character |
| `dailyMin` | Minimum of 24 hours | Night/coldest point |
| `dailyMax` | Maximum of 24 hours | Peak daytime heat |

### 2.3 Aggregation Scales

| Scale | Grouping Logic |
|-------|----------------|
| Daily | Individual day values |
| Weekly | ISO week (Mon-Sun) |
| Monthly | Calendar month |
| Seasonal | DJF, MAM, JJA, SON |
| Yearly | Calendar year |

### 2.4 Data Types

```typescript
interface HourlyRecord {
  date: Date;
  hours: number[]; // 24 values
}

interface DailyRecord {
  date: Date;
  year: number;
  month: number;
  dayOfYear: number;
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
}

interface AggregatedRecord {
  periodStart: Date;
  periodEnd: Date;
  scale: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'yearly';
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
  recordCount: number;
}
```

---

## 3. Temperature Categories

### 3.1 Daily Average Temperature

| Category | Range | Color |
|----------|-------|-------|
| Cold Day | < 0°C | #4575B4 |
| Cool Day | 0 - 10°C | #91BFDB |
| Warm Day | 10 - 25°C | #FEE090 |
| Summer-like Day | > 25°C | #D73027 |

### 3.2 Daily Maximum Temperature

| Category | Range | Color |
|----------|-------|-------|
| Cold Maximum | < 5°C | #4575B4 |
| Mild Maximum | 5 - 20°C | #91BFDB |
| Hot Day | 20 - 30°C | #FDAE61 |
| Extreme Heat | > 30°C | #D73027 |

### 3.3 Daily Minimum Temperature

| Category | Range | Color |
|----------|-------|-------|
| Freezing Night | < 0°C | #4575B4 |
| Cold Night | 0 - 10°C | #91BFDB |
| Mild Night | 10 - 20°C | #FEE090 |
| Tropical Night | > 20°C | #D73027 |

---

## 4. Feature 1: Warming Chart With Different Scales

### 4.1 Purpose
Allow users to explore temperature trends across different time scales and intervals. This is the primary exploration tool for understanding long-term warming patterns.

### 4.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-1.1 | As a user, I want to select a date range so I can focus on a specific period | Critical |
| US-1.2 | As a user, I want to choose an aggregation scale (daily/weekly/monthly/seasonal/yearly) so I can see data at different granularities | Critical |
| US-1.3 | As a user, I want to select a temperature metric (avg/min/max) so I can analyze different aspects | Critical |
| US-1.4 | As a user, I want to filter by specific months so I can compare the same months across years | High |
| US-1.5 | As a user, I want to see a trend line so I can identify warming patterns | High |
| US-1.6 | As a user, I want to compare different periods visually | Medium |

### 4.3 Functional Requirements

#### 4.3.1 Controls

| ID | Requirement | Type | Priority |
|----|-------------|------|----------|
| WC-01 | Date range picker with start and end date | Input | Critical |
| WC-02 | Aggregation scale selector (daily, weekly, monthly, seasonal, yearly) | Dropdown | Critical |
| WC-03 | Metric selector (average, minimum, maximum temperature) | Radio/Toggle | Critical |
| WC-04 | Month filter - select one or multiple months | Multi-select | High |
| WC-05 | Seasonal preset buttons (Winter: DJF, Spring: MAM, Summer: JJA, Fall: SON) | Buttons | Medium |
| WC-06 | Trend line toggle (show/hide smoothed trend) | Toggle | High |
| WC-07 | Moving average window selector (7, 14, 30, 90 days) | Dropdown | Medium |

#### 4.3.2 Chart Display

| ID | Requirement | Priority |
|----|-------------|----------|
| WC-08 | Line chart showing temperature over selected period | Critical |
| WC-09 | X-axis: time (formatted based on scale) | Critical |
| WC-10 | Y-axis: temperature in Celsius | Critical |
| WC-11 | Hover tooltip showing exact date and value | Critical |
| WC-12 | Optional trend line overlay (linear regression or moving average) | High |
| WC-13 | Color coding based on temperature categories | Medium |
| WC-14 | Legend showing metric and any overlays | Medium |

#### 4.3.3 Month Filtering Logic

When user selects specific months (e.g., June, July, August):
1. Filter data to include only those months
2. Aggregate according to selected scale
3. Display continuous or grouped view

**Example:** User selects 1950-2020, Monthly scale, only July
- Result: 70 data points (July average for each year)

**Example:** User selects 1950-2020, Yearly scale, June-July-August
- Result: 70 data points (summer average for each year)

### 4.4 UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  WARMING CHART                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────────┐  │
│  │ Start: 1950     │ │ End: 2020       │ │ Scale: Monthly    ▼ │  │
│  └─────────────────┘ └─────────────────┘ └──────────────────────┘  │
│                                                                     │
│  Metric: ○ Average  ○ Minimum  ○ Maximum                           │
│                                                                     │
│  Months: [Jan] [Feb] [Mar] [Apr] [May] [Jun]                       │
│          [Jul] [Aug] [Sep] [Oct] [Nov] [Dec]  [Clear All]          │
│                                                                     │
│  Presets: [Winter] [Spring] [Summer] [Fall] [All Year]             │
│                                                                     │
│  ☑ Show Trend Line    Window: [30 days ▼]                          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  25°C ┤                                            ╭──╮            │
│       │                                       ╭───╯  ╰──╮          │
│  20°C ┤                               ╭──────╯          │          │
│       │                         ╭────╯                  ╰──        │
│  15°C ┤                   ╭────╯                                   │
│       │            ╭─────╯                                         │
│  10°C ┤     ╭─────╯                                                │
│       │ ───╯                                                       │
│   5°C ┤                                                            │
│       ├────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬──  │
│       1950 1955 1960 1965 1970 1975 1980 1985 1990 1995 2000      │
│                                                                     │
│  ─── July Average Temperature    ─── Trend Line                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.5 Edge Cases

| Case | Handling |
|------|----------|
| No data for selected period | Show empty state with message |
| Missing data points | Skip in aggregation, show gaps |
| Single data point | Show point, disable trend line |
| Date range < scale | Show warning, suggest smaller scale |

---

## 5. Feature 2: Shift in Seasonal Onset

### 5.1 Purpose
Detect and visualize how season boundaries (warm/cool periods) have shifted over time. Show whether summer-like or winter-like days are becoming more or less frequent.

### 5.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-2.1 | As a user, I want to see when the warm season started each year | Critical |
| US-2.2 | As a user, I want to see when the cool season started each year | Critical |
| US-2.3 | As a user, I want to configure the threshold for season detection | High |
| US-2.4 | As a user, I want to see if seasons are starting earlier or later over time | Critical |
| US-2.5 | As a user, I want to count summer-like days per year | High |
| US-2.6 | As a user, I want to count winter-like days per year | High |
| US-2.7 | As a user, I want to see season duration changes | High |

### 5.3 Season Detection Methods

#### 5.3.1 Method A: Consecutive Days Rule

Season starts when temperature crosses threshold for X consecutive days.

```
Warm Season Start:
- Daily avg temp > threshold (default: 15°C)
- For N consecutive days (default: 7)
- First day of the streak = season start

Cool Season Start:
- Daily avg temp < threshold (default: 10°C)
- For N consecutive days (default: 7)
- First day of the streak = season start
```

#### 5.3.2 Method B: Moving Average Rule

Season starts when moving average crosses threshold.

```
Warm Season Start:
- X-day moving average (default: 7 days)
- Crosses above threshold (default: 15°C)
- Crossing date = season start

Cool Season Start:
- X-day moving average (default: 7 days)
- Crosses below threshold (default: 10°C)
- Crossing date = season start
```

### 5.4 Functional Requirements

#### 5.4.1 Controls

| ID | Requirement | Type | Priority |
|----|-------------|------|----------|
| SO-01 | Year range selector | Input | Critical |
| SO-02 | Detection method selector (Consecutive Days / Moving Average) | Toggle | High |
| SO-03 | Warm season threshold input (default: 15°C) | Number Input | Critical |
| SO-04 | Cool season threshold input (default: 10°C) | Number Input | Critical |
| SO-05 | Consecutive days count (default: 7) | Number Input | High |
| SO-06 | Moving average window (default: 7 days) | Number Input | High |
| SO-07 | Metric selector (avg/min/max temperature) | Radio | High |
| SO-08 | Summer-like day threshold (default: avg > 25°C) | Number Input | High |
| SO-09 | Winter-like day threshold (default: avg < 0°C) | Number Input | High |

#### 5.4.2 Outputs & Visualizations

| ID | Requirement | Priority |
|----|-------------|----------|
| SO-10 | Table showing season start/end dates per year | Critical |
| SO-11 | Line chart: warm season start date (day of year) over years | Critical |
| SO-12 | Line chart: cool season start date (day of year) over years | Critical |
| SO-13 | Trend line showing if seasons are shifting | High |
| SO-14 | Bar chart: season duration per year | High |
| SO-15 | Bar chart: summer-like days count per year | High |
| SO-16 | Bar chart: winter-like days count per year | High |
| SO-17 | Summary statistics (average shift, trend direction) | Medium |

#### 5.4.3 Computed Metrics

| Metric | Calculation |
|--------|-------------|
| Warm Season Start | Day of year when warm threshold is met |
| Warm Season End | Day of year when temperature drops below threshold |
| Cool Season Start | Day of year when cool threshold is met |
| Cool Season End | Day of year when temperature rises above threshold |
| Warm Season Duration | Days between start and end |
| Cool Season Duration | Days between start and end |
| Summer-like Days | Count of days with avg temp > 25°C |
| Winter-like Days | Count of days with avg temp < 0°C |
| Trend (days/decade) | Linear regression slope of start date |

### 5.5 UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  SEASONAL ONSET SHIFT                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Year Range: [1950] to [2020]     Metric: ○ Avg ○ Min ○ Max        │
│                                                                     │
│  Detection Method: ○ Consecutive Days  ○ Moving Average            │
│                                                                     │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  │
│  │ WARM SEASON                 │  │ COOL SEASON                 │  │
│  │ Threshold: [15] °C          │  │ Threshold: [10] °C          │  │
│  │ Consecutive Days: [7]       │  │ Consecutive Days: [7]       │  │
│  └─────────────────────────────┘  └─────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  │
│  │ Summer-like: > [25] °C      │  │ Winter-like: < [0] °C       │  │
│  └─────────────────────────────┘  └─────────────────────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  SEASON START DATE TREND                                           │
│                                                                     │
│  Day   ┤                                                           │
│  150   ┤  ●                                                        │
│        │    ●  ●     ●                                             │
│  140   ┤       ●  ●     ●  ●                                       │
│        │                   ●  ●  ●                                 │
│  130   ┤                          ●  ●  ●                          │
│        │                                ●  ●  ●  ●                 │
│  120   ┤                                         ●  ●  ● ────      │
│        ├────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────    │
│        1950 1955 1960 1965 1970 1975 1980 1985 1990 1995 2000     │
│                                                                     │
│  ● Warm Season Start   ─── Trend (-2.3 days/decade)                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  SUMMER-LIKE DAYS PER YEAR                                         │
│                                                                     │
│  Days  ┤                                            ████           │
│   80   ┤                                       ████ ████           │
│        │                                  ████ ████ ████ ████      │
│   60   ┤                             ████ ████ ████ ████ ████      │
│        │                   ████ ████ ████ ████ ████ ████ ████      │
│   40   ┤         ████ ████ ████ ████ ████ ████ ████ ████ ████      │
│        │    ████ ████ ████ ████ ████ ████ ████ ████ ████ ████      │
│   20   ┤    ████ ████ ████ ████ ████ ████ ████ ████ ████ ████      │
│        ├────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────    │
│        1950 1955 1960 1965 1970 1975 1980 1985 1990 1995 2000     │
│                                                                     │
│  Trend: +4.2 days/decade                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.6 Summary Panel

Display key insights:

```
┌─────────────────────────────────────────────────────────────────────┐
│  SUMMARY (1950-2020)                                               │
├──────────────────────┬──────────────────────────────────────────────┤
│  Warm Season         │  Starting 16 days earlier than 1950         │
│                      │  Trend: -2.3 days/decade                    │
├──────────────────────┼──────────────────────────────────────────────┤
│  Cool Season         │  Starting 12 days later than 1950           │
│                      │  Trend: +1.7 days/decade                    │
├──────────────────────┼──────────────────────────────────────────────┤
│  Summer-like Days    │  Increased from 42 to 78 days               │
│                      │  Trend: +4.2 days/decade                    │
├──────────────────────┼──────────────────────────────────────────────┤
│  Winter-like Days    │  Decreased from 28 to 11 days               │
│                      │  Trend: -2.4 days/decade                    │
└──────────────────────┴──────────────────────────────────────────────┘
```

---

## 6. Feature 3: Daily Data Viewer

### 6.1 Purpose
Allow users to select a specific date and view:
- **Left Panel:** Hourly temperature readings (digital display, 24 values)
- **Right Panel:** Original scanned document (TIFF image preview)

This provides verification capability by showing the digitized data alongside the original source document.

### 6.2 Data Sources

#### 6.2.1 Hourly Data
- Source: `Sicaklik renk.xlsx`
- 24 temperature values per day
- Available for full dataset range (1934-present)

#### 6.2.2 TIFF Documents
- Location: `/gunluk/` folder
- Naming convention: `{YEAR}_{MONTH_TURKISH}-{DAY}.tif`
- Turkish month names: OCAK, ŞUBAT, MART, NİSAN, MAYIS, HAZİRAN, TEMMUZ, AĞUSTOS, EYLÜL, EKİM, KASIM, ARALIK
- Examples:
  - `1980_ARALIK-01.tif` (December 1, 1980)
  - `1990_ŞUBAT-28.tif` (February 28, 1990)

### 6.3 User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-3.1 | As a user, I want to select a date to view its hourly data | Critical |
| US-3.2 | As a user, I want to see all 24 hourly temperatures in a readable format | Critical |
| US-3.3 | As a user, I want to see the original TIFF document for verification | Critical |
| US-3.4 | As a user, I want to zoom/pan the TIFF image | Medium |
| US-3.5 | As a user, I want to navigate between days easily (prev/next) | High |
| US-3.6 | As a user, I want to see daily summary (avg/min/max) alongside hourly data | Medium |

### 6.4 Functional Requirements

#### 6.4.1 Controls

| ID | Requirement | Type | Priority |
|----|-------------|------|----------|
| DV-01 | Date picker to select any date in dataset | Input | Critical |
| DV-02 | Previous day navigation button | Button | High |
| DV-03 | Next day navigation button | Button | High |
| DV-04 | Jump to date input (quick navigation) | Input | Medium |
| DV-05 | Show data availability indicator | Visual | Medium |

#### 6.4.2 Left Panel - Hourly Data Display

| ID | Requirement | Priority |
|----|-------------|----------|
| DV-06 | Display 24 hourly temperature values | Critical |
| DV-07 | Show hour labels (00:00, 01:00, ... 23:00) | Critical |
| DV-08 | Color-code values based on temperature categories | High |
| DV-09 | Show daily summary: avg, min, max | High |
| DV-10 | Highlight min and max hours | Medium |
| DV-11 | Show mini line chart of hourly progression | Medium |
| DV-12 | Handle missing data gracefully (show N/A or --) | High |

#### 6.4.3 Right Panel - TIFF Preview

| ID | Requirement | Priority |
|----|-------------|----------|
| DV-13 | Load and display TIFF image for selected date | Critical |
| DV-14 | Show loading indicator while TIFF loads | High |
| DV-15 | Show "Document not available" if TIFF missing | High |
| DV-16 | Zoom in/out controls | Medium |
| DV-17 | Pan/scroll within zoomed image | Medium |
| DV-18 | Reset zoom button | Medium |
| DV-19 | Full-screen view option | Low |

#### 6.4.4 TIFF File Mapping Logic

```typescript
function getTiffFilename(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const day = date.getDate();

  const turkishMonths = [
    'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
    'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'
  ];

  const monthName = turkishMonths[month];
  const dayStr = day.toString().padStart(2, '0');

  return `${year}_${monthName}-${dayStr}.tif`;
}

// Example: 1980-12-01 → "1980_ARALIK-01.tif"
// Example: 1990-02-28 → "1990_ŞUBAT-28.tif"
```

### 6.5 UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DAILY DATA VIEWER                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Date: [◀] [ December 15, 1980 ] [▶]      [ Jump to date... ]              │
│                                                                             │
├─────────────────────────────────┬───────────────────────────────────────────┤
│  HOURLY TEMPERATURES            │  ORIGINAL DOCUMENT                        │
│                                 │                                           │
│  ┌───────────────────────────┐  │  ┌─────────────────────────────────────┐  │
│  │ Hour    Temperature       │  │  │                                     │  │
│  ├───────────────────────────┤  │  │   ┌─────────────────────────────┐   │  │
│  │ 00:00   5.2°C        ██   │  │  │   │                             │   │  │
│  │ 01:00   5.0°C        ██   │  │  │   │    [TIFF IMAGE PREVIEW]     │   │  │
│  │ 02:00   5.0°C        ██   │  │  │   │                             │   │  │
│  │ 03:00   4.5°C        █    │  │  │   │    Scanned meteorological   │   │  │
│  │ 04:00   4.2°C        █    │  │  │   │    record sheet showing     │   │  │
│  │ 05:00   4.2°C        █    │  │  │   │    handwritten temperature  │   │  │
│  │ 06:00   4.2°C        █    │  │  │   │    observations             │   │  │
│  │ 07:00   4.2°C        █    │  │  │   │                             │   │  │
│  │ 08:00   5.2°C        ██   │  │  │   │                             │   │  │
│  │ 09:00   6.4°C        ██   │  │  │   │                             │   │  │
│  │ 10:00   7.1°C     ↑ ███   │  │  │   │                             │   │  │
│  │ 11:00   7.8°C  MAX  ███   │  │  │   └─────────────────────────────┘   │  │
│  │ 12:00   7.8°C       ███   │  │  │                                     │  │
│  │ 13:00   7.8°C       ███   │  │  │   [Zoom +] [Zoom -] [Reset] [⛶]    │  │
│  │ 14:00   7.3°C       ███   │  │  │                                     │  │
│  │ 15:00   5.8°C        ██   │  │  └─────────────────────────────────────┘  │
│  │ 16:00   5.1°C        ██   │  │                                           │
│  │ 17:00   5.0°C        ██   │  │  File: 1980_ARALIK-15.tif                 │
│  │ 18:00   5.0°C        ██   │  │  Status: ✓ Available                      │
│  │ 19:00   5.2°C        ██   │  │                                           │
│  │ 20:00   5.5°C        ██   │  │                                           │
│  │ 21:00   5.9°C        ██   │  │                                           │
│  │ 22:00   5.9°C        ██   │  │                                           │
│  │ 23:00   5.9°C        ██   │  │                                           │
│  └───────────────────────────┘  │                                           │
│                                 │                                           │
│  ┌───────────────────────────┐  │                                           │
│  │ DAILY SUMMARY             │  │                                           │
│  │ Average: 5.6°C            │  │                                           │
│  │ Minimum: 4.2°C (04:00)    │  │                                           │
│  │ Maximum: 7.8°C (11:00)    │  │                                           │
│  │ Range:   3.6°C            │  │                                           │
│  └───────────────────────────┘  │                                           │
│                                 │                                           │
│  ┌───────────────────────────┐  │                                           │
│  │  8°C ┤    ╭──╮            │  │                                           │
│  │  6°C ┤───╯    ╰────────── │  │                                           │
│  │  4°C ┤                    │  │                                           │
│  │      └─┬──┬──┬──┬──┬──┬── │  │                                           │
│  │        0  4  8  12 16 20  │  │                                           │
│  └───────────────────────────┘  │                                           │
├─────────────────────────────────┴───────────────────────────────────────────┤
│  Data: ✓ Available (24/24 hours)    Document: ✓ Available                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.6 Edge Cases

| Case | Handling |
|------|----------|
| No hourly data for date | Show empty state: "No temperature data available for this date" |
| Partial hourly data | Show available hours, mark missing as "--" |
| No TIFF file exists | Show placeholder: "Original document not available" |
| TIFF fails to load | Show error state with retry button |
| Date outside dataset range | Disable navigation, show warning |
| Large TIFF file (slow load) | Show loading spinner, progressive rendering |

### 6.7 TIFF Handling Technical Notes

Since browsers cannot natively display TIFF files, we need a solution:

**Option A: Server-side conversion (Recommended for production)**
- Convert TIFF to JPEG/PNG on server
- Serve converted images to browser

**Option B: Client-side conversion (For Phase 1)**
- Use library like `utif.js` or `tiff.js`
- Decode TIFF in browser
- Render to canvas

**Option C: External viewer**
- Provide download link for TIFF
- Open in external application

For Phase 1, we will use **Option B** (client-side) with a JavaScript TIFF decoder.

```typescript
// Recommended library: utif.js
import UTIF from 'utif';

async function loadTiff(url: string): Promise<ImageData> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const ifds = UTIF.decode(buffer);
  UTIF.decodeImage(buffer, ifds[0]);
  const rgba = UTIF.toRGBA8(ifds[0]);
  return new ImageData(
    new Uint8ClampedArray(rgba),
    ifds[0].width,
    ifds[0].height
  );
}
```

---

## 7. Shared Components

### 7.1 Global Header

```
┌─────────────────────────────────────────────────────────────────────┐
│  Kandilli Temperature Explorer                                      │
├─────────────────────────────────────────────────────────────────────┤
│  [Warming Chart]  [Seasonal Onset]  [Daily Viewer]                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Data Info Panel

Show current data status:
- Date range loaded: 1934-01-01 to 2024-12-31
- Total records: ~33,000 days
- Data quality: X% complete
- TIFF documents available: X files

### 7.3 Common UI Components

| Component | Usage |
|-----------|-------|
| DateRangePicker | Select start/end dates |
| DatePicker | Select single date (Daily Viewer) |
| ScaleSelector | Choose aggregation level |
| MetricToggle | Switch between avg/min/max |
| MonthSelector | Multi-select months |
| ThresholdInput | Number input with validation |
| TrendLineToggle | Enable/disable trend overlay |
| ChartContainer | Wrapper with loading/error states |
| Tooltip | Hover information on charts |
| Legend | Chart legend component |
| TiffViewer | TIFF image display with zoom/pan |
| HourlyDataTable | 24-hour temperature display |

---

## 8. Implementation Plan

### 8.1 Sprint Breakdown

#### Sprint 1: Foundation (Week 1-2)

| Task | Description | Priority |
|------|-------------|----------|
| S1-01 | Initialize Vite + React + TypeScript project | Critical |
| S1-02 | Setup Tailwind CSS | Critical |
| S1-03 | Setup Zustand store | Critical |
| S1-04 | Create Excel parser utility | Critical |
| S1-05 | Implement hourly → daily transformation | Critical |
| S1-06 | Implement aggregation functions | Critical |
| S1-07 | Create basic app shell with tab navigation | Critical |
| S1-08 | Unit tests for data processing | High |

**Deliverable:** Data pipeline working, app shell ready

#### Sprint 2: Warming Chart (Week 3-4)

| Task | Description | Priority |
|------|-------------|----------|
| S2-01 | DateRangePicker component | Critical |
| S2-02 | ScaleSelector component | Critical |
| S2-03 | MetricToggle component | Critical |
| S2-04 | MonthSelector component | High |
| S2-05 | Basic line chart with Recharts | Critical |
| S2-06 | Connect chart to data store | Critical |
| S2-07 | Implement month filtering logic | High |
| S2-08 | Add trend line calculation & display | High |
| S2-09 | Tooltip and legend | Medium |
| S2-10 | Loading and empty states | Medium |

**Deliverable:** Fully functional Warming Chart tab

#### Sprint 3: Seasonal Onset (Week 5-6)

| Task | Description | Priority |
|------|-------------|----------|
| S3-01 | Season detection algorithm (consecutive days) | Critical |
| S3-02 | Season detection algorithm (moving average) | High |
| S3-03 | Season onset controls UI | Critical |
| S3-04 | Season start date line chart | Critical |
| S3-05 | Trend line for season shift | High |
| S3-06 | Summer-like days counter | High |
| S3-07 | Winter-like days counter | High |
| S3-08 | Bar charts for day counts | High |
| S3-09 | Summary statistics panel | Medium |
| S3-10 | Connect all to data store | Critical |

**Deliverable:** Fully functional Seasonal Onset tab

#### Sprint 4: Daily Viewer (Week 7-8)

| Task | Description | Priority |
|------|-------------|----------|
| S4-01 | Single date picker component | Critical |
| S4-02 | Day navigation (prev/next buttons) | High |
| S4-03 | Hourly data table component | Critical |
| S4-04 | Daily summary panel | High |
| S4-05 | Mini hourly line chart | Medium |
| S4-06 | TIFF filename mapping utility | Critical |
| S4-07 | TIFF decoder integration (utif.js) | Critical |
| S4-08 | TiffViewer component with canvas | Critical |
| S4-09 | Zoom/pan controls for TIFF | Medium |
| S4-10 | Loading and error states | High |
| S4-11 | Connect all to data store | Critical |

**Deliverable:** Fully functional Daily Viewer tab

#### Sprint 5: Polish (Week 9)

| Task | Description | Priority |
|------|-------------|----------|
| S5-01 | UI polish and consistency | High |
| S5-02 | Responsive design adjustments | Medium |
| S5-03 | Error handling improvements | High |
| S5-04 | Performance optimization | Medium |
| S5-05 | Bug fixes | Critical |
| S5-06 | Basic documentation | Medium |

**Deliverable:** Production-ready Phase 1

---

### 8.2 File Structure

```
src/
├── components/
│   ├── common/
│   │   ├── DateRangePicker.tsx
│   │   ├── DatePicker.tsx
│   │   ├── ScaleSelector.tsx
│   │   ├── MetricToggle.tsx
│   │   ├── MonthSelector.tsx
│   │   ├── ThresholdInput.tsx
│   │   ├── ChartContainer.tsx
│   │   └── TrendLineToggle.tsx
│   ├── warming-chart/
│   │   ├── WarmingChart.tsx
│   │   ├── WarmingControls.tsx
│   │   └── WarmingChartView.tsx
│   ├── seasonal-onset/
│   │   ├── SeasonalOnset.tsx
│   │   ├── SeasonalControls.tsx
│   │   ├── SeasonStartChart.tsx
│   │   ├── DayCountChart.tsx
│   │   └── SeasonalSummary.tsx
│   ├── daily-viewer/
│   │   ├── DailyViewer.tsx
│   │   ├── DayNavigation.tsx
│   │   ├── HourlyDataTable.tsx
│   │   ├── DailySummaryPanel.tsx
│   │   ├── HourlyMiniChart.tsx
│   │   └── TiffViewer.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── TabNavigation.tsx
│       └── DataInfoPanel.tsx
├── hooks/
│   ├── useTemperatureData.ts
│   ├── useAggregation.ts
│   ├── useSeasonDetection.ts
│   ├── useTrendLine.ts
│   ├── useDailyData.ts
│   └── useTiffLoader.ts
├── store/
│   ├── useDataStore.ts
│   ├── useFilterStore.ts
│   └── useSettingsStore.ts
├── utils/
│   ├── dataParser.ts
│   ├── aggregation.ts
│   ├── seasonDetection.ts
│   ├── statistics.ts
│   ├── dateUtils.ts
│   └── tiffUtils.ts
├── types/
│   └── index.ts
├── constants/
│   ├── thresholds.ts
│   └── turkishMonths.ts
├── App.tsx
└── main.tsx
```

---

## 9. Acceptance Criteria

### 9.1 Warming Chart

- [ ] User can select any date range within the dataset
- [ ] All 5 aggregation scales work correctly
- [ ] Switching between avg/min/max updates chart
- [ ] Month filtering produces correct subset
- [ ] Seasonal presets work (DJF, MAM, JJA, SON)
- [ ] Trend line can be toggled on/off
- [ ] Chart renders within 2 seconds
- [ ] Tooltips show correct values
- [ ] Empty states handled gracefully

### 9.2 Seasonal Onset

- [ ] Consecutive days detection produces correct dates
- [ ] Moving average detection produces correct dates
- [ ] Both detection methods can be switched
- [ ] Thresholds are configurable
- [ ] Season start date chart shows all years
- [ ] Trend line shows direction of shift
- [ ] Summer-like days counted correctly
- [ ] Winter-like days counted correctly
- [ ] Summary panel shows accurate statistics
- [ ] All charts render within 2 seconds

### 9.3 Daily Viewer

- [ ] User can select any date within the dataset
- [ ] Previous/next day navigation works correctly
- [ ] All 24 hourly values display correctly
- [ ] Daily summary (avg/min/max) calculated correctly
- [ ] Mini hourly chart renders correctly
- [ ] TIFF filename generated correctly from date
- [ ] TIFF image loads and displays in canvas
- [ ] Zoom in/out works on TIFF viewer
- [ ] Pan/scroll works on zoomed TIFF
- [ ] Missing data handled gracefully (shows "--")
- [ ] Missing TIFF shows "Document not available"
- [ ] TIFF loads within 3 seconds

---

## 10. Dependencies

### 10.1 npm Packages

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "zustand": "^4.4.0",
    "xlsx": "^0.18.5",
    "date-fns": "^3.0.0",
    "clsx": "^2.0.0",
    "utif": "^3.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Warming Chart renders | < 2 seconds |
| Seasonal detection computes | < 1 second |
| Daily Viewer loads | < 1 second (data) |
| TIFF image loads | < 3 seconds |
| All acceptance criteria | 100% pass |
| Data accuracy vs Excel | 100% match |
| Browser support | Chrome, Firefox, Safari |

---

## 12. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial Phase 1 PRD (2 tabs) |
| 1.1 | March 2026 | Added Tab 3: Daily Data Viewer |
