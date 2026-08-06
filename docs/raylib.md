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

# Movement

### Position

In computer science, **Position** is a 2D vector containing `X` and `Y` coordinates.

In Raylib, **Position** can be represented by a `Vector2` of float values:

`Vector2 position { 10.0f, 15.0f }`

### Velocity

In computer science, **Velocity** is a vector that represents **direction** and **magnitude**.

In Raylib, **Velocity** can be represented by a `Vector2`:

- `Vector2{0.0f, 1.0f}`: Direction: down. Magnitude: 1.0f
- `Vector2{0.0f, -1.0f}`: Direction: up. Magnitude: 1.0f
- `Vector2{1.0f, 0.0f}`: Direction: right. Magnitude: 1.0f
- `Vector2{-1.0f, 0.0f}`: Direction: left. Magnitude: 1.0f

Using Raylib Input Handling Functions keys we translate the WASD/cursor key presses into **Velocity** vector values. Example:

- `KEY_DOWN` is equal to `Vector2{0.0f, 1.0f}`
- `KEY_UP` is equal to `Vector2{0.0f, -1.0f}`
- `KEY_RIGHT` is equal to `Vector2{1.0f, 0.0f}`
- `KEY_LEFT` is equal to `Vector2{-1.0f, 0.0f}`

[!WARNING]
<strong>IMPORTANT</strong>
This is very convenient for key bindings, but all base <strong>Velocity</strong> values are limited to <code>0.0f</code>, <code>1.0f</code> and <code>-1.0f</code>. To scale this up to a custom <strong>Velocity</strong> of <code>Vector2{0.0f, 50.f}</code>, we multiply the vector by <code>50.f</code> using another variable: <code>speed</code>.

### Speed

Without **Speed**, **Velocity** will be limited to values `0.0f`, `1.0f` and `-1.0f` when using Raylib Input Handling Functions keys to set their values.

**Speed** is used to change the magnitute of **Velocity**, in this case by multiplying **Velocity** by **Speed**.

In Raylib, you achieve that by using the `Vector2Scale` function:

- Raylib: `velocity = Vector2Scale(velocity, speed)`
- Normal: `velocity = velocity * speed)`

### DeltaTime

Delta Time is the time elapsed, measured in seconds, between the current frame and the previous frame.

Without delta time, your game's movement speed would be tied directly to the framerate. If a player is running at 60 frames per second, the object updates 60 times a second and moves fast. If the framerate drops to 30 frames per second, the object updates half as often and moves sluggishly.

Multiplying your movement by `deltaTime` scales the motion to real-world time. If a frame takes longer to render, `deltaTime` becomes larger, moving the object further in that single frame to compensate. This ensures movement speed remains **smooth and consistent**, regardless of how fast or slow the computer's framerate is.

- Raylib: `velocity = Vector2Scale(velocity, speed * deltaTime)`
- Normal: `velocity = velocity * (speed * deltaTime)`

### Calculating Position

Position is calculated everyframe by adding a **Position** vector to a **Velocity** vector:

- Normal: `position = position + velocity`
- Raylib: `position = Vector2Add(position, velocity)`

Now, the full formula taking into account **Speed** and **DeltaTime** will be:

- Normal: `position = (position + (velocity * (speed * deltaTime)))`
- Raylib: `position = Vector2Add(position, Vector2Scale(velocity, speed * deltaTime))`

Raylib increment version:

`position += Vector2Add(position, Vector2Scale(velocity, speed * deltaTime)`

## Cursor keys

```cpp
#include "raylib.h"
#include "raymath.h"

struct Circle {
    Vector2 position{};
    float radius{};
};

int main()
{
    constexpr int screenWidth { 800 };
    constexpr int screenHeight { 450 };
    constexpr float speed { 100.0f };

    InitWindow(screenWidth, screenHeight, "raylib [core] example - input keys");
    Circle circle { {400.0f, 215.0f}, 20.0f };
    SetTargetFPS(60);

    while (!WindowShouldClose())
    {
        float deltaTime = GetFrameTime();

        Vector2 velocity = {
            static_cast<float>(IsKeyDown(KEY_RIGHT)) - static_cast<float>(IsKeyDown(KEY_LEFT)),
            static_cast<float>(IsKeyDown(KEY_DOWN))  - static_cast<float>(IsKeyDown(KEY_UP))
        };

        if (Vector2Length(velocity) > 0.0f)
        {
            velocity = Vector2Normalize(velocity);
        }

        // Move
        circle.position = Vector2Add(circle.position, Vector2Scale(velocity, speed * deltaTime));

        // Draw
        BeginDrawing();
            ClearBackground(RAYWHITE);
            DrawCircleV(circle.position, circle.radius, BLUE);
        EndDrawing();
    }

    CloseWindow();

    return 0;
}
```


## Point and click

[!INFO]
In the examples below, <code>ussPasadena</code> and <code>destination</code> are <code>Vector2</code>

### Vector2MoveTowards

```cpp
// Movement Logic (Moving toward destination)
if (isMoving) {
    ussPasadena = Vector2MoveTowards(ussPasadena, destination, speed * deltaTime);
    if (Vector2Distance(ussPasadena, destination) < 0.1f) {
        ussPasadena = destination;
        isMoving = false;
    }
}
```

Full example:

```cpp
#include "raylib.h"
#include "raymath.h"

struct Circle {
    Vector2 position{};
    float radius{};
};

int main()
{
    constexpr int screenWidth { 800 };
    constexpr int screenHeight { 450 };
    constexpr float speed { 100.0f };

    InitWindow(screenWidth, screenHeight, "raylib [core] example - input keys");
    Circle circle { {400.0f, 215.0f}, 20.0f };
    Vector2 destination { circle.position };
    bool isMoving { false };
    SetTargetFPS(60);

    while (!WindowShouldClose())
    {
        float deltaTime = GetFrameTime();

        if (IsMouseButtonPressed(MOUSE_BUTTON_LEFT)) {
            destination = GetMousePosition();
            isMoving = true;
        }

        // Move
        if (isMoving) {
            circle.position = (Vector2MoveTowards(circle.position, destination, speed * deltaTime));
            if (Vector2Distance(circle.position, destination) < 0.1f) {
                circle.position = destination;
                isMoving = false;
            }
        }

        // Draw
        BeginDrawing();
            ClearBackground(RAYWHITE);
            DrawCircleV(circle.position, circle.radius, BLUE);
        EndDrawing();
    }

    CloseWindow();

    return 0;
}
```

### Normalization

```cpp
// Movement Logic (Moving toward destination)
if (isMoving) {
    Vector2 dir = Vector2Subtract(destination, ussPasadena);
    float dist = Vector2Length(dir);
    
    if (dist > 2.0f) {
        Vector2 positionDelta = Vector2Scale(Vector2Normalize(dir), speed * deltaTime);
        ussPasadena = Vector2Add(ussPasadena, positionDelta);
    } else {
        isMoving = false;
        ussPasadena = destination; // Snap to final position
    }
}
```

### Lerp

```cpp
// Movement Logic (Moving toward destination)
if (isMoving) {
    // 0.1f is the interpolation factor (tweak this for speed)
    // A value of 0.1f means "move 10% of the remaining distance per frame"
    float t = 0.1f - exp(-speed * deltaTime);
    
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
        ussPasadena.x += (dx / distance) * speed * deltaTime;
        ussPasadena.y += (dy / distance) * speed * deltaTime;

    } else {
        isMoving = false;
    }
}
```

* * *

# Collision

Common and simple collisions are:

- Point inside Circle
- Circle vs Circle
- Rectangle vs Rectangle
- Circle vs Rectangle

In order to explain them, we need to create the following two structs:

```cpp
struct Circle {
    Vector2 position{};
    float radius{};
};

struct Square {
    Vector2 position{};
    Vector2 size{};

    // Return a Raylib Rectangle type which is great for raylib collision functions
    Rectangle GetBounds() const
    {
        return {
            position.x,
            position.y,
            size.x,
            size.y
        };
    }
};
```

Then we instantiate like this:

```cpp
Circle circle1 { {200.0f, 200.0f}, 20.0f };
Circle circle2 { {300.0f, 300.0f}, 20.0f };
Square square1 { {200.0f, 200.0f}, {30.0f, 30.0f} };
Square square2 { {300.0f, 300.0f}, {30.0f, 30.0f} };
```

And now we can use different ways to check for collisions in Raylib:

### Raylib

```cpp
// Point in Circle
bool hasCollidedPC = CheckCollisionPointCircle(circle1.position, circle2.position, circle2.radius);

// Circle to Circle
bool hasCollidedCC = CheckCollisionCircles(circle1.position, circle1.radius, circle2.position, circle2.radius);

// Rect to Rect
bool hasCollidedRR = CheckCollisionRecs(square1.GetBounds(), square2.GetBounds());

// Circle to Rect
bool hasCollidedCR = CheckCollisionCircleRec(circle1.position, circle1.radius, square2.GetBounds());
```

### Custom

This is a custom Point in Circle algorithm:

```cpp
bool IsPointInCircle(Vector2 point, Vector2 center, float radius) {
    float deltaX = origin.x - target.x;
    float deltaY = origin.y - target.y;
    float distanceSquared = (deltaX * deltaX) + (deltaY * deltaY);
    return distanceSquared <= radius * radius;
}

// ...
bool hasCollided = IsPointInCircle(circle2.position, circle1.position, circle1.radius);
```

### Full example

```cpp
#include "raylib.h"
#include "raymath.h"

struct Circle {
    Vector2 position{};
    float radius{};
};

struct Square {
    Vector2 position{};
    Vector2 size{};

    // Return a Raylib Rectangle type
    Rectangle GetBounds() const
    {
        return {
            position.x,
            position.y,
            size.x,
            size.y
        };
    }
};

int main()
{
    constexpr int screenWidth { 800 };
    constexpr int screenHeight { 450 };
    constexpr float speed { 100.0f };

    InitWindow(screenWidth, screenHeight, "raylib [core] example - input keys");
    Circle circle1 { {400.0f, 215.0f}, 20.0f };
    Circle circle2 { {500.0f, 215.0f}, 40.0f };
    Square square1 { {250.0f, 200.0f}, {30.0f, 30.0f} };
    Square square2 { {300.0f, 200.0f}, {30.0f, 30.0f} };
    SetTargetFPS(60);

    while (!WindowShouldClose())
    {
        float deltaTime = GetFrameTime();

        Vector2 velocity = {
            static_cast<float>(IsKeyDown(KEY_RIGHT)) - static_cast<float>(IsKeyDown(KEY_LEFT)),
            static_cast<float>(IsKeyDown(KEY_DOWN))  - static_cast<float>(IsKeyDown(KEY_UP))
        };

        if (Vector2Length(velocity) > 0.0f)
        {
            velocity = Vector2Normalize(velocity);
        }


        // Collision Detection
        bool hasCollidedPC = CheckCollisionPointCircle(circle1.position, circle2.position, circle2.radius);
        bool hasCollidedCC = CheckCollisionCircles(circle1.position, circle1.radius, circle2.position, circle2.radius);
        bool hasCollidedRR = CheckCollisionRecs(square1.GetBounds(), square2.GetBounds());
        bool hasCollidedCR = CheckCollisionCircleRec(circle1.position, circle1.radius, square2.GetBounds());

        // Movement
        circle1.position = Vector2Add(circle1.position, Vector2Scale(velocity, speed * deltaTime));
        square1.position = Vector2Add(square1.position, Vector2Scale(velocity, speed * deltaTime));


        // Draw
        BeginDrawing();

            ClearBackground(RAYWHITE);

            DrawCircleV(circle1.position, circle1.radius, BLUE);
            DrawCircleV(circle1.position, circle1.radius / 10.0f, GREEN);
            DrawCircleV(circle2.position, circle2.radius, RED);
            DrawRectangleRec(square1.GetBounds(), BLUE);
            DrawRectangleRec(square2.GetBounds(), RED);

            DrawText("move the blue ball and blue square with arrow keys", 10, 10, 20, DARKGRAY);
            DrawText(TextFormat("PointInCircle: %s", hasCollidedPC ? "YES" : "NO"), 10, 30, 20, hasCollidedPC ? RED : DARKGRAY);
            DrawText(TextFormat("CirclevsCircle: %s", hasCollidedCC ? "YES" : "NO"), 10, 50, 20, hasCollidedCC ? RED : DARKGRAY);
            DrawText(TextFormat("RectvsRect: %s", hasCollidedRR ? "YES" : "NO"), 10, 70, 20, hasCollidedRR ? RED : DARKGRAY);
            DrawText(TextFormat("CirclevsRect: %s", hasCollidedCR ? "YES" : "NO"), 10, 90, 20, hasCollidedCR ? RED : DARKGRAY);

        EndDrawing();
    }

    CloseWindow();

    return 0;
}
```



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

* * *

# Libraries

## `raymath.h`

Ref: [raymath cheatsheet](https://www.raylib.com/cheatsheet/raymath_cheatsheet.html)

### 1. Vector Arithmetic (The Basics)

* `Vector2Zero` / `Vector2One`: Used to initialize variables to "nothing" or "a standard unit of measurement".
* `Vector2Add` / `Vector2Subtract`: These are the bread and butter of movement. Adding a position vector to a velocity vector moves an object. Subtracting one position from another gives you the direction vector between them.
* `Vector2AddValue` / `Vector2SubtractValue`: Used to change a single property of a vector (like just the X or Y component) without affecting the other.
* `Vector2Scale` / `Vector2Multiply` / `Vector2Divide`: Used to change the magnitude (length) of a vector. For example, scaling a direction vector by a "speed" value makes an object move faster.
* `Vector2Negate` / `Vector2Invert`: Used to flip a vector. Negating a velocity vector makes an object move in the exact opposite direction.

[!INFO]
<strong>Example</strong>
Raylib:   <code>position = Vector2Add(position, Vector2Scale(velocity, speed * deltaTime))</code>
Equivalent: <code>position = (position + (velocity * (speed * deltaTime)))</code>
Standard: <code>position += velocity * speed * deltaTime</code>

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

## `raygui.h`

- Location: `https://github.com/raysan5/raygui/blob/master/src/raygui.h`
- Download command: `wget https://raw.githubusercontent.com/raysan5/raygui/refs/heads/master/src/raygui.h`
- Download needed: YES

`raygui` was designed as an auxiliary module for [raylib](https://github.com/raysan5/raylib) to create simple GUI interfaces using raylib graphic style (simple colors, plain rectangular shapes, wide borders...) but it can be adapted to other engines/frameworks.

`raygui` is intended for **tools development**; it has already been used to develop [multiple published tools](https://raylibtech.itch.io).

## `rcamera.h`

- Location: `https://github.com/raysan5/raylib/blob/master/src/rcamera.h`
- Download command: `wget https://raw.githubusercontent.com/raysan5/raylib/refs/heads/master/src/rcamera.h`
- Download needed: NO

Basic camera system with support for multiple camera modes. No need to download the file into your project. I added the Location and Download command because there is no documentation other than what appears in the `rcamera.h` source code.

## `reasings.h`

- Location: `https://github.com/raylib-extras/reasings/blob/main/src/reasings.h`
- Download command: `wget https://raw.githubusercontent.com/raylib-extras/reasings/refs/heads/main/src/reasings.h`
- Download needed: YES

**`reasings.h`** is a single-file header library provided by **raylib** that contains mathematical **easing functions** used for smooth animations and transitions.

The name is a portmanteau of **r**aylib and **easings**. It is a C port of Robert Penner’s famous easing equations, which are widely used in game development and UI design to make movements look natural (e.g., accelerating, decelerating, bouncing, or elastic effects).

### Key Features

* **Value Animation:** Provides standard mathematical curves (Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back, Elastic, Bounce) with **In**, **Out**, and **InOut** variants.
* **Header-Only & Standalone:** It can be included easily into projects.
* **No Dependencies:** Unlike some raylib modules, it is pure math and doesn't strictly depend on the core raylib graphics engine to function.

### How the Function Parameters Work

Every easing function in `reasings.h` takes four standard arguments:

1. **`t` (time):** The current time or frame of the animation (must use the same unit as duration).
2. **`b` (beginning value):** The starting value of the property you are animating (e.g., a starting X position of `0.0f`).
3. **`c` (change):** The total change in value needed to reach the destination (i.e., `Target Value - Beginning Value`).
4. **`d` (duration):** The total time or total number of frames the animation is expected to take.

### Code Example

#### Example 1 - Left to Right

```cpp
#include "raylib.h"
#include "reasings.h" // Include the easings header

int main() {
    InitWindow(800, 450, "Raylib Easing Example");
    SetTargetFPS(60);

    int currentTime {};
    constexpr int duration {120}; // Animation takes 120 frames (2 seconds at 60 FPS)

    constexpr float startPosX {100.0f};
    constexpr float targetPosX {700.0f};
    float changeInX {targetPosX - startPosX};

    while (!WindowShouldClose()) {
        float currentPosX {startPosX};

        // Animate position if the animation hasn't finished
        if (currentTime <= duration) {
            // Using EaseSineInOut for a smooth acceleration and deceleration
            currentPosX = EaseSineInOut((float)currentTime, startPosX, changeInX, (float)duration);
            currentTime++;
        }

        BeginDrawing();
            ClearBackground(RAYWHITE);
            // Draw a circle moving smoothly across the screen
            DrawCircle(static_cast<int>(currentPosX), 225, 30, MAROON);
        EndDrawing();
    }

    CloseWindow();
    return 0;
}
```

#### Example 2 - Oscillation

```cpp
#include "raylib.h"
#include "reasings.h" // Include the easings header

int main() {
    InitWindow(800, 450, "Raylib Easing Example");
    SetTargetFPS(60);

    int currentTime {};
    constexpr int duration {30}; // Animation takes 30 frames (1/2 seconds at 60 FPS)

    constexpr float startPosX {100.0f};
    constexpr float finalPosX {130.0f};

    while (!WindowShouldClose()) {
        float currentPosX {startPosX};

        if (currentPosX < finalPosX)
        {
            currentPosX = EaseSineIn(currentTime, startPosX, finalPosX - startPosX, duration);
            currentTime++;
        }

        BeginDrawing();
            ClearBackground(RAYWHITE);
            // Draw a circle oscillating smoothly in the screen
            DrawCircle(static_cast<int>(currentPosX), 225, 30, BLUE);
        EndDrawing();
    }

    CloseWindow();
    return 0;
}
```
