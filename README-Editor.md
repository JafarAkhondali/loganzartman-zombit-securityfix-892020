Using the Editor
================
v137

Basic operations
----------------
- *View editor tasks* - Open the controls menu in the top left, and expand the *Editor* tab.
- *Create a level* - Begin by modifying the current level, or by creating a blank level of a desired size.
- *Modify a level* - Levels consist of tiles and lights.  Check the *enabled* box to start editing.
- *Load an ingame level* - the *loadLevel* button can be used to load levels in the game's */level/* directory.
- *Load a level* - Levels can be loaded from local files.  Use the *loadLocal* button.

Tiles
-----
- *Place tiles* - left click or drag to place single tiles of the selected type.  Right click and drag to fill an area.
- *Select tile type* - press enter and begin typing.  A list of potential tiles will appear.  Press enter again to select a type.
- *Remove tiles* - simply overwrite with tiles of another type.  You may create empty tiles, if you really want to.

Lights
------
- *Create lights* - left click to place a light underneath the cursor.
- *Remove lights* - hover over the handle for a light, and right click on it.
- *Change light colors, etc.* - expand the *Light Settings* tab and choose desired settings.  To edit existing lights, you must remove and replace them.

Creating and testing a level
----------------------------
1. Modify the current level, or use *generateBlankLevel* to create a new one.
2. Check the *enabled* box to begin editing.
3. To edit tiles, uncheck the *editLights* box.  To edit lights, check the *editLights* box.
4. Once you are done, press the *exportLevel* button.  A new tab will be opened containing level data.
5. Save the file (CTRL+S), giving it a name such as "myLevel.json"
6. You can now load your level using the loadLocal button.
