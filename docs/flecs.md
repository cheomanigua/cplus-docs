# Flecs

# Download & Setup

## 1. Download

```bash
wget https://raw.githubusercontent.com/SanderMertens/flecs/master/distr/flecs.h
wget https://raw.githubusercontent.com/SanderMertens/flecs/master/distr/flecs.c
or
curl -L -o flecs.h https://raw.githubusercontent.com/SanderMertens/flecs/master/distr/flecs.h
curl -L -o flecs.c https://raw.githubusercontent.com/SanderMertens/flecs/master/distr/flecs.c
```

## 2. Compile Flecs

Compile `flecs.c` into `flecs.o`. This only needs to be done once:

```bash
gcc -std=gnu99 -c flecs.c -o flecs.o
```

You can delete `flecs.c` after this if you don't need to rebuild Flecs. Keep `flecs.h` because your C++ source files need it when compiling.

## 3. Compile and build

Run these commands every time you edit `main.cpp`:

```bash
g++ -std=c++23 -c main.cpp -o main.o
g++ main.o flecs.o -lpthread -lm -o myapp
```
If you are also using **Raylib** or **SDL3**:

```bash
g++ -std=c++23 -c main.cpp -o main.o
g++ main.o flecs.o $(pkg-config --libs raylib) -lpthread -lm -o myapp
or
g++ main.o flecs.o $(pkg-config --libs sdl3) -lpthread -lm -o myapp
```


## 4. Run the executable

```bash
./myapp
```

# API

[!NOTE] <strong>NOTE</strong>
Below are the most common APIs used in <strong>Flecs</strong>. For a full example, go to the <a href="/#flecs#example">Example</a> section of this page.

* **World** = manages entities/components and the ECS
* **Entity** = an object/ID in the ECS
* **Component** = data attached to an entity
* **System** = a function that operates on entities/components
* **Prefab** = a reusable template for an entity and its components
* **Query** = finds entities having specific components


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

You can create entities with handle or without handle.

### Without handle

```cpp
world.entity();
```

This is most common when creating entities in bulk inside a loop. Components must be added also:

```cpp
flecs::world world{};

// Create 5 entities
for(std::size_t i{0}; i < 5; ++i) {
    float value {static_cast<float>(i)};
    world.entity()
        .set(Position{value, value})
        .set(Velocity{value, value});
}
```

You can create an entity without a handle by adding a name:

```cpp
world.entity("Player");
```

... and then later add a handle to add components or whatever:

```cpp
auto player = world.lookup("Player");
```

### With handle

```cpp
flecs::entity entity = world.entity();
or
auto entity = world.entity();
```

Creating an entity with a handle is useful if we plan to process that specific entity in a special way.

You can create different entities using the same handle, but it makes more sense to use a loop:

```cpp
auto enemy = world.entity();
enemy = world.entity();
enemy = world.entity();
```

You can create different entities using different handles:

```cpp
auto player = world.entity();
auto enemy  = world.entity();
auto bullet = world.entity();
```

[!NOTE]
Regardless of how to create the entity, Flecs generates the entity <strong>IDs</strong> for you.

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
or
player.set(Position{10.0f, 20.0f});
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

You can add components to different handles:

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

### There are 2 ways to create an entity and add components

```cpp
flecs::world world;

// Option 1 - with handle
auto player = world.entity();
player.set<Position>({50.0f, 100.0f});
player.set<Velocity>({10.0f, 10.0f});

// Option 2 - without handle
world.entity("Player")
    .set<Position>({100.0f, 100.0f})
    .set<Velocity>({0.0f, 0.0f});
```

With Option 2, you can later on create a handle to access:

```cpp
auto player = world.lookup("Player");
```

## 7. Get a component

If you already know an entity has a component, you can use `get` when you don't need to modify the component:

```cpp
const auto& pos = player.get<Position>();

std::println("Position: {}, {}", pos.x, pos.y);
```
For systems and queries, however, you will usually access multiple components directly through the [query callback](#flecs#11.-create-a-query).

If you have to modify the component, you can use `get_mut`:

```cpp
auto* pos = player.get_mut<Position>();

pos->x += 10.0f;
```

For multiple components, you can get them individually:

```cpp
auto* pos = player.get_mut<Position>();
auto* vel = player.get_mut<Velocity>();

pos->x += vel->x;
pos->y += vel->y;
```

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

## 11. Create a system

You can create systems directly with Flecs. In this example, we create a movement system. It will iterate through all entities having Position and Velocity components and calculate their positions:

```cpp
float deltaTime {1.0f/60.f};
world.system<Position, const Velocity>("Movement")
    .each([&](Position& p, const Velocity& v) {
        p.x += v.x * deltaTime;
        p.y += v.y * deltaTime;
    });
```

then, in the game loop, we update all Flecs systems by adding this line:

```cpp
world.progress(deltaTime);
```

If you gave a system a handle, you could manually  run that particular system:

```cpp
flecs::system mov = world.system...;
mov.run();
```

[!TIP]
<strong>TIP</strong>
<code>deltaTime</code> is passed by reference into <code>world.system</code> by using <code>&</code> in <code>.each([&]</code>. Any variable not local to <code>world.system</code> can be passed by reference by using <code>&</code>, regardless of how many variables you want to pass.
If you want to pass by value, use <code>=</code>.

## 12. Create a prefab

```cpp
struct Defense {
    float value;
};

// Create a SpaceShip prefab with a Defense component.
flecs::entity SpaceShip = world.prefab("SpaceShip")
    .set(Defense{50});

// Create two prefab instances
flecs::entity inst_1 = world.entity().is_a(SpaceShip);
flecs::entity inst_2 = world.entity().is_a(SpaceShip);

// Get instantiated component
const Defense& d = inst_1.get<Defense>();
```

## 13. Create a query

This is one of the most important parts of Flecs.

You can create a query that finds all entities with a particular component. However, we must differenciate between a one time query versus recurrent/every frame queries.

### One time query

For a one time ocurrence, we can create a quick query.

```cpp
auto query = world.query<Position>();
```

### Every frame query

We create and cache the query before hand. We can then use it whenever we need it. This is cheap and efficient.

```cpp
auto query = world.query_builder<Position>().cached().build();
```

Both queries mean:

> Give me entities that have a `Position` component.

You can then process the query:

```cpp
query.each([](Position& pos)
{
    pos.x += 1.0f;
    pos.y += 1.0f;
});
```
or

```cpp
query.each([](flecs::entity e, Position& pos)
{
    std::println("Entity {}: {}, {}", e.id(), pos.x, pos.y);
});
```

The query matches all entities that have `Position`.

## 14. Query multiple components

You can query more than one component:

```cpp
auto query = world.query<Position, Velocity>();
```

Now you're saying:

> Give me entities that have **both** `Position` AND `Velocity`.

Then:

### `query.each`

```cpp
query.each([](Position& pos, const Velocity& vel)
{
    pos.x += vel.x;
    pos.y += vel.y;
});
```

This is essentially an ECS system:

```cpp
// For this example we have created our own custom system, but you should use Flecs systems instead
void movementSystem(flecs::query<Position, const Velocity>& query, float dt)
{
    query.each([dt](Position& pos, const Velocity& vel)
    {
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
    });
}

int main() {
    flecs::world world;
    const float dt {1.0f / 60.0f};
    auto query = world.query_builder<Position, const Velocity>().cached().build();
    movementSystem(query, dt);
}
```

[!NOTE]
<strong>NOTE</strong>
Note how the function parameter <code>dt</code> is added in the query loop:
<code>query.each([dt](Position& pos, const Velocity& vel)</code>

### `query.find`

`query.find` uses the same query to search for the first entity that satisfies a condition, but **it stops interation when a condition is met**:

```cpp
auto entity = query.find([](Position& pos, Velocity& vel)
{
    return pos.x > 100.0f;
});
```

The callback returns `true` when the entity you're looking for is found. Flecs then stops iterating and returns that entity.

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

[!TIP]
<strong>TIP</strong>
<code>query.each</code> is generally for <strong>processing all matching entities</strong>, while <code>query.find</code> is for <strong>finding one matching entity</strong>.

## 15. Tags / empty components

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

## 16. Remove tags

Tags use the same `remove` API:

```cpp
entity.remove<Selected>();
```

## 17. Replace/update a component

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

## 18. Check whether an entity is alive

Use `is_alive()`:

```cpp
if (entity.is_alive())
{
    // entity still exists
}
```

This becomes useful when dealing with entities whose lifetime isn't guaranteed.

## 19. Reset the registry

Remove all entities and all components from the registry:

```cpp
world.reset();
```

## 20. Remove vs Reset vs Destruct

| Code                               | Effect                                     |
| ---------------------------------- | ------------------------------------------ |
| `entity.remove<TagSelected>()`     | Remove `TagSelected` from **one entity**   |
| `world.remove_all<TagSelected>()`  | Remove `TagSelected` from **all entities** |
| `entity.destruct()`                | Destroy **one entity and its components**  |
| `world.reset()`                    | Reset **the entire world**                 |

## Example

Putting the important pieces together:

```cpp
#include <cstddef>
#include <print>

#include "flecs.h"

struct Position {
    float x{}, y{};
};

struct Velocity {
    float x{}, y{};
};

void printPos(flecs::query<const Position>& q)
{
    q.each([](flecs::entity e, const Position& pos) {
        std::println("Entity {}: {}, {}", e.id(), pos.x, pos.y);
    });
    std::println();
}

int main() {
    flecs::world world{};
    constexpr float dt {1.0f / 60.0f};
    auto posQ = world.query<const Position>();

	// Create a system. Flecs manages its query and execution
	world.system<Position, const Velocity>("Movement")
        .each([](flecs::iter& it, std::size_t,
                 Position& pos, const Velocity& vel) {
            pos.x += vel.x * it.delta_time();
            pos.y += vel.y * it.delta_time();
        });

	// Creating 5 entities with handle
    for(std::size_t i = 0; i < 5; ++i) {
        auto e = world.entity();
        float value = static_cast<float>(i);
        e.set(Position{value, value});
        e.set(Velocity{value, value});
    }
    printPos(posQ);

	// Creating 5 entities without handle
	for(std::size_t i = 0; i < 5; ++i) {
        float value = static_cast<float>(i);
		world.entity()
			.set(Position{value, value})
			.set(Velocity{value, value});
	}
    printPos(posQ);

    for(std::size_t frame = 0; frame < 60; ++frame) {
        world.progress(dt); // Process all flecs systems
    }
    printPos(posQ);

    world.entity(523).destruct();
    printPos(posQ);

    world.entity()
		.set(Position{8.0f, 8.0f})
		.set(Velocity{8.0f, 8.0f});
    printPos(posQ);
}
```

## The Flecs API I'd learn first

If you're starting out, you don't need to learn the entire Flecs API. I'd focus on these first:

| API                   | Purpose               |
| --------------------- | --------------------- |
| `flecs::world`        | ECS container         |
| `world.entity()`      | Create entity         |
| `entity.destruct()`   | Destroy entity        |
| `entity.is_alive()`   | Check entity validity |
| `entity.id()`         | Get entity identifier |
| `entity.set<T>()`     | Add component to entity  |
| `entity.set<T>()`     | Update entity's component |
| `entity.get<T>()`     | Get component from entity        |
| `entity.get_mut<T>()` | Get mutable component from entity|
| `entity.remove<T>()`  | Remove component from entity     |
| `entity.has<T>()`     | Check component from entity      |
| `world.system<T>()`   | Create system         |
| `world.prefab()`      | Create prefab         |
| `world.query<T>()`    | Create query          |
| `query.each()`        | Iterate query results (all) |
| `query.find()`        | Iterate query results (not all) |

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

