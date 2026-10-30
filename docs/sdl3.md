# SDL3

Practical programming documentation · C++ / SDL3

# Includes

```cpp
#include <SDL3/SDL.h>
#include <SDL3/SDL_main.h>
#include <SDL3_ttf/SDL_ttf.h>
#include <SDL3_image/SDL_image.h>
```

`SDL3_ttf` and `SDL3_image` are optional. They are needed when using fonts or images.

# Compilation

### Command line

```text
g++ -std=c++20 -O2 main.cpp -o game \
    $(pkg-config --cflags --libs sdl3 sdl3-image sdl3-ttf)
```
With Flecs:

```text
g++ -std=c++23 *.cpp flecs.o \
    $(pkg-config --cflags --libs sdl3 sdl3-image sdl3-ttf) \
    -lpthread -lm \
    -o game
```

### Libraries

- `sdl3`: Base library
- `sdl3-image`: Image library
- `sdl3-ttf`: Font library

If you are not using images or fonts, you don't need `sdl3-image` or `sdl3-ttf` libraries during compilation.

# FPS and Delta Time

## 1. Introduction

When developing a game or graphical application with SDL3, controlling how frequently the main loop executes is important.

Three concepts are particularly important:

- FPS (Frames Per Second): How many frames your application processes and presents per second.
- Delta Time (`dt`): How much time has elapsed between frames.
- VSync (Vertical Synchronization): Synchronizes frame presentation with the monitor's refresh cycle. So 60 Hz refresh rate correspond to 60 FPS.

Understanding these concepts helps you build applications that behave consistently across different computers and monitors.

## 2. FPS and Delta Time

FPS measures how many frames your application produces per second. Delta time (`dt`) represents the elapsed time between two consecutive frames, expressed in seconds.

| FPS | Time per frame (dt) |
| --- | --- |
| 30 FPS | 0.0333 s |
| 60 FPS | 0.0167 s |
| 120 FPS | 0.0083 s |
| 144 FPS | 0.0069 s |
| 240 FPS | 0.0042 s |

The formula is: `dt = 1 / FPS`

### Why use delta time?

Movement should be expressed in units per second, rather than units per frame.



```cpp
float speed = 100.0f; // Pixels per second

position.x += speed * dt;
```

This ensures approximately the same movement speed regardless of FPS.

For example, at 60 FPS:


```cpp
float dt = 0.016f;
```

The object moves approximately 1.6 pixels per frame.

[!NOTE]
<strong>REMEMBER</strong>
Delta time is measured in seconds, not milliseconds.

## 3. VSync, Frame Limiting and Game Loops

### VSync – Vertical Synchronization

VSync synchronizes frame presentation with the monitor's refresh cycle. So 60 Hz refresh rate correspond to 60 FPS.

Enable VSync in SDL3:


```cpp
SDL_SetRenderVSync(renderer, 1);
```

Disable VSync:


```cpp
SDL_SetRenderVSync(renderer, 0);
```

VSync helps prevent screen tearing. Actual FPS depends on rendering performance and the synchronization mode.

### Calculating Delta Time in SDL3

There are two ways to calculate delta time in SDL3:

- `SDL_GetTicks()`: Miliseconds-resolution timing
- `SDL_GetPerformanceCounter()`: High-resolution timing, more precise

The distinction is:

- `SDL_GetTicks()`: Returns elapsed time in milliseconds since SDL initialization.
- `SDL_GetPerformanceCounter()`: Returns a high-resolution performance counter for precise time measurements.
- `SDL_GetPerformanceFrequency()`: Returns the counter frequency, allowing you to convert performance-counter differences into seconds.

In simple terms:

| Function | Description |
| --- | --- |
| `SDL_GetTicks()` | Millisecond timer |
| `SDL_GetPerformanceCounter()` | High-resolution timer |
| `SDL_GetPerformanceFrequency()` | Counter frequency |

Both can be used to calculate delta time. `SDL_GetTicks()` is simpler, while `SDL_GetPerformanceCounter()` provides greater timing precision.

#### A. Milisecond-resolution timing

```cpp
// Initialize timer
Uint64 previousTicks = SDL_GetTicks();

// Inside the game loop
    const Uint64 currentTicks = SDL_GetTicks();

    const float deltaTime = (currentTicks - previousTicks) / 1000.0f;

    previousTicks = currentTicks;
```


#### B. High-resolution timing

```cpp
// Initialize timer
const Uint64 frequency = SDL_GetPerformanceFrequency();
Uint64 previousCounter = SDL_GetPerformanceCounter();

/// Inside the game loop
    const Uint64 currentCounter = SDL_GetPerformanceCounter();

    const float dt = static_cast<float>(
        static_cast<double>(currentCounter - previousCounter) /
        static_cast<double>(frequency)
    );

    previousCounter = currentCounter;
```


### Preventing large delta time values

If the application freezes or is paused, delta time can suddenly become very large.

Clamp it to prevent large simulation jumps:


```cpp
const float dt = std::min(rawDeltaTime, 0.05f);
```

This limits the simulation step to 50 milliseconds.

Keep raw delta time separate if you need accurate FPS reporting.

### FPS calculation

Count frames over an elapsed period:


```cpp
float fpsElapsed = 0.0f;
std::uint32_t frames = 0;

++frames;
fpsElapsed += rawDeltaTime;

if (fpsElapsed >= 1.0f) {
    const float fps = frames / fpsElapsed;

    SDL_Log("FPS: %.1f", fps);

    frames = 0;
    fpsElapsed = 0.0f;
}
```

### Fixed vs Variable Timestep

- Variable timestep: Updates the simulation using actual elapsed time. Simpler and suitable for many games.
- Fixed timestep: Updates the simulation using a constant time interval, such as `1.0 / 60.0`. Useful for more predictable physics.

## 4. Practical Examples

### A. Quick experiments and practice

For learning SDL3, testing rendering, and small experiments, you can use any of these two methods:

```cpp
SDL_SetRenderVSync(renderer, 1);

while (running)
{
    constexpr float dt = 0.016f; // if my monitor is 60Hz

    // Process events.

    // Update.
    position.x += velocity.x * dt;

    // Render.
}
```

or

```cpp
while (running)
{
    constexpr float dt = 0.016f;

    // Process events.

    // Update.
    position.x += velocity.x * dt;

    // Render.

    SDL_Delay(16);
}
```

### B. Production game loop with VSync

Recommended starting pointLet SDL synchronize frame presentation with the monitor.


```cpp
// Enable VSync.
if (!SDL_SetRenderVSync(renderer, 1)) {
    SDL_Log("Could not enable VSync: %s", SDL_GetError());
}

const Uint64 frequency = SDL_GetPerformanceFrequency();

Uint64 previousCounter = SDL_GetPerformanceCounter();

while (running)
{
    // Process events.

    // Calculate delta time.
    const Uint64 currentCounter = SDL_GetPerformanceCounter();

    const float rawDeltaTime = static_cast<float>(
        static_cast<double>(currentCounter - previousCounter) /
        static_cast<double>(frequency)
    );

    previousCounter = currentCounter;

    // Clamp simulation delta time.
    const float dt = std::min(rawDeltaTime, 0.05f);

    // Update.
    position.x += velocity.x * dt;

    // Render.
    SDL_RenderClear(renderer);
    SDL_RenderPresent(renderer);
}
```

Advantages:

- Synchronizes presentation with the monitor.
- Helps prevent screen tearing.
- Automatically adapts to different refresh rates.
- No manual frame limiter required.

### C. Production game loop with manual FPS limiting

Use this approach when you want to control the frame rate yourself.

Example: targeting 60 FPS.


```cpp
constexpr double TARGET_FPS = 60.0;
constexpr double TARGET_FRAME_TIME = 1.0 / TARGET_FPS;

// Disable VSync.
SDL_SetRenderVSync(renderer, 0);

const Uint64 frequency = SDL_GetPerformanceFrequency();

Uint64 previousCounter = SDL_GetPerformanceCounter();

while (running)
{
    const Uint64 frameStart = SDL_GetPerformanceCounter();

    // Process events.

    // Calculate delta time.
    const float rawDeltaTime = static_cast<float>(
        static_cast<double>(frameStart - previousCounter) /
        static_cast<double>(frequency)
    );

    previousCounter = frameStart;

    const float dt = std::min(rawDeltaTime, 0.05f);

    // Update.
    position.x += velocity.x * dt;

    // Render.
    SDL_RenderClear(renderer);
    SDL_RenderPresent(renderer);

    // Limit frame rate.
    const Uint64 frameEnd = SDL_GetPerformanceCounter();

    const double frameTime =
        static_cast<double>(frameEnd - frameStart) /
        static_cast<double>(frequency);

    if (frameTime < TARGET_FRAME_TIME) {
        const double remainingTime = TARGET_FRAME_TIME - frameTime;

        if (remainingTime > 0.002) {
            SDL_Delay(static_cast<Uint32>(
                (remainingTime - 0.001) * 1000.0
            ));
        }
    }
}
```

Advantages:

- Control over the target FPS.
- Independent of monitor refresh rate.

Limitations:

- Does not prevent screen tearing.
- `SDL_Delay()` is not an exact timer.
- Requires additional timing code.

## 5. Quick Reference

| Function / concept | Purpose |
| --- | --- |
| `SDL_Delay(16)` | Sleeps approximately 16 milliseconds |
| `SDL_SetRenderVSync(renderer, 1)` | Enables VSync |
| `SDL_SetRenderVSync(renderer, 0)` | Disables VSync |
| `SDL_GetPerformanceCounter()` | Gets high-resolution counter |
| `SDL_GetPerformanceFrequency()` | Gets counter frequency |
| `deltaTime` | Elapsed time between frames, in seconds |
| `FPS` | Frames produced per second |
| Fixed timestep | Advances simulation in constant increments |
| Variable timestep | Advances simulation using actual elapsed time |

## 6. Recommended Practices

For everyday SDL3 development:

1. Use `dt = 0.016f` and `SDL_Delay(16)` for quick experiments.
2. Use performance counters to calculate actual delta time in real applications.
3. Express movement speeds in units per second.
4. Use VSync as a sensible starting point for traditional games.
5. Clamp large delta-time values to avoid sudden simulation jumps.
6. Use raw elapsed time for FPS reporting.
7. Consider fixed timestep when implementing more advanced physics.
8. Avoid combining VSync and a manual frame limiter unless you have a specific reason.

## 7. Final Cheat Sheet

## Quick testing

```cpp
SDL_SetRenderVSync(renderer, 1);

while (running)
{
    constexpr float dt = 0.016f; // if my monitor is 60Hz
}
```
or

```cpp
constexpr float dt = 0.016f;
SDL_Delay(16);
```

Simple approximate 60 FPS loop.

## Normal game development


```cpp
SDL_SetRenderVSync(renderer, 1);
float dt = calculateDeltaTime();
```

VSync + measured delta time.

## Manual 60 FPS limiting


```cpp
SDL_SetRenderVSync(renderer, 0);
constexpr double dt = 1.0 / 60.0;
```

Disable VSync and implement your own frame limiter.

## Fixed timestep simulation


```cpp
constexpr double FIXED_DT = 1.0 / 60.0;
```

Useful for predictable physics updates.

The most important thing to remember:

FPS controls how frequently frames are produced. VSync controls when frames are presented. Delta time controls how much your simulation advances.

These are three different concepts, and understanding how they work together is fundamental to building games with SDL3.
