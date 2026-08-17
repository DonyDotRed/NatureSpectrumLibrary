# Changelog

## 1.3.0 — Decay Lab quick nuclide selection

- Added multi-select **Origin** quick filters in Decay Lab using the dataset's actual origin classes.
- Added half-life groups: **short (< 1 d)**, **medium (1 d to < 1 y)**, **long (≥ 1 y)**.
- Origin selections are OR within the Origin group; half-life selections are OR within the half-life group; Origin × half-life × search are combined with AND.
- Added **Select filtered**, **Clear filtered**, and **Reset filters** for fast bulk selection without removing the existing individual checkbox workflow.
- Added live `Matched / Total / Selected` counts.
- Preserved the v1.2 default decay chart: **X = Time (d) · linear**, **Y = Activity (mCi) · linear**.
- Bumped web asset cache-busting to v1.3.0 and service-worker shell cache to v4.

## 1.2.0 — Standard decay-chart orientation

- Changed the Decay Lab default orientation to **X = Time, Y = Activity**.
- Default X axis is **Time (d) · linear**.
- Default Y axis is **Activity (mCi) · linear**.
- `Reset` now restores the standard decay-chart orientation.
- Axis swap, unit conversion, and independent X/Y Linear/Log controls remain available.
- Bumped the service-worker shell cache to v3 and added asset cache-busting for immediate update after deployment.

## 1.1.0 — Multi-nuclide Decay Lab

- Added multi-nuclide physical radioactive-decay line chart.
- Default activity unit: mCi.
- Default time unit: d.
- Default axis assignment: X = activity, Y = time, with one-click axis swap.
- Independent Linear/Log controls for both X and Y axes.
- Activity units: Bq, kBq, MBq, GBq, nCi, µCi, mCi, Ci.
- Time units: s, min, h, d, wk, mo, y.
- Per-nuclide initial activity, series visibility, normalized A/A0 (%), readout table, auto time horizon, and CSV export.
- Added “Add to Decay Lab” from nuclide detail drawer.
- Updated service-worker shell cache to v2.
- Updated design specification and user guide.
