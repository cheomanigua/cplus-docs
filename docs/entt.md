# EnTT

# Download

```bash
wget https://raw.githubusercontent.com/skypjack/entt/refs/heads/main/single_include/entt/entt.hpp
```

# Basics

```cpp
#include "entt.hpp"

struct PositionComp {
    float x{}, y{};
};

void movementSystem(entt::registry& registry, float deltaTime)
{
    // Query entities that have a PositionComp component.
    auto view = registry.view<PositionComp>();

    for (auto [entity, position] : view.each())
    {
        position.x += 1.0f * deltaTime;
        position.y += 1.0f * deltaTime;
    }
}
```

is the same as:

```cpp
#include "entt.hpp"
     
struct PositionComp {
    float x{}, y{};
};
 
void movementSystem(entt::registry& registry, float deltaTime)
{
    // Query entities that have a PositionComp component.
    auto view = registry.view<PositionComp>();
 
    for (auto entity : view)
    {
        auto& position = view.get<PositionComp>(entity);
 
        position.x += 1.0f * deltaTime;
        position.y += 1.0f * deltaTime;
    }
}
```

### Example

```cpp
#include "entt.hpp"
#include <iostream>

struct PositionComp {
    float x{}, y{};
};

void printPositions(entt::registry& registry)
{
    auto view = registry.view<PositionComp>();

    for (auto [entity, position] : view.each())
    {
        std::cout << "Entity " << static_cast<uint32_t>(entt::to_entity(entity)) // VERSION 1
        std::cout << "Entity " << entt::to_entity(entity) // VERSION 2
        std::cout << "Entity " << entt::to_integral(entity) // VERSION 3
                  << ": "
                  << position.x << ", "
                  << position.y << "\n";
    }
    std::cout << "\n";
}

int main()
{
    entt::registry registry{};
    std::vector<entt::entity> entities{};

    // Create entities 0, 1, 2, 3, 4.
    for (int i = 0; i < 5; ++i)
    {
        auto entity = registry.create();
        entities.push_back(entity);

        registry.emplace<PositionComp>(
            entity,
            static_cast<float>(i),
            static_cast<float>(i)
        );
    }

    std::cout << "Before destruction:\n";
    printPositions(registry);

    std::cout << "After destruction of Entity 1:\n";
    registry.destroy(entities[1]);
    printPositions(registry);

    std::cout << "After creating a new entity:\n";
    auto newEntity = registry.create();
    registry.emplace<PositionComp>(
        newEntity,
        5.0f,
        5.0f
    );
    printPositions(registry);
}
```

Output:

- **Version 1 & 2**

```text
Before destruction:
Entity 4: 4, 4
Entity 3: 3, 3
Entity 2: 2, 2
Entity 1: 1, 1
Entity 0: 0, 0

After destruction of Entity 1:
Entity 3: 3, 3
Entity 2: 2, 2
Entity 4: 4, 4
Entity 0: 0, 0

After creating a new entity:
Entity 1: 5, 5
Entity 3: 3, 3
Entity 2: 2, 2
Entity 4: 4, 4
Entity 0: 0, 0
```

- **Version 3**

```text
Before destruction:
Entity 4: 4, 4
Entity 3: 3, 3
Entity 2: 2, 2
Entity 1: 1, 1
Entity 0: 0, 0

After destruction of Entity 1:
Entity 3: 3, 3
Entity 2: 2, 2
Entity 4: 4, 4
Entity 0: 0, 0

After creating a new entity:
Entity 1048577: 5, 5
Entity 3: 3, 3
Entity 2: 2, 2
Entity 4: 4, 4
Entity 0: 0, 0
```
As you can see, **EnTT** recycles the entities, in this case Entity 1 / Entity 1048577.

# API

- **Entity** = an ID
- **Component** = data attached to an entity
- **Registry** = manages entities/components
- **View** = queries entities having specific components
- **System** = your functions that operate on those components

Here's the basic API you'll use most often.

### Include EnTT

```cpp
#include <entt/entt.hpp>
```

Depending on how you've installed EnTT, your include may also be:

```cpp
#include "entt.hpp"
```

## 1. Define components

Components are usually simple structs containing data:

```cpp
struct Position {
    float x{};
    float y{};
};

struct Velocity {
    float x{};
    float y{};
};

struct Health {
    int value{};
};
```

Notice that there's no inheritance or special EnTT code here.

They're just C++ structs.

## 2. Create a registry

The `registry` is the central object that manages your ECS:

```cpp
entt::registry registry;
```

Think of it roughly as:

```text
registry
│
├── entities
├── Position components
├── Velocity components
├── Health components
└── ...
```

## 3. Create an entity

```cpp
auto entity = registry.create();
```

Now you have an EnTT entity:

```cpp
entt::entity entity;
```

You normally let `auto` handle the type.

You can create multiple entities:

```cpp
auto player = registry.create();
auto enemy  = registry.create();
auto bullet = registry.create();
```

## 4. Add a component

Use `emplace`:

```cpp
registry.emplace<Position>(player, 10.0f, 20.0f);
```

Now:

```text
player
  │
  └── Position { 10, 20 }
```

Add another component:

```cpp
registry.emplace<Velocity>(player, 5.0f, 0.0f);
```

Now:

```text
player
  │
  ├── Position
  └── Velocity
```

You can add components to different entities:

```cpp
registry.emplace<Position>(enemy, 50.0f, 100.0f);
registry.emplace<Health>(enemy, 100);
```

So you might have:

```text
player
 ├── Position
 └── Velocity

enemy
 ├── Position
 └── Health

bullet
 └── Position
```

That's the core ECS idea.

## 5. Get a component

If you already know an entity has a component:

```cpp
auto& position = registry.get<Position>(player);

position.x += 10.0f;
```

You can also get multiple components:

```cpp
auto [position, velocity] =
    registry.get<Position, Velocity>(player);
```

Then:

```cpp
position.x += velocity.x;
position.y += velocity.y;
```

## 6. Check whether an entity has a component

Use `all_of`:

```cpp
if (registry.all_of<Position>(player))
{
    // player has Position
}
```

Multiple components:

```cpp
if (registry.all_of<Position, Velocity>(player))
{
    // player has BOTH
}
```

You also have `any_of`:

```cpp
if (registry.any_of<Position, Velocity>(player))
{
    // player has at least one of them
}
```

## 7. Remove a component

```cpp
registry.remove<Velocity>(player);
```

Now:

```text
player
 └── Position
```

`Velocity` is gone.

## 8. Destroy an entity

```cpp
registry.destroy(enemy);
```

The entity and its components are removed from the registry.

This is important because EnTT can **reuse entity identifiers** later.

That's related to the `to_entity()` vs `to_integral()` question you were asking earlier.

## 9. Create a view

This is one of the most important parts.

Suppose:

```cpp
auto view = registry.view<Position>();
```

This means:

> Give me entities that have a `Position` component.

Then:

```cpp
for (auto [entity, position] : view.each())
{
    position.x += 1.0f;
}
```

Conceptually:

```text
Registry

Player ─────── Position
Enemy  ─────── Position
Bullet ─────── Position
Camera ─────── no Position


view<Position>

        ↓

Player
Enemy
Bullet
```

## 10. Query multiple components

This is where ECS becomes particularly useful.

```cpp
auto view = registry.view<Position, Velocity>();
```

Now you're saying:

> Give me entities that have **both** `Position` AND `Velocity`.

Then:

```cpp
for (auto [entity, position, velocity] : view.each())
{
    position.x += velocity.x;
    position.y += velocity.y;
}
```

Conceptually:

```text
Player
 ├── Position  ← yes
 └── Velocity  ← yes
       ↓
     included

Enemy
 ├── Position  ← yes
 └── Health    ← no Velocity
       ↓
     excluded
```

This is essentially an ECS system:

```cpp
void movementSystem(entt::registry& registry, float dt)
{
    auto view = registry.view<Position, Velocity>();

    for (auto [entity, position, velocity] : view.each())
    {
        position.x += velocity.x * dt;
        position.y += velocity.y * dt;
    }
}
```

## 11. View without the entity

Sometimes you don't care about the entity ID.

You can iterate the components:

```cpp
auto view = registry.view<Position>();

for (auto& position : view)
{
    position.x += 1.0f;
}
```

For multiple components, you can use the appropriate iteration facilities to access the component values.

The important distinction from your earlier question is:

```cpp
for (auto [entity, position] : view.each())
```

gives you the **entity + component**.

Whereas iterating the view itself can give you the **component(s)** without explicitly asking for the entity.

## 12. Get the entity ID

You already encountered this:

```cpp
entt::to_entity(entity)
```

For example:

```cpp
std::cout << entt::to_entity(entity);
```

Remember:

```cpp
entt::to_entity(entity)
```

means:

> Give me the entity identifier/index.

Whereas:

```cpp
entt::to_integral(entity)
```

gives you the complete underlying representation, including the version/generation information.

## 13. Tags / empty components

A component doesn't need to contain data.

For example:

```cpp
struct Player {};
struct Enemy {};
struct Dead {};
```

You can use these as **tags**:

```cpp
registry.emplace<Player>(player);
registry.emplace<Enemy>(enemy);
```

Then:

```cpp
auto view = registry.view<Player>();
```

finds your player entities.

This is extremely common in ECS.

For example:

```cpp
struct Selected {};
```

Then:

```cpp
registry.emplace<Selected>(entity);
```

means:

> This entity is currently selected.

You don't need a `bool selected` inside another component.

## 14. Remove tags

Same API:

```cpp
registry.remove<Selected>(entity);
```

## 15. Replace/update a component

You can use `replace`:

```cpp
registry.replace<Health>(enemy, 50);
```

If `Health` is:

```cpp
struct Health {
    int value;
};
```

then the value becomes:

```text
Health = 50
```

You can also simply modify the component:

```cpp
auto& health = registry.get<Health>(enemy);
health.value = 50;
```

## 16. Check whether an entity is valid

```cpp
if (registry.valid(entity))
{
    // entity still exists
}
```

This becomes useful when dealing with entities whose lifetime isn't guaranteed.

## 17. A small complete example

Putting the important pieces together:

```cpp
#include <entt/entt.hpp>
#include <iostream>

struct Position
{
    float x{};
    float y{};
};

struct Velocity
{
    float x{};
    float y{};
};

int main()
{
    entt::registry registry;

    // Create entities
    auto player = registry.create();
    auto enemy  = registry.create();

    // Add components
    registry.emplace<Position>(player, 0.0f, 0.0f);
    registry.emplace<Velocity>(player, 5.0f, 2.0f);

    registry.emplace<Position>(enemy, 100.0f, 50.0f);

    // Query entities with Position + Velocity
    auto view = registry.view<Position, Velocity>();

    for (auto [entity, position, velocity] : view.each())
    {
        position.x += velocity.x;
        position.y += velocity.y;

        std::cout
            << "Entity "
            << entt::to_entity(entity)
            << ": "
            << position.x << ", "
            << position.y
            << '\n';
    }
}
```

Only the player is processed because:

```text
player
 ├── Position
 └── Velocity
       ↓
     included


enemy
 └── Position
       ↓
     excluded
```

## The EnTT API I'd learn first

If you're starting out, you don't need to learn the entire EnTT API. I'd focus on these first:

| API                     | Purpose                              |
| ----------------------- | ------------------------------------ |
| `entt::registry`        | ECS container                        |
| `registry.create()`     | Create entity                        |
| `registry.destroy()`    | Destroy entity                       |
| `registry.emplace<T>()` | Add component                        |
| `registry.get<T>()`     | Get component                        |
| `registry.remove<T>()`  | Remove component                     |
| `registry.all_of<T>()`  | Check component                      |
| `registry.view<T>()`    | Query entities                       |
| `view.each()`           | Iterate entity + components          |
| `registry.valid()`      | Check entity validity                |
| `entt::to_entity()`     | Get entity identifier                |
| `entt::to_integral()`   | Get complete underlying entity value |

Once these make sense, **most of the basic EnTT ECS model becomes much easier to understand**.

