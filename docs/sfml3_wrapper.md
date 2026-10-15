# SS — Simple SFML Game Library

A lightweight, header-only C++ library built on SFML 3 for creating simple 2D games with immediate-style helpers.

## Requirements

* C++17 or later
* SFML 3.x

## Installation

- Download [wrapper.h](https://raw.githubusercontent.com/cheomanigua/cplus/refs/heads/main/sfml3/wrapper/wrapper.h)
- Copy `wrapper.h` into your project and include it:

```cpp
#include "wrapper.h"
```

All functions, types, and constants are defined in the `wp` namespace.

## API Reference

### Colors

Predefined `sf::Color` constants for quick styling.

| **Constant** | **RGBA Values** | 
|-|-| 
| `wp::Blue` | `{0, 121, 241, 255}` | 
| `wp::Red` | `{230, 41, 55, 255}` | 
| `wp::White` | `{255, 255, 255, 255}` | 
| `wp::Black` | `{0, 0, 0, 255}` | 
| `wp::Gray` | `{80, 80, 80, 255}` | 

### Game Objects & Structs

| **Type** | **Description** | **Example** | 
|-|-|-|  
| `Circle` | Circle defined by center position and radius. | `wp::Circle ball{{100.f, 100.f}, 20.f};` | 
| `Rectangle` | Rectangle defined by top-left position and size. | `wp::Rectangle wall{{100.f, 100.f}, {50.f, 30.f}};` | 
| `Sprite` | Textured image defined by position and `const sf::Texture*`. | `wp::Texture tex = wp::loadTexture("bunny.png");` <br>  `wp::Sprite bunny{{100.f, 100.f}, &tex};` | 

- `Rectangle::GetBounds()` returns its `sf::FloatRect` bounding box.
- `Sprite::GetBounds()` returns its texture-sized `sf::FloatRect`, or an empty rectangle if its texture pointer is null.

### Textures

| **Function** | **Description** | **Example** | 
|-|-|-|  
| `loadTexture(path)` | Helper to load an `sf::Texture` from file path. | `sf::Texture texture = wp::loadTexture("bunny.png");` | 

### Rendering & Drawing

Pass your `sf::RenderTarget` (like an `sf::RenderWindow`) as the first argument to draw functions.

| **Function** | **Description** | **Example** | 
|-|-|-|  
| `draw(window, circle, color)` | Draws an outlined circle. | `wp::draw(window, ball, wp::Red);` | 
| `draw(window, rectangle, color)` | Draws an outlined rectangle. | `wp::draw(window, wall, wp::Blue);` | 
| `draw(window, sprite)` | Draws a sprite at its position. | `wp::draw(window, bunny);` | 
| `drawCircle(window, pos, radius, color)` | Immediate-style primitive circle draw. | `wp::drawCircle(window, {100.f, 100.f}, 15.f);` | 
| `drawRect(window, pos, size, color)` | Immediate-style primitive rectangle draw. | `wp::drawRect(window, {50.f, 50.f}, {40.f, 40.f});` | 


### Collision Detection

All collision functions return `true` on collision and `false` otherwise.

| **Overload** | **Description** | **Example** | 
| --- | --- | --- |
| `CheckCollision(point, circleCenter, radius)` | Point vs. circle | `wp::CheckCollision(mousePos, ball.position, ball.radius);` |
| `CheckCollision(point, sf::FloatRect)` | Point vs. rectangle bounds | `wp::CheckCollision(mousePos, wall.GetBounds());` |
| `CheckCollision(centerA, radiusA, centerB, radiusB)` | Circle vs. circle using positions and radii | `wp::CheckCollision(posA, rA, posB, rB);` |
| `CheckCollision(sf::FloatRect, sf::FloatRect)` | Rectangle bounds vs. rectangle bounds | `wp::CheckCollision(rectA, rectB);` |
| `CheckCollision(center, radius, sf::FloatRect)` | Circle vs. rectangle bounds | `wp::CheckCollision(ball.position, ball.radius, wall.GetBounds());` |
| `CheckCollision(Circle, Circle)` | Circle vs. circle using `Circle` structs | `wp::CheckCollision(ballA, ballB);` |
| `CheckCollision(Rectangle, Rectangle)` | Rectangle vs. rectangle using `Rectangle` structs | `wp::CheckCollision(wall1, wall2);` |
| `CheckCollision(Circle, Rectangle)` | Circle vs. rectangle using `Circle` and `Rectangle` structs | `wp::CheckCollision(ball, wall);` |

Sprite collisions can be checked using their bounding boxes:

| **Usage** | **Description** | **Example** |
|-|-|-|
| `CheckCollision(Sprite.GetBounds(), sf::FloatRect)` | Sprite bounds vs. rectangle bounds | `wp::CheckCollision(bunny.GetBounds(), wall.GetBounds());` |
| `CheckCollision(Sprite.GetBounds(), Sprite.GetBounds())` | Sprite bounds vs. sprite bounds | `wp::CheckCollision(bunny.GetBounds(), bunny2.GetBounds());` |


## Example Usage

```cpp
#include "wrapper.h"

int main()
{
    sf::RenderWindow window(sf::VideoMode({800, 600}), "My Game");
    window.setFramerateLimit(60);
    sf::Clock clock;

    constexpr float speed {200.0f};

    sf::Font font("/usr/share/fonts/xscreensaver/clacon.ttf");
    sf::Text my_text(font);
    //my_text.setPosition({0.0f, 20.0f});

    sf::Texture texture = wp::loadTexture("raybunny.png");
    wp::Sprite player{{100.f, 100.f}, &texture};
    wp::Rectangle wall1{{250.f, 150.f}, {100.f, 40.f}};
    wp::Rectangle wall2{{450.f, 250.f}, {150.f, 80.f}};

    while (window.isOpen())
    {
        while (const auto event = window.pollEvent())
        {
            if (event->is<sf::Event::Closed>())
                window.close();
        }

        wp::Input input = wp::GetInput();

        sf::Vector2f direction{
            static_cast<float>(input.right - input.left),
            static_cast<float>(input.down - input.up)
        };

        const float dt = clock.restart().asSeconds();

        // Normalize diagonal movement if moving horizontally & vertically
        if (direction.x != 0.0f && direction.y != 0.0f)
        {
            direction.x *= 0.70710678f;
            direction.y *= 0.70710678f;
        }

        player.position.x += direction.x * speed * dt;
        player.position.y += direction.y * speed * dt;

        bool isColliding = wp::CheckCollision(player.GetBounds(), wall1.GetBounds());

        window.clear(sf::Color::Black);
        window.draw(my_text);

        wp::draw(window, player);
        wp::draw(window, wall1, (isColliding ? wp::Red : wp::White));
        wp::draw(window, wall2);

        my_text.setString(isColliding ? "Collided: YES" : "Collided: NO");

        window.display();
    }
}
```
