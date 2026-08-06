# Raylib Integration

# Selection

## Mouse selection

1. **`include/Systems/SpatialSystem.hpp`**
* **Defines the Data Structure:** This is where the `_grid` (the 2D container storing entity references) is declared.
* **Defines the Interface:** This declares the methods required to manipulate the grid.

```cpp
#pragma once
#include <vector>
#include "Engine/EntityRegistry.hpp"
#include "Components/PositionComponent.hpp"
#include "Core/Constants.hpp"

class SpatialSystem {
public:
    void Clear();
    void Update(EntityRegistry& registry, const PositionComponent& posComp);
    const std::vector<int32_t>& GetEntitiesInCell(int x, int y) const;

private:
    std::vector<int32_t> _grid[EngineConfig::GridWidth][EngineConfig::GridHeight];
};
```

2. **`src/Systems/SpatialSystem.cpp`**
* **Implements the Logic:** This contains the actual code for `UpdateEntityCell` (which calculates which grid cell an entity belongs to based on `EngineConfig::CellSize`) and `GetEntitiesInCell` (which provides the lookup for the `InputSystem`).
* **Clearing the Grid:** This contains the `ClearGrid()` method, which iterates through the entire 2D grid structure to reset the entity lists for every frame.

```cpp
#include "Systems/SpatialSystem.hpp"
#include <iostream>

// Clears the grid at the start of every frame
void SpatialSystem::Clear() {
    for (int x = 0; x < EngineConfig::GridWidth; ++x) {
        for (int y = 0; y < EngineConfig::GridHeight; ++y) {
            _grid[x][y].clear();
        }
    }
}

// Maps entity to cell
void SpatialSystem::Update(EntityRegistry& registry, const PositionComponent& posComp) {
    Clear();
    
    // Iterate only over active entities
    const auto& activeEntities = registry.GetActiveEntities();
    
    for (int32_t id : activeEntities) {
        Vector2 pos = posComp.Positions[id];
        
        int x = static_cast<int>(pos.x / EngineConfig::CellSize);
        int y = static_cast<int>(pos.y / EngineConfig::CellSize);
        
        if (x >= 0 && x < EngineConfig::GridWidth && y >= 0 && y < EngineConfig::GridHeight) {
            _grid[x][y].push_back(id);
        }
    }
}

const std::vector<int32_t>& SpatialSystem::GetEntitiesInCell(int x, int y) const {
    static const std::vector<int32_t> empty;
    if (x >= 0 && x < EngineConfig::GridWidth && y >= 0 && y < EngineConfig::GridHeight) {
        return _grid[x][y];
    }
    return empty;
}
```

3. **`src/Systems/InputSystem.cpp`**
* **Consumes the Grid:** This is where the spatial grid is actively queried. Instead of iterating over every single entity in the game, it calculates the `cellX` and `cellY` of the mouse position and calls `registry.GetEntitiesInCell(cellX, cellY)` to only perform collision checks on entities located in that specific area.

```cpp
void InputSystem::PollInput(CommandQueue& queue, EntityRegistry& registry, PositionComponent& posComp, const SpatialSystem& spatialSystem) {
    if (IsMouseButtonPressed(MOUSE_LEFT_BUTTON)) {
        Vector2 mousePos = GetMousePosition();
        int32_t clickedId = -1;

        // Grid query logic
        int cellX = static_cast<int>(mousePos.x) / EngineConfig::CellSize;
        int cellY = static_cast<int>(mousePos.y) / EngineConfig::CellSize;

        const auto& entitiesInCell = spatialSystem.GetEntitiesInCell(cellX, cellY);
        
        for (int32_t id : entitiesInCell) {
            Vector2& pos = posComp.Positions[id];
            // Only perform collision checks on entities in the specific cell
            if (CheckCollisionPointCircle(mousePos, pos, 20.0f)) {
                clickedId = id;
                break;
            }
        }
    // ...
```

4. **`src/Main.cpp`**
* **Orchestrates Grid Maintenance:** This is where the grid lifecycle is managed. Before input is processed or entities are drawn, it calls `sharedRegistry.ClearGrid()` and iterates through all active entities to call `UpdateEntityCell()`. This ensures the grid is always up-to-date with the current positions of entities in the game world.

```cpp
    // Grid lifecycle management inside the Main Loop
    while (!WindowShouldClose()) {
        // Maintain Spatial State via the System (Clear and Repopulate)
        spatialSystem.Update(sharedRegistry, posComp);
    
        // ...

        for (int32_t id : sharedRegistry.GetActiveEntities()) {
            raylibView.DrawMesh(id, posComp.Positions[id], moveComp);
        // ...
```
