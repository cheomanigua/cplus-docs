# SS — Simple SDL3 Game Library

A lightweight, header-only C++ library built on SDL3, SDL3_ttf, and SDL3_image for creating simple 2D games.

## Requirements

- C++17 or later
- SDL3
- SDL3_ttf
- SDL3_image

## Installation

Copy `my_library.h` into your project and include it:

```cpp
#include "my_library.h"
```

All functions and types are defined in the `ss` namespace.

## API Reference

### Initialization and Lifecycle

| Function | Description | Example |
|---|---|---|
| `Init(title, width, height, fontPath, fontSize)` | Initializes SDL, the window, renderer, caches, and optional font. Returns `bool`. | `ss::Init("My Game", 800, 450, "font.ttf", 20.0f);` |
| `IsRunning()` | Processes events and indicates whether the application should continue running. Escape and window close stop the loop. | `while (ss::IsRunning()) { /* game loop */ }` |
| `BeginFrame(clearColor)` | Calculates delta time, clears the renderer, and sets the background color. | `ss::BeginFrame({0, 0, 0, 255});` |
| `EndFrame()` | Presents the frame and delays when necessary to target approximately 60 FPS. | `ss::EndFrame();` |
| `GetDeltaTime()` | Returns the frame delta time in seconds, capped at 0.1 seconds. | `float dt = ss::GetDeltaTime();` |

The font path and font size are optional. `Init()` defaults to no font and a font size of `20.0f`.

### Types and Structures

| Type | Description | Example |
|---|---|---|
| `Input` | Current arrow-key states: `left`, `right`, `up`, `down`. | `ss::Input input = ss::GetInput();` |
| `Circle` | Circle defined by center position and radius. | `ss::Circle ball{{100.0f, 100.0f}, 20.0f};` |
| `Rectangle` | Rectangle defined by top-left position and size. | `ss::Rectangle wall{{100.0f, 100.0f}, {50.0f, 30.0f}};` |
| `Sprite` | Textured image defined by position and `SDL_Texture*`. | `ss::Sprite bunny{{100.0f, 100.0f}, ss::load("bunny.png")};` |

`Rectangle::GetBounds()` returns its `SDL_FRect` bounds.

`Sprite::GetBounds()` returns its texture-sized `SDL_FRect`, or an empty rectangle if its texture is null.

### Input

| Function | Description | Example |
|---|---|---|
| `GetInput()` | Reads the current state of the four arrow keys. | `ss::Input input = ss::GetInput();` |

Movement can be scaled by delta time:

```cpp
player.position.x += 200.0f * ss::GetDeltaTime();
```

### Rendering

| Function | Description | Example |
|---|---|---|
| `draw(Circle, color)` | Draws a circle outline. Default color is blue. | `ss::draw(ball, {0, 121, 241, 255});` |
| `draw(Rectangle, color)` | Draws a rectangle outline. Default color is red. | `ss::draw(wall, {230, 41, 55, 255});` |
| `draw(Sprite)` | Draws a sprite at its position using its texture dimensions. | `ss::draw(bunny);` |
| `drawText(text, x, y, color)` | Draws text at the specified top-left position. Default color is dark gray. | `ss::drawText("Score: 100", 10.0f, 10.0f);` |

Colors use `SDL_Color` with RGBA components in the range 0–255.

Text rendering requires a successfully loaded font.

### Texture Loading and Caching

| Function | Description | Example |
|---|---|---|
| `load(path)` | Loads a texture on first use and returns the cached texture on subsequent requests for the same path. | `SDL_Texture* texture = ss::load("bunny.png");` |
| `TextureCache::Get(path)` | Retrieves a cached texture or loads it if it is not cached. | `auto* texture = ss::ctx.textureCache->Get("bunny.png");` |
| `TextureCache::Clear()` | Destroys all cached textures and removes their entries. | `ss::ctx.textureCache->Clear();` |

**Ownership:** The texture cache owns textures returned by `ss::load()`. Do not call `SDL_DestroyTexture()` on those textures individually. The cache destroys them during cleanup.

Use consistent file paths to reuse cached textures.

### Text Caching

Text caching is managed internally by `TextCache` and accessed through `drawText()`.

| Function | Description | Example |
|---|---|---|
| `drawText(text, x, y, color)` | Renders text and caches its texture by text content and RGBA color. | `ss::drawText("Game Over", 300.0f, 200.0f);` |
| `TextCache::Clear()` | Destroys all cached text textures. | `ss::ctx.textCache->Clear();` |

Repeated requests with the same text and color reuse the cached texture. Different text or colors create separate entries.

### Collision Detection

All collision functions return `true` when a collision is detected and `false` otherwise.

| Overload | Description | Example |
|---|---|---|
| `CheckCollision(point, circleCenter, radius)` | Point vs. circle. | `ss::CheckCollision(point, ball.position, ball.radius);` |
| `CheckCollision(point, SDL_FRect)` | Point vs. rectangle. | `ss::CheckCollision(point, wall.GetBounds());` |
| `CheckCollision(centerA, radiusA, centerB, radiusB)` | Circle vs. circle using positions and radii. | `ss::CheckCollision(ball.position, ball.radius, enemy.position, enemy.radius);` |
| `CheckCollision(SDL_FRect, SDL_FRect)` | Rectangle vs. rectangle. | `ss::CheckCollision(wall.GetBounds(), otherWall.GetBounds());` |
| `CheckCollision(center, radius, SDL_FRect)` | Circle vs. rectangle. | `ss::CheckCollision(ball.position, ball.radius, wall.GetBounds());` |
| `CheckCollision(Circle, Circle)` | Circle vs. circle. | `ss::CheckCollision(ball, enemy);` |
| `CheckCollision(Rectangle, Rectangle)` | Rectangle vs. rectangle. | `ss::CheckCollision(wall, otherWall);` |
| `CheckCollision(Circle, Rectangle)` | Circle vs. rectangle. | `ss::CheckCollision(ball, wall);` |

Sprite collisions can be checked using their bounds:

```cpp
ss::CheckCollision(bunny.GetBounds(), wall.GetBounds());
```

Rectangle-to-rectangle collision uses strict overlap, so touching edges alone do not count. Point-to-rectangle collision includes the left and top edges but excludes the right and bottom edges.

### Timing and Frame Rate

| Feature | Description | Example |
|---|---|---|
| Delta time | Elapsed frame time in seconds, capped at 0.1 seconds. | `position.x += speed * ss::GetDeltaTime();` |
| Frame pacing | Targets approximately 60 FPS. | `ss::EndFrame();` |

## Resource Management

- Call `ss::Init()` before loading textures or rendering.
- Use `ss::load()` for cached textures.
- Do not destroy cached textures manually.
- The global context cleans up its caches, font, renderer, window, and SDL subsystems during normal program shutdown.
- Do not use cached texture pointers after their cache has been cleared or destroyed.

## Limitations

- Input is limited to the four arrow keys.
- Circle and rectangle drawing produces outlines only.
- Sprite collision is performed through sprite bounds rather than a dedicated overload.
- Texture and text caches do not implement automatic eviction.
- The library uses a single global context and renderer.

## License

Specify your project's license here before distributing the library.
