# Tiled

## 1. Defining Tile Collisions in the Tileset Editor

In Tiled, you can attach **collisions**, **custom properties**, and **rendering metadata directly to individual tiles** inside your `.tsx` Tileset.

Once defined in the Tileset Editor, Tiled applies those properties automatically every time you paint that tile on any layer. Your game code parses the tile metadata at load time, leaving you free to design maps without placing manual object boxes.

Instead of manually creating object layers on every map, define hitboxes once inside the **Tile Collision Editor**.

1. Open your external Tileset (`.tsx`) file in Tiled.
2. Select a tile (e.g., a tree, rock, or wall).
3. Click the **Tile Collision Editor** icon in the top toolbar.
4. Draw collision shapes (rectangles, polygons, circles) over the tile. For 3D cubes or trees, draw the shape **only at the base/footprint** of the tile.

```text
+-------------------+
|     Tree Top      | <-- Walkable (behind canopy)
|    (No Hitbox)    |
+-------------------+
|  [===HITBOX===]   | <-- Collision shape drawn in Tile Collision Editor
|    Tree Trunk     |
+-------------------+

```


## 2. Adding Custom Tile Properties (e.g., Height, Sort Offset)

To set custom properties for Y-sorting, layers, or 3D heights:

1. Select the tile in the Tileset editor.
2. In the **Properties panel** on the left, click the **`+` (Add Property)** button.
3. Add properties such as:
    * **`isSolid`** (`bool`) = `true`
    * **`height3D`** (`float`) = `32.0`
    * **`sortOffset`** (`float`) = `16.0` (Distance from top-left to the baseline feet)



*Tip: In Tiled's **Project Settings**, you can create a **Custom Class** (e.g., `BuildingBlock` containing `height3D` and `isSolid` fields) and assign that class to your tiles to populate all properties instantly.*


## 3. Parsing Tile Metadata in C++

When you paint tiles onto a standard Tile Layer and export to JSON, the JSON map lists tile IDs (`gids`). You can look up the tile ID in your loaded tileset metadata to generate colliders and render passes dynamically:

```cpp
#include <vector>
#include "raylib.h"
#include "nlohmann/json.hpp"

struct WorldTileCollider {
    Rectangle rect;
};

// Process map layers and extract colliders using tileset definitions
std::vector<WorldTileCollider> GenerateMapColliders(const nlohmann::json& mapJson, const nlohmann::json& tilesetJson) {
    std::vector<WorldTileCollider> colliders;

    int mapWidth = mapJson["width"];
    int tileWidth = mapJson["tilewidth"];
    int tileHeight = mapJson["tileheight"];

    // 1. Build a lookup table for tile collision boxes from the tileset
    std::map<int, Rectangle> tileCollisionLookup;
    
    for (const auto& tile : tilesetJson["tiles"]) {
        int id = tile["id"];
        if (tile.contains("objectgroup")) { // Object group created in Tile Collision Editor
            for (const auto& obj : tile["objectgroup"]["objects"]) {
                tileCollisionLookup[id] = {
                    (float)obj["x"],
                    (float)obj["y"],
                    (float)obj["width"],
                    (float)obj["height"]
                };
            }
        }
    }

    // 2. Iterate through painted map layers
    for (const auto& layer : mapJson["layers"]) {
        if (layer["type"] == "tilelayer") {
            const auto& data = layer["data"];
            
            for (size_t i = 0; i < data.size(); ++i) {
                int tileGid = data[i];
                if (tileGid == 0) continue; // Empty tile

                int tileId = tileGid - 1; // Assuming 1 tileset starting at GID 1

                // If this tile type has a predefined collision shape, add it to world colliders
                if (tileCollisionLookup.find(tileId) != tileCollisionLookup.end()) {
                    int gridX = i % mapWidth;
                    int gridY = i / mapWidth;

                    Rectangle localBox = tileCollisionLookup[tileId];
                    WorldTileCollider col;
                    col.rect = {
                        (float)(gridX * tileWidth) + localBox.x,
                        (float)(gridY * tileHeight) + localBox.y,
                        localBox.width,
                        localBox.height
                    };
                    colliders.push_back(col);
                }
            }
        }
    }

    return colliders;
}

```


## 4. Automatic Y-Sorting While Painting

For Y-sorting on painted tiles, you have two painting options depending on map scale:

| Approach | How it Works | Best For |
| --- | --- | --- |
| **Multi-Layer Painting** | Paint ground tiles on `Ground Layer`, stems/bases on `World Layer`, and tops/roofs on `Overhead Layer`. | Cities, dense maps, performance-heavy scenes. |
| **Tile-to-Object Conversion** | Paint tiles using Tiled's **Insert Tile** tool on an **Object Layer** (or convert tile layers into renderable structs in code). | Free-standing 3D cubes, rocks, and trees requiring depth-sorting relative to the player. |
