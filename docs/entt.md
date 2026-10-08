# EnTT

# Download

```bash
wget https://raw.githubusercontent.com/skypjack/entt/refs/heads/main/single_include/entt/entt.hpp
or
curl -L -o entt.hpp "https://raw.githubusercontent.com/skypjack/entt/refs/heads/main/single_include/entt/entt.hpp"
```

# API

[!NOTE]
<strong>NOTE</strong>
Below it is the most common API used in <strong>EnTT</strong>. For a full example, go the to the <a href="/#entt#example">Example</a> section of this page.

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

Notice that there's no inheritance or special EnTT code here. They're just C++ structs.

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
entt::entity entity = registry.create();;
```

You normally let `auto` handle the type.

```cpp
auto entity = registry.create();
```

You can create multiple entities:

```cpp
auto player = registry.create();
auto enemy  = registry.create();
auto bullet = registry.create();
```

## 4. Get the entity ID

- `entt::to_entity(entity)`: Give me the entity identifier/index.
- `entt::to_integral(entity)`: Gives you the complete underlying representation, including the version/generation information.

## 5. Destroy an entity

```cpp
registry.destroy(enemy);
or
registry.destroy(static_cast<entt::entity>(i));
```

The entity and its components are removed from the registry.

[!NOTE]
<strong>NOTE</strong>
This is important because EnTT can <strong>reuse entity identifiers</strong> later.

## 6. Add a component

Use `emplace` to add components to an entity:

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

## 7. Get a component

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

## 8. Check a component

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

## 9. Remove a component

Remove a component from one entity.

```cpp
registry.remove<Velocity>(player);
```

## 10. Clear a component

Remove a component from all entities in the registry.

```cpp
registry.clear<TagSelected>();
```

## 11. Create a query (view)

This is one of the most important parts. You can query EnTT to fetch all entities with a particular component:

```cpp
auto view = registry.view<Position>();
```

This means:

> Give me entities that have a `Position` component and store them in `view`.

So, now you have the query in `view`. Now you can process the query and implement whatever feature you need to implement. Following the above query, now we calculate the position of each entity fetched from the query:

```cpp
for (auto [entity, position] : view.each())
{
    position.x += 1.0f;
}
```

## 12. Query multiple components

You can also query more than one component. This is where ECS becomes particularly useful.

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

## 13. View without the entity

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

## 14. Tags / empty components

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

## 15. Remove tags

Same API:

```cpp
registry.remove<Selected>(entity);
```

## 16. Replace/update a component

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

## 17. Check whether an entity is valid

```cpp
if (registry.valid(entity))
{
    // entity still exists
}
```

This becomes useful when dealing with entities whose lifetime isn't guaranteed.

## 18. Clear the registry

Remove all entities and all components from the registry:

```cpp
registry.clear();
```

This is useful in you load a new level, for instance.

## 19. Remove vs Clear vs Destroy

| Code                                   | Effect                                     |
| -------------------------------------- | ------------------------------------------ |
| `registry.remove<TagSelected>(entity)` | Remove `TagSelected` from **one entity**   |
| `registry.clear<TagSelected>()`        | Remove `TagSelected` from **all entities** |
| `registry.destroy(entity)`             | Destroy **one entity and its components**  |
| `registry.clear()`                     | Clear **the entire registry**              |

## Example

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

    // Process result of query
    for (auto [entity, pos, vel] : view.each())
    {
        pos.x += vel.x;
        pos.y += vel.y;

        std::cout << "Entity "
                    << entt::to_entity(entity) << ": "
                    << pos.x << ", "
                    << pos.y << "\n";
    }

    // Create entities and add components in loop
    for(std::size_t i = 0; i < 5; ++i) {
        auto entity = registry.create();
        registry.emplace<Position>(entity, static_cast<float>(i), static_cast<float>(i));
    }
 
    // Destroy entity created in loop
    registry.destroy(static_cast<entt::entity>(1));
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
| `registry.any_of<T>()`  | Check components                     |
| `registry.view<T>()`    | Query entities                       |
| `view.each()`           | Iterate entity + components          |
| `registry.valid()`      | Check entity validity                |
| `entt::to_entity()`     | Get entity identifier                |
| `entt::to_integral()`   | Get complete underlying entity value |

Once these make sense, **most of the basic EnTT ECS model becomes much easier to understand**.

### Clarification

* `registry.all_of<T>(entity)` asks about **one specific entity**.
* `registry.any_of<T>(entity)` asks about **one specific entity**.
* `registry.view<T>()` creates a query for **all entities that have component T**.
* `view.each()` lets you process **all entities matching a component query**.

| API                          | What it does                                          | Scope         |
| ---------------------------- | ----------------------------------------------------- | ------------- |
| `registry.all_of<T>(entity)` | Checks whether **one specific entity** has `T`        | One entity    |
| `registry.any_of<T>(entity)` | Checks whether **one specific entity** has at least one of `T`        | One entity    |
| `registry.view<T>()`         | Creates a **query/view** for entities that have `T`   | Many entities |
| `view.each()`                | **Iterates** through the entities matched by the view | Many entities |

### `all_of`

```cpp
registry.all_of<PositionComp, VelocityComp>(entity)
```

means: **"Does this entity have these components?"**

### `any_of`

```cpp
registry.any_of<PositionComp, VelocityComp>(entity)
```

means: **"Does this entity have at least one of these components?"**

### `view`

```cpp
registry.view<PositionComp, VelocityComp>()
```

means: **"Which entities have these components?"**

```cpp
view.each()
```

means: **"Give me those entities and their components so I can process them."**

So for an ECS system, you'll very commonly see:

```cpp
auto view = registry.view<ComponentA, ComponentB>();

for (auto [entity, a, b] : view.each())
{
    // operate on entities having A and B
}
```

That's one of the fundamental patterns you'll use repeatedly with EnTT.
