# SS — Simple SDL3 Game Library

A lightweight, header-only C++ library built on SDL3, SDL3_ttf, and SDL3_image for creating simple 2D games.

## Requirements

- C++17 or later
- SDL3
- SDL3_ttf
- SDL3_image

## Installation

- Download [wrapper.h](https://raw.githubusercontent.com/cheomanigua/cplus/refs/heads/main/sdl3/wrapper/wrapper.h)
- Copy `wrapper.h` into your project and include it:

```cpp
#include "wrapper.h"
```

All functions and types are defined in the `wp` namespace.

## API Reference

### Colors

Predefined `SDL_Color` constants for quick styling.

| Constant | RGBA Values |
| --- | --- |
| `wp::Black` | `{0, 0, 0, 255}` |
| `wp::Navy` | `{0, 0, 128, 255}` |
| `wp::Blue` | `{0, 0, 255, 255}` |
| `wp::DarkGreen` | `{0, 128, 0, 255}` |
| `wp::Teal` | `{0, 128, 128, 255}` |
| `wp::DeepSkyBlue` | `{0, 128, 255, 255}` |
| `wp::Green` | `{0, 255, 0, 255}` |
| `wp::SpringGreen` | `{0, 255, 128, 255}` |
| `wp::Cyan` | `{0, 255, 255, 255}` |
| `wp::Maroon` | `{128, 0, 0, 255}` |
| `wp::Purple` | `{128, 0, 128, 255}` |
| `wp::MediumPurple` | `{128, 0, 255, 255}` |
| `wp::Olive` | `{128, 128, 0, 255}` |
| `wp::Gray` | `{128, 128, 128, 255}` |
| `wp::LightSteelBlue` | `{128, 128, 255, 255}` |
| `wp::YellowGreen` | `{128, 255, 0, 255}` |
| `wp::LightGreen` | `{128, 255, 128, 255}` |
| `wp::LightCyan` | `{128, 255, 255, 255}` |
| `wp::Red` | `{255, 0, 0, 255}` |
| `wp::Crimson` | `{255, 0, 128, 255}` |
| `wp::Magenta` | `{255, 0, 255, 255}` |
| `wp::Orange` | `{255, 128, 0, 255}` |
| `wp::Salmon` | `{255, 128, 128, 255}` |
| `wp::Pink` | `{255, 128, 255, 255}` |
| `wp::Yellow` | `{255, 255, 0, 255}` |
| `wp::Khaki` | `{255, 255, 128, 255}` |
| `wp::White` | `{255, 255, 255, 255}` |

### Initialization and Lifecycle

| Function | Description | Example |
|---|---|---|
| `Init(title, width, height, fontPath, fontSize)` | Initializes SDL, the window, renderer, caches, and optional font. Returns `bool`. | `wp::Init("My Game", 800, 450, "font.ttf", 20.0f);` |
| `IsRunning()` | Processes events and indicates whether the application should continue running. Escape and window close stop the loop. | `while (wp::IsRunning()) { /* game loop */ }` |
| `BeginFrame(clearColor)` | Calculates delta time, clears the renderer, and sets the background color. | `wp::BeginFrame({0, 0, 0, 255});` |
| `EndFrame()` | Presents the frame and delays when necessary to target approximately 60 FPS. | `wp::EndFrame();` |
| `GetDeltaTime()` | Returns the frame delta time in seconds, capped at 0.1 seconds. | `float dt = wp::GetDeltaTime();` |

The font path and font size are optional. `Init()` defaults to no font and a font size of `20.0f`.

### Types and Structures

| Type | Description | Example |
|---|---|---|
| `Input` | Current arrow-key states: `left`, `right`, `up`, `down`. | `wp::Input input = wp::GetInput();` |
| `Circle` | Circle defined by center position and radius. | `wp::Circle ball{{100.0f, 100.0f}, 20.0f};` |
| `Rectangle` | Rectangle defined by top-left position and size. | `wp::Rectangle wall{{100.0f, 100.0f}, {50.0f, 30.0f}};` |
| `Sprite` | Textured image defined by position and `SDL_Texture*`. | `wp::Sprite bunny{{100.0f, 100.0f}, texture};` |

`Rectangle::GetBounds()` returns its `SDL_FRect` bounds.

`Sprite::GetBounds()` returns its texture-sized `SDL_FRect`, or an empty rectangle if its texture is null.

### Input

| Function | Description | Example |
|---|---|---|
| `GetInput()` | Reads the current state of the four arrow keys. | `wp::Input input = wp::GetInput();` |

Movement can be scaled by delta time:

```cpp
player.position.x += 200.0f * wp::GetDeltaTime();
```

### Rendering

| Function | Description | Example |
|---|---|---|
| `draw(Circle, color)` | Draws a circle outline. | `wp::draw(ball, {0, 121, 241, 255});` |
| `draw(Rectangle, color)` | Draws a rectangle outline. | `wp::draw(wall, {230, 41, 55, 255});` |
| `draw(Sprite)` | Draws a sprite at its position using its texture dimensions. | `wp::draw(bunny);` |
| `drawText(text, x, y, color)` | Draws text at the specified top-left position. | `wp::drawText("Score: 100", 10.0f, 10.0f);` |

Colors use `SDL_Color` with RGBA components in the range 0–255.

Text rendering requires a successfully loaded font.

### Texture Loading and Caching

| Function | Description | Example |
|---|---|---|
| `loadTexture(path)` | Loads a texture on first use and returns the cached texture on subsequent requests for the same path. | `SDL_Texture* texture = wp::loadTexture("bunny.png");` |
| `TextureCache::Get(path)` | Retrieves a cached texture or loads it if it is not cached. | `auto* texture = wp::ctx.textureCache->Get("bunny.png");` |
| `TextureCache::Clear()` | Destroys all cached textures and removes their entries. | `wp::ctx.textureCache->Clear();` |

**Ownership:** The texture cache owns textures returned by `wp::loadTexture()`. Do not call `SDL_DestroyTexture()` on those textures individually. The cache destroys them during cleanup.

Use consistent file paths to reuse cached textures.

### Text Caching

Text caching is managed internally by `TextCache` and accessed through `drawText()`.

| Function | Description | Example |
|---|---|---|
| `drawText(text, x, y, color)` | Renders text and caches its texture by text content and RGBA color. | `wp::drawText("Game Over", 300.0f, 200.0f);` |
| `TextCache::Clear()` | Destroys all cached text textures. | `wp::ctx.textCache->Clear();` |

Repeated requests with the same text and color reuse the cached texture. Different text or colors create separate entries.

### Collision Detection

All collision functions return `true` when a collision is detected and `false` otherwise.

| Overload | Description | Example |
|---|---|---|
| `CheckCollision(point, circleCenter, radius)` | Point vs. circle. | `wp::CheckCollision(point, ball.position, ball.radius);` |
| `CheckCollision(point, SDL_FRect)` | Point vs. rectangle. | `wp::CheckCollision(point, wall.GetBounds());` |
| `CheckCollision(centerA, radiusA, centerB, radiusB)` | Circle vs. circle using positions and radii. | `wp::CheckCollision(ball.position, ball.radius, enemy.position, enemy.radius);` |
| `CheckCollision(SDL_FRect, SDL_FRect)` | Rectangle vs. rectangle. | `wp::CheckCollision(wall.GetBounds(), otherWall.GetBounds());` |
| `CheckCollision(center, radius, SDL_FRect)` | Circle vs. rectangle. | `wp::CheckCollision(ball.position, ball.radius, wall.GetBounds());` |
| `CheckCollision(Circle, Circle)` | Circle vs. circle. | `wp::CheckCollision(ball, enemy);` |
| `CheckCollision(Rectangle, Rectangle)` | Rectangle vs. rectangle. | `wp::CheckCollision(wall, otherWall);` |
| `CheckCollision(Circle, Rectangle)` | Circle vs. rectangle. | `wp::CheckCollision(ball, wall);` |
| `CheckCollision(Sprite, Rectangle)` | Sprite vs. rectangle. | `wp::CheckCollision(bunny, wall);` |
| `CheckCollision(Sprite, Sprite)` | Sprite vs. sprite. | `wp::CheckCollision(bunny, bunny2);` |

Rectangle-to-rectangle collision uses strict overlap, so touching edges alone do not count. Point-to-rectangle collision includes the left and top edges but excludes the right and bottom edges.

### Timing and Frame Rate

| Feature | Description | Example |
|---|---|---|
| Delta time | Elapsed frame time in seconds, capped at 0.1 seconds. | `position.x += speed * wp::GetDeltaTime();` |
| Frame pacing | Targets approximately 60 FPS. | `wp::EndFrame();` |

## Resource Management

- Call `wp::Init()` before loading textures or rendering.
- Use `wp::loadTexture()` for cached textures.
- Do not destroy cached textures manually.
- The global context cleans up its caches, font, renderer, window, and SDL subsystems during normal program shutdown.
- Do not use cached texture pointers after their cache has been cleared or destroyed.

## Limitations

- Input is limited to the four arrow keys.
- Circle and rectangle drawing produces outlines only.
- Sprite collision is performed through sprite bounds rather than a dedicated overload.
- Texture and text caches do not implement automatic eviction.
- The library uses a single global context and renderer.

## Example

```cpp
#include "wrapper.h"

int main()
{
    if (!wp::Init("Collision Demo", 800, 450, "/usr/share/fonts/xscreensaver/clacon.ttf"))
    {
        return 1;
    }

    constexpr float speed {200.0f};

    SDL_Texture* texture = wp::loadTexture("raybunny.png");
    wp::Sprite player{{100.f, 100.f}, texture};
    wp::Rectangle wall1{{250.f, 150.f}, {100.f, 40.f}};
    wp::Rectangle wall2{{450.f, 250.f}, {150.f, 80.f}};

    while (wp::IsRunning())
    {
        wp::BeginFrame({0, 0, 0, 255});
        const float dt = wp::GetDeltaTime();
        wp::Input input = wp::GetInput();

        SDL_FPoint direction{
            static_cast<float>(input.right - input.left),
            static_cast<float>(input.down - input.up)
        };

        // Normalize diagonal movement if moving horizontally & vertically
        if (direction.x != 0.0f && direction.y != 0.0f)
        {
            direction.x *= 0.70710678f;
            direction.y *= 0.70710678f;
        }

        player.position.x += direction.x * speed * dt;
        player.position.y += direction.y * speed * dt;

        // Check collision easily using overloaded wp::CheckCollision
        bool collided = wp::CheckCollision(player, wall1);

        // Draw elements
        wp::draw(wall1, (collided ? wp::Red : wp::White));
        wp::draw(wall2);
        wp::draw(player);

        wp::drawText("Move the square with the cursor keys.", 10.0f, 10.0f);
        wp::drawText(collided ? "Collision: YES" : "Collision: NO", 10.0f, 25.0f);

        wp::EndFrame();
    }

    return 0;
}
```
