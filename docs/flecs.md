# Flecs

# Download & Setup

## 1. Download

```bash
mkdir myproject
cd myproject

wget https://raw.githubusercontent.com/SanderMertens/flecs/master/distr/flecs.h
wget https://raw.githubusercontent.com/SanderMertens/flecs/master/distr/flecs.c
```

> For a reproducible project, replace `master` with a specific Flecs release/tag.

## 2. Compile Flecs

Compile `flecs.c` into `flecs.o`. This only needs to be done once:

```bash
gcc -std=gnu99 -c flecs.c -o flecs.o
```

You can delete `flecs.c` after this if you don't need to rebuild Flecs. Keep `flecs.h` because your C++ source files need it when compiling.

## 3. Compile and build

Run these commands every time you edit `main.cpp`:

```bash
g++ -std=c++17 -c main.cpp -o main.o
g++ main.o flecs.o -lrt -lpthread -lm -o myapp
```

## 4. Run the executable

```bash
./myapp
```

# API

[!NOTE] <strong>NOTE</strong>
Below are the most common APIs used in <strong>Flecs</strong>. For a full example, go to the <a href="/#flecs#example">Example</a> section of this page.

* **Entity** = an object/ID in the ECS
* **Component** = data attached to an entity
* **World** = manages entities/components and the ECS
* **Query** = finds entities having specific components
* **System** = a function that operates on entities/components

Here's the basic API you'll use most often.

### Include Flecs

```cpp
#include "flecs.h"
```

If `flecs.h` is installed in an include directory, you can also use:

```cpp
#include <flecs.h>
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

Notice that there's no inheritance or special Flecs code here. They're just C++ structs.

## 2. Create a world

The `world` is the central object that manages your ECS:

```cpp
flecs::world world;
```

Think of it roughly as:

```text
world
│
├── entities
├── Position components
├── Velocity components
├── Health components
└── ...
```

The Flecs `world` takes the role that the EnTT `registry` plays.

## 3. Create an entity

```cpp
flecs::entity entity = world.entity();
```

You normally let `auto` handle the type.

```cpp
auto entity = world.entity();
```

You can create multiple entities:

```cpp
auto player = world.entity();
auto enemy  = world.entity();
auto bullet = world.entity();
```

Flecs generates the entity IDs for you.

## 4. Get the entity ID

```cpp
auto id = ecs_entity_t_lo(entity.id());
or
auto id = entity.id();
```

The ID is the underlying Flecs entity identifier.

For example:

```cpp
std::cout << ecs_entity_to_lo(entity.id()) << "\n";
```

Unlike EnTT, you generally don't need a separate `to_entity()` function.

## 5. Destroy an entity

```cpp
enemy.destruct();
```

The entity and its components are removed from the world.

For example:

```cpp
auto enemy = world.entity();
enemy.set<Position>({50.0f, 100.0f});
enemy.destruct();
```

[!NOTE] <strong>NOTE</strong>
Keep the actual <code>flecs::entity</code> handle if you need to destroy a specific entity later. Don't assume that a particular numeric ID corresponds to the entity you created.

## 6. Add a component

Use `set` to add or update a component:

```cpp
player.set<Position>({10.0f, 20.0f});
```

Now:

```text
player
  │
  └── Position { 10, 20 }
```

Add another component:

```cpp
player.set<Velocity>({5.0f, 0.0f});
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
enemy.set<Position>({50.0f, 100.0f});

enemy.set<Health>({100});
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
auto* position = player.get_mut<Position>();

position->x += 10.0f;
```

You can also use `get` when you don't need to modify the component:

```cpp
const auto* position = player.get<Position>();
```

For multiple components, you can get them individually:

```cpp
auto* position = player.get_mut<Position>();
auto* velocity = player.get_mut<Velocity>();

position->x += velocity->x;
position->y += velocity->y;
```

For systems and queries, however, you will usually access multiple components directly through the query callback.

## 8. Check a component

Use `has`:

```cpp
if (player.has<Position>())
{
    // player has Position
}
```

Multiple components:

```cpp
if (player.has<Position, Velocity>())
{
    // player has BOTH
}
```

You can also check whether an entity has at least one of several components:

```cpp
if (player.has<Position>() || player.has<Velocity>())
{
    // player has at least one
}
```

For component presence checks on a specific entity, `has<T>()` is the Flecs equivalent of the common EnTT `all_of<T>()` pattern.

## 9. Remove a component

Remove a component from one entity.

```cpp
player.remove<Velocity>();
```

## 10. Clear a component

Remove a component from all entities in the registry.

```cpp
world.remove_all<TagSelected>()
```

## 11. Create a query

This is one of the most important parts of Flecs.

You can create a query that finds all entities with a particular component:

```cpp
auto query = world.query<Position>();
```

This means:

> Give me entities that have a `Position` component.

You can then process the query:

```cpp
query.each([](flecs::entity entity, Position& position)
{
    position.x += 1.0f;
});
```

The query matches all entities that have `Position`.

## 12. Query multiple components

You can query more than one component:

```cpp
auto query = world.query<Position, Velocity>();
```

Now you're saying:

> Give me entities that have **both** `Position` AND `Velocity`.

Then:

### `query.each`

```cpp
query.each([](flecs::entity entity, Position& pos, Velocity& vel)
{
    pos.x += vel.x;
    pos.y += vel.y;
});
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
void movementSystem(flecs::world& world, float dt)
{
    auto query = world.query<Position, Velocity>();

    query.each([dt](flecs::entity entity, Position& pos, Velocity& vel)
    {
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
    });
}
```
### `query.find`

`query.find` uses the same query to search for the first entity that satisfies a condition, but **it stops interation when a condition is met**:

```cpp
auto entity = query.find([](Position& pos, Velocity& vel)
{
    return pos.x > 100.0f;
});
```

The callback returns `true` when the entity you're looking for is found. Flecs then stops iterating and returns that entity.

Conceptually:

```text
Player
 ├── Position  ← yes
 └── Velocity  ← yes
      ↓
   condition false
      ↓
   keep searching

Enemy
 ├── Position  ← yes
 └── Velocity  ← yes
      ↓
   condition true
      ↓
    FOUND → stop
```

So for an ECS system, you might see:

```cpp
void selectEntity(flecs::world& world, Vector2 mousePos)
{
    auto query = world.query<Position, SelectionBounds>();

    auto entity = query.find([&](Position& pos, SelectionBounds& bounds)
    {
        return CheckCollisionPointCircle(mousePos, pos.position, bounds.radius);
    });

    if (entity)
    {
        entity.add<TagSelected>();
    }
}
```

Conceptually:

```text
query.each()
    → process every matching entity

query.find()
    → search matching entities
    → stop at the first entity satisfying the condition
    → return that entity
```

So `query.each` is generally for **processing all matching entities**, while `query.find` is for **finding one matching entity**.

## 13. Query without the entity

Sometimes you don't need the entity ID.

You can simply omit it from the callback:

```cpp
auto query = world.query<Position>();

query.each([](Position& pos)
{
    pos.x += 1.0f;
});
```

The callback can receive the components you need.

For example:

```cpp
auto query = world.query<Position, Velocity>();

query.each([](Position& pos, Velocity& vel)
{
    pos.x += vel.x;
    pos.y += vel.y;
});
```

The important distinction is:

```cpp
query.each([](flecs::entity entity, Position& position)
{
    // entity + component
});
```

versus:

```cpp
query.each([](Position& position)
{
    // component only
});
```

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
player.add<Player>();
enemy.add<Enemy>();
```

Then:

```cpp
auto query = world.query<Player>();

query.each([](flecs::entity entity)
{
    // entity has the Player tag
});
```

This is extremely common in ECS.

For example:

```cpp
struct Selected {};
```

Then:

```cpp
entity.add<Selected>();
```

means:

> This entity is currently selected.

You don't need a `bool selected` inside another component.

## 15. Remove tags

Tags use the same `remove` API:

```cpp
entity.remove<Selected>();
```

## 16. Replace/update a component

In Flecs, `set` can be used to add or replace a component value:

```cpp
enemy.set<Health>({50});
```

If `Health` is:

```cpp
struct Health {
    int value{};
};
```

then the value becomes:

```text
Health = 50
```

You can also modify an existing component:

```cpp
auto* health = enemy.get_mut<Health>();

health->value = 50;
```

## 17. Check whether an entity is alive

Use `is_alive()`:

```cpp
if (entity.is_alive())
{
    // entity still exists
}
```

This becomes useful when dealing with entities whose lifetime isn't guaranteed.

## 18. Reset the registry

Remove all entities and all components from the registry:

```cpp
world.reset();
```

## 19. Remove vs Reset vs Destruct

| Code                               | Effect                                     |
| ---------------------------------- | ------------------------------------------ |
| `entity.remove<TagSelected>()`     | Remove `TagSelected` from **one entity**   |
| `world.remove_all<TagSelected>()`  | Remove `TagSelected` from **all entities** |
| `entity.destruct()`                | Destroy **one entity and its components**  |
| `world.reset()`                    | Reset **the entire world**                 |

## Example

Putting the important pieces together:

```cpp
#include "flecs.h"
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
    flecs::world world;

    // Create entities
    auto player = world.entity();
    auto enemy  = world.entity();

    // Add components
    player.set<Position>({0.0f, 0.0f});
    player.set<Velocity>({5.0f, 2.0f});

    enemy.set<Position>({100.0f, 50.0f});

    // Query entities with Position + Velocity
    auto query = world.query<Position, Velocity>();

    // Process result of query
    query.each([](flecs::entity entity, Position& pos, Velocity& vel)
    {
        pos.x += vel.x;
        pos.y += vel.y;

        std::cout << "Entity "
                  << ecs_entity_t_lo(entity.id()) << ": "
                  << pos.x << ", "
                  << pos.y << "\n";
    });

    // Create entities and add components in loop
    for(std::size_t i = 0; i < 5; ++i) {
        auto entity = world.entity();
        entity.set<Position>({static_cast<float>(i), static_cast<float>(i)});
    }
 
    // Destroy entity created in loop
    world.entity(520).destruct();
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

## The Flecs API I'd learn first

If you're starting out, you don't need to learn the entire Flecs API. I'd focus on these first:

| API                   | Purpose               |
| --------------------- | --------------------- |
| `flecs::world`        | ECS container         |
| `world.entity()`      | Create entity         |
| `entity.destruct()`   | Destroy entity        |
| `entity.set<T>()`     | Add/update component  |
| `entity.get<T>()`     | Get component         |
| `entity.get_mut<T>()` | Get mutable component |
| `entity.remove<T>()`  | Remove component      |
| `entity.has<T>()`     | Check component       |
| `world.query<T>()`    | Create query          |
| `query.each()`        | Iterate query results (all) |
| `query.find()`        | Iterate query results (not all) |
| `entity.is_alive()`   | Check entity validity |
| `entity.id()`         | Get entity identifier |

Once these make sense, **most of the basic Flecs ECS model becomes much easier to understand**.

### Clarification

There is an important difference between checking one entity and querying many entities.

```cpp
entity.has<Position>()
```

means: **Does this specific entity have `Position`?**

Whereas:

```cpp
world.query<Position>()
```

means: **Which entities have `Position`?**

And:

```cpp
query.each(...)
```

means: **Process every entity matched by the query.**

| API                | What it does                                       | Scope         |
| ------------------ | -------------------------------------------------- | ------------- |
| `entity.has<T>()`  | Checks whether **one specific entity** has `T`     | One entity    |
| `world.query<T>()` | Creates a **query** for entities that have `T`     | Many entities |
| `query.each()`     | **Iterates** through **ALL** entities matched by the query | Many entities |
| `query.find()`     | **Iterates** through entities matched by the query dondition met | Many entities |

### `has`

**"Does this entity have `Position`?"**

```cpp
entity.has<Position>()
```

**"Does this entity have `Position` AND `Velocity`?"**
For multiple components:

```cpp
entity.has<Position, Velocity>()
```

### `query`

**"Which entities have `Position` AND `Velocity`?"**

```cpp
auto query = world.query<Position, Velocity>();
```

### `query.each`

**"Give me each matching entity and its components so I can process them."**

```cpp
query.each([](flecs::entity entity, Position& position, Velocity& velocity)
{
    // operate on entities having Position and Velocity
});
```

So for an ECS system, you'll very commonly see:

```cpp
auto query = world.query<ComponentA, ComponentB>();

query.each([](flecs::entity entity, ComponentA& a, ComponentB& b)
{
    // operate on entities having A and B
});
```

### `query.find`

**"Search the matching entities and return the first one that satisfies my condition."**

```cpp
auto entity = query.find([](Position& position, SelectionBounds& bounds)
{
    return CheckCollisionPointCircle(mousePos, position.position, bounds.radius);
});
```

So for an ECS system, you'll commonly see:

```cpp
auto query = world.query<ComponentA, ComponentB>();

auto entity = query.find([](ComponentA& a, ComponentB& b)
{
    return /* condition */;
});

if (entity)
{
    // operate on the first entity matching the condition
}
```

The key distinction is:

```text
query.each()
    → process every matching entity

query.find()
    → search matching entities
    → stop at the first one satisfying the condition
    → return that entity
```

For your mouse-selection example:

```cpp
auto query = world.query<Position, SelectionBounds>();

auto entity = query.find([&](Position& position, SelectionBounds& bounds)
{
    return CheckCollisionPointCircle(mousePos, position.position, bounds.radius);
});

if (entity)
    entity.add<TagSelected>();
```

That's essentially Flecs's equivalent of your EnTT:

```cpp
for (auto [entity, position, bounds] : view.each())
{
    if (CheckCollisionPointCircle(mousePos, position.position, bounds.radius))
    {
        registry.emplace<TagSelected>(entity);
        break;
    }
}
```

The important concept is that **`find` is a search, not a general iteration mechanism**. The callback's return value determines whether the current entity is the one you're looking for.


That's one of the fundamental patterns you'll use repeatedly with Flecs.

One small terminology change is intentional: Flecs uses **`world`** rather than EnTT's **`registry`**, and **`query`** rather than EnTT's **`view`** as the main query abstraction.

