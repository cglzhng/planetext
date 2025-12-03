# README

2D text editor with structured change tracking and versioning.

Dependencies: npm, Electron

## Usage

Click anywhere on the canvas to start typing!

Right-click anywhere to deselect the current selection.

Use the scroll wheel to zoom, and middle-click anywhere to pan.

Click and drag the border of a textbox to move it. Groups are formed automatically based on the location of textboxes!

Click any change in either the chronological sidebar or the group sidebar to view that specific change. 

**Note:** Clicking in the chronological sidebar is considered identical to "undo" and "redo" actions, which are also available as keybindings: CTRL+U and CTRL+R. This is different from CTRL+Z and CTRL+SHIFT+Z, which is the Electron-level undo and redo that operates only on the typed contents.



## Installation

To build:

```
npm install
```

To run:

```
npm run start
```

Depending on your system, you may need to configure Electron if it produces errors.

