# Raylib Integration

# Selection

## Point and click

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

# Movement

## Point and click

[!INFO]
In the examples below, <code>ussPasadena</code> and <code>destination</code> are <code>Vector2</code>

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
    Vector2 dir = Vector2Subtract(destination, ussPasadena);
    float dist = Vector2Length(dir);
    
    if (dist > 2.0f) {
        Vector2 movement = Vector2Scale(Vector2Normalize(dir), movementSpeed * deltaTime);
        ussPasadena = Vector2Add(ussPasadena, movement);
    } else {
        isMoving = false;
        ussPasadena = destination; // Snap to final position[cite: 1]
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
    
    ussPasadena = Vector2Lerp(ussPasadena, destination, t);

    if (Vector2Distance(ussPasadena, destination) < 2.0f) {
        isMoving = false;
        ussPasadena = destination; // Optional: snap to exact target
    }
}
```

[!INFO]
In the example below, <code>ussPasadena</code> and <code>destination</code> are <code>Structs</code>

### Custom

```cpp
// Movement Logic (Moving toward destination)
if (isMoving) {
    float dx = destination.x - ussPasadena.x;
    float dy = destination.y - ussPasadena.y;
    float distance = std::sqrt(dx * dx + dy * dy);

    if (distance > 2.0f) { // Stop if close enough
        // Normalize and move
        ussPasadena.x += (dx / distance) * movementSpeed * deltaTime;
        ussPasadena.y += (dy / distance) * movementSpeed * deltaTime;

    } else {
        isMoving = false;
    }
}
```

* * *

# Collision

## Point in Circle

[!INFO]
In the example below, <code>sourcePos</code> and <code>targetPos</code> are <code>Vector2</code>

### Raylib

```cpp
bool IsWithinRadarRange(const PositionComp& sourcePos, 
                               const PositionComp& targetPos, 
                               const SensorComp& radar) {
    if (!radar.isEnabled) return false;

    // Directly pass the Vector2 member
    return CheckCollisionPointCircle(
        targetPos, 
        sourcePos, 
        radar.range
    );
}
```

[!INFO]
In the example below, <code>sourcePos</code> and <code>targetPos</code> are <code>Structs</code>

### Custom

```cpp
bool IsWithinRadarRange(const PositionComp& sourcePos, 
                               const PositionComp& targetPos, 
                               const SensorComp& radar) {
    if (!radar.isEnabled) return false;

    float deltaX = targetPos.x - sourcePos.x;
    float deltaY = targetPos.y - sourcePos.y;
    float distanceSquared = (deltaX * deltaX) + (deltaY * deltaY);
    return distanceSquared <= radar.rangeSquared;
}
```

# RayMath (Vector2)

Ref: [raymath cheatsheet](https://www.raylib.com/cheatsheet/raymath_cheatsheet.html)

### 1. Vector Arithmetic (The Basics)

* `Vector2Zero` / `Vector2One`: Used to initialize variables to "nothing" or "a standard unit of measurement".
* `Vector2Add` / `Vector2Subtract`: These are the bread and butter of movement. Adding a velocity vector to a position vector moves an object. Subtracting one position from another gives you the direction vector between them.
* `Vector2AddValue` / `Vector2SubtractValue`: Used to change a single property of a vector (like just the X or Y component) without affecting the other.
* `Vector2Scale` / `Vector2Multiply` / `Vector2Divide`: Used to change the magnitude (length) of a vector. For example, scaling a direction vector by a "speed" value makes an object move faster.
* `Vector2Negate` / `Vector2Invert`: Used to flip a vector. Negating a velocity vector makes an object move in the exact opposite direction.



### 2. Magnitude and Distance

* `Vector2Length` / `Vector2LengthSqr`: Tells you how "long" a vector is (the speed or the distance). The "Sqr" version is a performance shortcut used when you don't need the exact length, just a comparison.
* `Vector2Distance` / `Vector2DistanceSqr`: Measures the physical gap between two objects in the game world. Useful for checking if an enemy is close enough to attack.



### 3. Direction and Alignment

* `Vector2Normalize`: Converts any vector into a "unit vector" (length of 1). This is vital when you want to keep the direction but ignore the current speed.
* `Vector2DotProduct`: Used to check the alignment between two vectors. It tells you if objects are facing each other, moving away from each other, or are perpendicular.
* `Vector2CrossProduct`: In 2D, this determines the "side" (left or right) one vector is on relative to another.
* `Vector2Angle` / `Vector2LineAngle`: Used to calculate the actual degree or radian rotation between two vectors or lines.



### 4. Geometry and Manipulation

* `Vector2Rotate`: Changes the direction a vector is pointing by a specific amount of rotation.
* `Vector2Reflect` / `Vector2Refract`: Used for physics and optics. Reflection is how a ball bounces off a wall; refraction simulates light or projectiles passing through different mediums.
* `Vector2Lerp`: Smoothly transitions between two points. Used for "tweening" animations or camera systems that need to follow a player without feeling robotic.
* `Vector2MoveTowards`: A "set it and forget it" function that moves a point toward a target without overshooting it.



### 5. Utilities

* `Vector2Min` / `Vector2Max`: Returns the smallest or largest components from two vectors; used to find the boundaries of a shape.
* `Vector2Clamp` / `Vector2ClampValue`: Forces a vector or its length to stay within specific minimum and maximum limits. Great for capping an object's maximum speed.
* `Vector2Equals`: Checks if two vectors are effectively the same point, accounting for potential floating-point math errors.
* `Vector2Transform`: Used to apply complex geometric changes (like rotation, scaling, or shearing) to a position using a Matrix.

* * *

# DrawShape vs DrawTexture

### DrawShape

DrawShape functions generate geometry every frame.

Examples:

```cpp
DrawCircle(...);
DrawCircleV(...);
DrawRectangle(...);
DrawLine(...);
```

Use DrawShape for:

* Debug rendering
* Prototypes
* Editor tools
* A small number of objects



### DrawTexture

DrawTexture renders an existing texture.

The texture can come from:

* An image (`LoadTexture`)
* A `RenderTexture`


### `LoadTexture`

```cpp
Texture2D player = LoadTexture("player.png");
DrawTexture(player, x, y, WHITE);
```

### `RenderTexture`

A `RenderTexture` is a texture created entirely in memory.

```cpp
RenderTexture bulletTexture = LoadRenderTexture(24, 24);

BeginTextureMode(bulletTexture);
    DrawCircle(12, 12, 10, WHITE);
    DrawCircleLines(12, 12, 10, BLACK);
EndTextureMode();
```

The `24 × 24` values specify the texture size in pixels.

In this example, the circle is drawn **once** into the texture and then reused every frame:

```cpp
DrawTexture(bulletTexture.texture, x, y, RED);
```

In both cases, `DrawTexture()` draws a `Texture2D`. The only difference is where that texture came from. This is much faster than drawing a new circle every frame.



### When to Use Each

| Use Case                                | DrawShape | DrawTexture |
| --------------------------------------- | :-------: | :---------: |
| Debug rendering                         |     ✅     |             |
| Prototyping                             |     ✅     |             |
| UI icons                                |           |      ✅      |
| Sprites                                 |           |      ✅      |
| Bullets                                 |           |      ✅      |
| Particles                               |           |      ✅      |
| Tile maps                               |           |      ✅      |
| Hundreds/thousands of identical objects |           |      ✅      |



### Rule of Thumb

* **DrawShape** → Create geometry every frame.
* **DrawTexture** → Reuse an image every frame.

If you're drawing the same object many times (bullets, particles, tiles, sprites), prefer **DrawTexture**.

