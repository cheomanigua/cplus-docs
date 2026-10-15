# SS — Simple SFML Game Library

A lightweight, header-only C++ library built on SFML 3 for creating simple 2D games with immediate-style helpers.

## Requirements

* C++17 or later
* SFML 3.x

## Installation

Copy `ss.hpp` into your project and include it:

```
#include "ss.hpp"
```

All functions, types, and constants are defined in the `ss` namespace.

## API Reference

### Colors

Predefined `sf::Color` constants for quick styling.


| **Constant** | **RGBA Values** | 
|-|-| 
| `ss::Blue` | `{0, 121, 241, 255}` | 
| `ss::Red` | `{230, 41, 55, 255}` | 
| `ss::White` | `{255, 255, 255, 255}` | 
| `ss::Black` | `{0, 0, 0, 255}` | 
| `ss::Gray` | `{80, 80, 80, 255}` | 

### Game Objects & Structs

| **Type** | **Description** | **Example** | 
|-|-|-|  
| `Circle` | Circle defined by center position and radius. | `ss::Circle ball{{100.f, 100.f}, 20.f};` | 
| `Rectangle` | Rectangle defined by top-left position and size. | `ss::Rectangle wall{{100.f, 100.f}, {50.f, 30.f}};` | 
| `Sprite` | Textured image defined by position and `const sf::Texture*`. | `ss::Texture tex = ss::loadTexture("bunny.png");` <br>  `ss::Sprite bunny{{100.f, 100.f}, &tex};` | 

* `Rectangle::GetBounds()` returns its `sf::FloatRect` bounding box.
* `Sprite::GetBounds()` returns its texture-sized `sf::FloatRect`, or an empty rectangle if its texture pointer is null.

### Textures

| **Function** | **Description** | **Example** | 
|-|-|-|  
| `loadTexture(path)` | Helper to load an `sf::Texture` from file path. | `sf::Texture texture = ss::loadTexture("bunny.png");` | 

### Rendering & Drawing

Pass your `sf::RenderTarget` (like an `sf::RenderWindow`) as the first argument to draw functions.

| **Function** | **Description** | **Example** | 
|-|-|-|  
| `draw(window, circle, color)` | Draws an outlined circle. Default color is `ss::Blue`. | `ss::draw(window, ball, ss::Red);` | 
| `draw(window, rectangle, color)` | Draws an outlined rectangle. Default color is `ss::Red`. | `ss::draw(window, wall, ss::Blue);` | 
| `draw(window, sprite)` | Draws a sprite at its position. | `ss::draw(window, bunny);` | 
| `drawCircle(window, pos, radius, color)` | Immediate-style primitive circle draw. | `ss::drawCircle(window, {100.f, 100.f}, 15.f);` | 
| `drawRect(window, pos, size, color)` | Immediate-style primitive rectangle draw. | `ss::drawRect(window, {50.f, 50.f}, {40.f, 40.f});` | 


### Collision Detection

All collision functions return `true` on collision and `false` otherwise.

| **Overload** | **Description** | **Example** | 
|-|-|-|  
| `CheckCollision(point, circleCenter, radius)` | Point vs. circle. | `ss::CheckCollision(mousePos, ball.position, ball.radius);` | 
| `CheckCollision(point, sf::FloatRect)` | Point vs. rectangle bounds. | `ss::CheckCollision(mousePos, wall.GetBounds());` | 
| `CheckCollision(centerA, radiusA, centerB, radiusB)` | Circle vs. circle (manual coords/radii). | `ss::CheckCollision(posA, rA, posB, rB);` | 
| `CheckCollision(sf::FloatRect, sf::FloatRect)` | Rectangle bounds vs. rectangle bounds. | `ss::CheckCollision(rectA, rectB);` | 
| `CheckCollision(center, radius, sf::FloatRect)` | Circle vs. rectangle bounds. | `ss::CheckCollision(ball.position, ball.radius, wall.GetBounds());` | 
| `CheckCollision(Circle, Circle)` | Circle vs. circle structs. | `ss::CheckCollision(ballA, ballB);` | 
| `CheckCollision(Rectangle, Rectangle)` | Rectangle vs. rectangle structs. | `ss::CheckCollision(wall1, wall2);` | 
| `CheckCollision(Circle, Rectangle)` | Circle vs. rectangle structs. | `ss::CheckCollision(ball, wall);` | 

Sprite collisions can be checked using their bounding boxes:

```
if (ss::CheckCollision(player.GetBounds(), wall.GetBounds())) {
    // Collision handled
}
```

## Example Usage

```
#include "ss.hpp"

int main()
{
    sf::RenderWindow window(sf::VideoMode({800, 600}), "My Game");
    window.setFramerateLimit(60);
    sf::Clock clock;

    sf::Font font("/usr/share/fonts/xscreensaver/clacon.ttf");
    sf::Text my_text(font);
    my_text.setPosition({0.0f, 20.0f});

    sf::Texture texture = ss::loadTexture("raybunny.png");
    ss::Sprite player{{100.f, 100.f}, &texture};
    ss::Rectangle wall{{250.f, 150.f}, {100.f, 40.f}};

    while (window.isOpen())
    {
        while (const auto event = window.pollEvent())
        {
            if (event->is<sf::Event::Closed>())
                window.close();
        }

        const float dt = clock.restart().asSeconds();

        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Key::Right))
            player.position.x += 200.f * dt;
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Key::Left))
            player.position.x -= 200.f * dt;
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Key::Down))
            player.position.y += 200.f * dt;
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Key::Up))
            player.position.y -= 200.f * dt;

        bool isColliding = ss::CheckCollision(player.GetBounds(), wall.GetBounds());
        my_text.setString(isColliding ? "Collided: YES" : "Collided: NO");

        window.clear(sf::Color::Black);
        window.draw(my_text);

        ss::draw(window, player);
        ss::draw(window, wall);

        window.display();
    }
}
```

## License

Specify your project's license before distributing the library.
