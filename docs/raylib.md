# Raylib Integration

# Selection

## Point and click

1. **`EntityRegistry.hpp`**
* **Defines the Data Structure:** This is where the `_grid` (the 2D container storing entity references) is declared.
* **Defines the Interface:** This declares the methods required to manipulate the grid, specifically `UpdateEntityCell(int32_t, Vector2)`, `GetEntitiesInCell(int, int)`, and `ClearGrid()`.

```cpp
// Clears the grid at the start of every frame
void EntityRegistry::ClearGrid() {
    for (int x = 0; x < EngineConfig::GridWidth; ++x) {
        for (int y = 0; y < EngineConfig::GridHeight; ++y) {
            _grid[x][y].clear();
        }
    }
}

// Maps entity to cell
void EntityRegistry::UpdateEntityCell(int32_t entityId, Vector2 pos) {
    int x = (int)pos.x / EngineConfig::CellSize;
    int y = (int)pos.y / EngineConfig::CellSize;
    if (x >= 0 && x < EngineConfig::GridWidth && y >= 0 && y < EngineConfig::GridHeight) {
        _grid[x][y].push_back(entityId);
    }
}
```

2. **`EntityRegistry.cpp`**
* **Implements the Logic:** This contains the actual code for `UpdateEntityCell` (which calculates which grid cell an entity belongs to based on `EngineConfig::CellSize`) and `GetEntitiesInCell` (which provides the lookup for the `InputSystem`).
* **Clearing the Grid:** This contains the `ClearGrid()` method, which iterates through the entire 2D grid structure to reset the entity lists for every frame.

```cpp
// Clears the grid at the start of every frame
void EntityRegistry::ClearGrid() {
    for (int x = 0; x < EngineConfig::GridWidth; ++x) {
        for (int y = 0; y < EngineConfig::GridHeight; ++y) {
            _grid[x][y].clear();
        }
    }
}

// Maps entity to cell
void EntityRegistry::UpdateEntityCell(int32_t entityId, Vector2 pos) {
    int x = (int)pos.x / EngineConfig::CellSize;
    int y = (int)pos.y / EngineConfig::CellSize;
    if (x >= 0 && x < EngineConfig::GridWidth && y >= 0 && y < EngineConfig::GridHeight) {
        _grid[x][y].push_back(entityId);
    }
}
```

3. **`InputSystem.cpp`**
* **Consumes the Grid:** This is where the spatial grid is actively queried. Instead of iterating over every single entity in the game, it calculates the `cellX` and `cellY` of the mouse position and calls `registry.GetEntitiesInCell(cellX, cellY)` to only perform collision checks on entities located in that specific area.

```cpp
// Grid query logic
int cellX = (int)mousePos.x / EngineConfig::CellSize;
int cellY = (int)mousePos.y / EngineConfig::CellSize;

const auto& entitiesInCell = registry.GetEntitiesInCell(cellX, cellY);

for (int32_t id : entitiesInCell) {
    // Only perform collision checks on entities in the specific cell
    if (/* collision logic */) { ... }
}
```

4. **`Main.cpp`**
* **Orchestrates Grid Maintenance:** This is where the grid lifecycle is managed. Before input is processed or entities are drawn, it calls `sharedRegistry.ClearGrid()` and iterates through all active entities to call `UpdateEntityCell()`. This ensures the grid is always up-to-date with the current positions of entities in the game world.

```cpp
// Grid lifecycle management inside the Main Loop
while (!WindowShouldClose()) {
    // 1. Clear and Repopulate
    sharedRegistry.ClearGrid(); 
    for(int32_t id : sharedRegistry.GetActiveEntities()) {
        Vector2* pos = sharedRegistry.GetPosition(id);
        if(pos) sharedRegistry.UpdateEntityCell(id, *pos);
    }

    // 2. Query
    InputSystem::PollInput(..., sharedRegistry);
    
    // ...
}
```


# Movement

## Point and click

### Vector2MoveTowards

```cpp
// Movement Logic (Moving toward destination)
if (isMoving) {
    ussPasadena = Vector2MoveTowards(ussPasadena, destination, speed * dt);
    if (Vector2Equals(ussPasadena, destination)) isMoving = false;
}
```

### Normalization

```cpp
// Movement Logic (Moving toward destination)
if (isMoving) {
    Vector2 pos = {ussPasadenaPos.x, ussPasadenaPos.y};
    Vector2 dir = Vector2Subtract(destination, pos);
    float dist = Vector2Length(dir);
    
    if (dist > 2.0f) {
        dir = Vector2Scale(Vector2Normalize(dir), movementSpeed * deltaTime);
        ussPasadenaPos.x += dir.x;
        ussPasadenaPos.y += dir.y;
    } else {
        isMoving = false;
    }
}
```

### Lerp

```cpp
// Movement Logic (Moving toward destination)
if (isMoving) {
  // 0.1f is the interpolation factor (tweak this for speed)
  // A value of 0.1f means "move 10% of the remaining distance per frame"
  float t = 0.1f - exp(-movementSpeed * deltaTime);
  ussPasadenaPos.x = Lerp(ussPasadenaPos.x, destination.x, t);
  ussPasadenaPos.y = Lerp(ussPasadenaPos.y, destination.y, t);

  // Stop moving if close enough
  if (CheckCollisionPointCircle({ussPasadenaPos.x, ussPasadenaPos.y}, destination, 2.0f)) {
      isMoving = false;
  }
}
```

### Custom

```cpp
// Movement Logic (Moving toward destination)
if (isMoving) {
    float dx = destination.x - ussPasadenaPos.x;
    float dy = destination.y - ussPasadenaPos.y;
    float distance = std::sqrt(dx * dx + dy * dy);

    if (distance > 2.0f) { // Stop if close enough
        // Normalize and move
        ussPasadenaPos.x += (dx / distance) * movementSpeed * deltaTime;
        ussPasadenaPos.y += (dy / distance) * movementSpeed * deltaTime;

    } else {
        isMoving = false;
    }
}
```

* * *

# Collision

## Point in Circle

### Raylib

```cpp
class RadarSystem {
    public:
    static bool IsWithinRadarRange(const PositionComp& sourcePos, 
                                   const PositionComp& targetPos, 
                                   const SensorComp& radar) {
        if (!radar.isEnabled) return false;

        return CheckCollisionPointCircle(
            {targetPos.x, targetPos.y}, 
            {sourcePos.x, sourcePos.y}, 
            radar.range
        );
    }
};
```

### Custom

```cpp
class RadarSystem {
    public:
    static bool IsWithinRadarRange(const PositionComp& sourcePos, 
                                   const PositionComp& targetPos, 
                                   const SensorComp& radar) {
        if (!radar.isEnabled) return false;

        float deltaX = targetPos.x - sourcePos.x;
        float deltaY = targetPos.y - sourcePos.y;
        float distanceSquared = (deltaX * deltaX) + (deltaY * deltaY);
        return distanceSquared <= radar.rangeSquared;
    }
};
```
