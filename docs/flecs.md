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

Compile `flecs.c` into `flecs.o`. This only needs to be done once per project:

```bash
gcc -std=gnu99 -c flecs.c -o flecs.o
```

You can delete `flecs.c` after this if you don't need to rebuild Flecs. Keep `flecs.h` because your C++ source files need it when compiling.

So, in every Flecs project, you must have these two files: `flecs.h` and `flecs.o`.

## 3. Compile and build

Run these commands every time you edit `main.cpp`:

```bash
g++ -std=c++23 -c main.cpp -o main.o
g++ main.o flecs.o -lpthread -lm -o myapp
```
If you are also using **Raylib** or **SDL3**, run these commands instead:

```bash
g++ -std=c++23 -c main.cpp -o main.o

# If using Raylib
g++ main.o flecs.o $(pkg-config --libs raylib) -lpthread -lm -o myapp

# If using SDL3
g++ main.o flecs.o $(pkg-config --libs sdl3) -lpthread -lm -o myapp
```


## 4. Run the executable

```bash
./myapp
```

# API

[!NOTE] <strong>NOTE</strong>
Below are the most common APIs used in <strong>Flecs</strong>. For a full example, go to the <a href="#flecs#example">Example</a> section of this page.

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

## 3. Reset the world

Remove all entities and all components from the world:

```cpp
world.reset();
```

## 4. Create an entity

You can create entities with or without storing an entity handle.

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

Entity names are useful for identification and lookup, whereas handles are generally more convenient for normal application logic.

### With handle

```cpp
flecs::entity entity = world.entity();
or
auto entity = world.entity();
```

Creating an entity with a handle is useful if we plan to process that specific entity in a special way.

You can create different entities reassigning the same handle. Each call to `world.entity()` creates a new entity. The variable `enemy` simply starts referring to the newest entity.

The previous entities still exist in the world, but you no longer have their handles stored in that variable:

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

## 5. Get the entity ID

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

## 6. Destroy an entity

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

## 7. Check entity status

Use `is_alive()`:

```cpp
if (entity.is_alive())
{
    // entity still exists
}
```

This becomes useful when dealing with entities whose lifetime isn't guaranteed.


## 8. Add a component

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

## 9. Update a component

In Flecs, `set` can be used to add or replace a component value:

```cpp
enemy.set<Health>({50});
```

You can also modify an existing component:

```cpp
auto* health = enemy.get_mut<Health>();

health->value = 50;
```

## 10. Get a component

If you already know an entity has a component, you can use `get` when you don't need to modify the component:

```cpp
const auto& pos = player.get<Position>();

std::println("Position: {}, {}", pos.x, pos.y);
```
For systems and queries, however, you will usually access multiple components directly through the [query callback](#flecs#13.-create-a-query).

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

## 11. Check a component

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

## 12. Remove a component

Remove a component from one entity.

```cpp
player.remove<Velocity>();
```

## 13. Clear a component

Remove a component from all entities in the world.

```cpp
world.remove_all<TagSelected>()
```

## 14. Create a tag

A component doesn't need to contain data.

For example:

```cpp
struct Player {};
struct Enemy {};
struct Selected {};
struct Dead {};
```

You can use these as **tags**:

```cpp
ent1.add<Selected>();
ent2.add<Enemy>();
```

Then:

```cpp
auto query = world.query<Selected>();

query.each([](flecs::entity entity)
{
    // entity has the Selected tag. You can now move it or do something
});
```

This is extremely common in ECS. You don't need a `bool selected` inside another component.

## 15. Remove a tag

Tags use the same `remove` API:

```cpp
entity.remove<Selected>();
```

## 16. Remove vs Reset vs Destruct

| Code                               | Effect                                     |
| ---------------------------------- | ------------------------------------------ |
| `entity.remove<TagSelected>()`     | Remove `TagSelected` from **one entity**   |
| `world.remove_all<TagSelected>()`  | Remove `TagSelected` from **all entities** |
| `entity.destruct()`                | Destroy **one entity and its components**  |
| `world.reset()`                    | Reset **the entire world**                 |



## 17. Create a query

This is one of the most important parts of Flecs.

You can create a query that finds all entities with a particular component. However, we must differentiate between a one time query versus a repeated query.

### One time query

For a one-time operation, we can create a quick query.

```cpp
auto query = world.query<Position>();
```

### Repeated query

We create and cache the query beforehand. We can then use it whenever we need it. This is cheap and efficient.

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

### Summary

- Uncached queries are useful for ad-hoc queries that don't need to be reused frequently.
- Cached queries can improve performance when queries are evaluated repeatedly.
- Systems manage their own queries, so you generally don't need to manually create a query for a system.

### Multiple components

You can query more than one component:

```cpp
auto query = world.query<Position, Velocity>();
query.each([](Position& pos, const Velocity& vel)
{
    pos.x += vel.x;
    pos.y += vel.y;
});
```

Now you're saying:

> Give me entities that have **both** `Position` AND `Velocity`.

### `.each` vs `.find`

- `.each` processes every matching entity.
- `.find` stops at the first entity for which the callback returns `true`.

```cpp
// Process every matching entity
query.each([](Position& pos, const Velocity& vel)
{
    pos.x += vel.x;
    pos.y += vel.y;
});

// Stop at the first matching entity with pos.x > 100.0f
auto entity = query.find([](Position& pos, Velocity& vel)
{
    return pos.x > 100.0f;
});
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

## 18. Create a system

You can create systems directly with Flecs. A Flecs system is not simply a C++ function. It is a registered ECS operation with a query.

In this example, we create a movement system. It will iterate through all entities having Position and Velocity components and calculate their positions:

```cpp
const float deltaTime {1.0f/60.f};
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

- `Position` means the system needs mutable access to Position.
- `const Velocity` means it needs read-only access to Velocity.
- Flecs automatically finds entities matching those component requirements.
- `.each()` executes the callback for each matching entity.
- The `&` captures variables from the surrounding C++ scope by reference.
- `world.progress(deltaTime)` runs systems through the pipeline.


[!TIP]
<strong>TIP</strong>
The lambda captures <code>deltaTime</code> by reference because of <code>&</code> in <code>.each([&]</code>. Any variable not local to <code>world.system</code> can be captured by the lambda by using <code>&</code>, regardless of how many variables you want to pass.
If you want to pass by value, use <code>=</code>, or with the actual name of the variable or variables: `[deltaTime]`/

### Handle

If you gave a system a handle, you could manually run that particular system:

```cpp
flecs::system mov = world.system<Position, const Velocity>("Movement")
    .each([&](Position& p, const Velocity& v) {
    // ...

mov.run(); // ADD THIS LINE LATER ON
```

However, if the main pipeline (`world.progress()`) is being called somewhere, the mov system will run again in addition to `mov.run()`.

To prevent this duplicate call, you have to exclude your mov system from being called by the main pipeline. For that, you have to add `.kind(0)` in your construct:

```cpp
flecs::system mov = world.system<Position, const Velocity>("Movement")
    .kind(0) // ADD THIS LINE
    .each([&](Position& p, const Velocity& v) {
    // ...
```
Now, mov system will be ignored by `world.progress()`.

### Example

```cpp
world.system<>("System1")
    .each([]() {
        std::cout << "System 1\n";
    });

auto sys2 = world.system<>("System2")
    .each([]() {
        std::cout << "System 2\n";
    });

auto sys3 = world.system<>("System3")
    .kind(0)
    .each([]() {
        std::cout << "System 3\n";
    });


/// Inside game loop
world.progress();
sys2.run():
sys3.run();
```

Output:

```text
System1
System2
System2
System3
```

## 19. Query vs System

- A query lets you manually iterate over matching entities whenever you want.
- A system registers that iteration with Flecs so it can be executed by the ECS pipeline.

```cpp
// Query
auto query = world.query<Position, Velocity>();

query.each([](Position& pos, Velocity& vel)
{
    pos.x += vel.x;
});

// System
world.system<Position, Velocity>()
    .each([](Position& pos, Velocity& vel)
    {
        pos.x += vel.x;
    });
```

## 20. Create a prefab

A prefab is a template used to create entities (instances). It defines default component values that are used when instances are created.

An important distinction in Flecs 4 is that **components are copied from a prefab to its instances by default**. This means that an instance normally owns its own copy of the component rather than inheriting it dynamically.

Consequently, changing a component on the prefab after an instance has been created does not automatically change the corresponding component on that instance.

### Version 1a — Explicit instance value


```cpp
auto surfaceShip = world.prefab("SurfaceShip")
    .set<Fuel>({5000.0});

auto destroyer = world.entity("Destroyer1")
    .is_a(surfaceShip)
    .set<Fuel>({4000.0});
```

- Initial destroyer fuel: 4000.
- The destroyer owns its own `Fuel` component because `.set<Fuel>()` is called on the instance.
- Changing the prefab's fuel to 3000 does not change the destroyer's fuel. It remains 4000.

### Version 1b — Default prefab instantiation


```cpp
auto surfaceShip = world.prefab("SurfaceShip")
    .set<Fuel>({5000.0});

auto destroyer = world.entity("Destroyer1")
    .is_a(surfaceShip);
```

- Initial destroyer fuel: 5000.
- The destroyer owns its own `Fuel` component because Flecs 4 copies components from prefabs to instances by default.
- The destroyer's initial `Fuel` value is copied from the prefab.
- Changing the prefab's fuel to 3000 does not change the destroyer's fuel. It remains 5000.

**Important:** Even without explicitly calling `.set<Fuel>()` on the instance, the instance receives its own copy of `Fuel`.

### Summary Table

Assume the prefab's `Fuel` component is changed at runtime from 5000 to 3000, after the destroyer has been created.

| Version | Destroyer owns `Fuel`? | Initial fuel | Fuel after prefab changes to 3000 |
| --- | --- | --- | --- |
| 1a | Yes (explicit `.set()`) | 4000 | 4000 |
| 1b | Yes (default instantiation copy) | 5000 | 5000 |

### Conclusion

- **Version 1a:** The destroyer owns its own `Fuel` component, explicitly initialized to 4000. Subsequent changes to the prefab do not affect it.
- **Version 1b:** Flecs 4 copies the prefab's component to the instance by default. The destroyer therefore owns its own copy, initialized to 5000. Subsequent changes to the prefab do not affect it.

**The practical rule:** In Flecs 4, prefab components are copied to instances by default. An instance therefore owns its own component, even when no explicit `.set()` is called on it. Changing the prefab's component afterward does not change the instance's copy.

### Multiple "inheritance" levels

An entiy can have its componets copied from multiple inheritance levels:

```cpp
// Create prefabs
flecs::entity surfaceShip = world.prefab("SurfaceShip")
    .set(Speed{50});

flecs::entity frigate = world.prefab("Frigate")
    .is_a(surfaceShip)
    .set(Attack{30})

// Create entity
world.entity("Viper")
    .is_a(frigate) // Speed 50, Attack 30
```

### Enabling component inheritance

If you want instances to inherit a component from a prefab instead of receiving their own copies, you can change the component's `OnInstantiate` policy to `flecs::Inherit`.

For example:

```cpp
world.component<Fuel>()
    .add(flecs::OnInstantiate, flecs::Inherit);
```

This configuration must be applied before creating the prefab instances. Full example:


```cpp
world.component<Fuel>()
    .add(flecs::OnInstantiate, flecs::Inherit);

auto surface_ship = world.prefab("SurfaceShip")
.set<Fuel>({5000.0f});

auto destroyer = world.prefab("Destroyer")
    .is_a(surface_ship)
    .set(Speed{50.0f});

auto des1 = world.entity("Destroyer_1")
    .is_a(destroyer);
auto des2 = world.entity("Destroyer_2")
    .is_a(destroyer)
    .set(Speed{60.0f});

std::cout << "Instance type: " << des1.type().str() << "\n";
std::cout << "Destroyer_1: fuel " << des1.get<Fuel>().value << "\n";
std::cout << "Destroyer_2: fuel " << des2.get<Fuel>().value << "\n";

surface_ship.set(Fuel{8000.0f});

std::cout << "\n" << "After setting prefab fuel to 8000:" << "\n";
world.each([](flecs::entity e, const Fuel& f, const Speed& s) {
    std::cout << e.name()
    << ": fuel " << f.value
    << ", speed " << s.value << "\n";
})
```

Expected output:

```text
Instance type: Speed, (Identifier,Name), (IsA,Destroyer)
Destroyer_1: fuel 5000
Destroyer_2: fuel 5000

After setting prefab fuel to 8000:
Destroyer_1: fuel 8000, speed 50
Destroyer_2: fuel 8000, speed 60
```

In this case:

- The destroyers do not own their own `Fuel` component.
- `destroyers.get<Fuel>()` retrieve the component from the prefab through inheritance.
- Changing the prefab's `Fuel` value is reflected when accessing the inherited component through the destroyers.

If you later want a particular instance to own its own copy despite this inheritance policy, you can use `set_auto_override()` on the prefab.

If we disable the `Fuel` component inheritance by removing `world.component<Fuel>()` line from the previous example, the output will be:

```text
Instance type: Fuel, Speed, (Identifier,Name), (IsA,Destroyer)
Destroyer_1: fuel 5000
Destroyer_2: fuel 5000

After setting prefab fuel to 8000:
Destroyer_1: fuel 5000, speed 50
Destroyer_2: fuel 5000, speed 60
```

- The destroyers own their own `Fuel` component. You can see the `Fuel` component in the first line of the output.
- `destroyers.get<Fuel>()` retrieve the component from the instance through inheritance.
- Changing the prefab's `Fuel` value is not reflected when accessing the inherited component through the destroyers.

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
    const float dt {1.0f / 60.0f};
    auto posQ = world.query_builder<const Position>().cached().build();

	// Create a system. Flecs manages its query and execution
	world.system<Position, const Velocity>("Movement")
        .each([&](Position& pos, const Velocity& vel) {
            pos.x += vel.x * dt;
            pos.y += vel.y * dt;
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

## Basic Flecs API

| API                   | Purpose               |
| --------------------- | --------------------- |
| `flecs::world world`  | World: Create ECS container         |
| `world.reset()`       | World: Reset ECS container         |
| `world.entity()`      | Entity: Create entity         |
| `entity.destruct()`   | Entity: Destroy entity        |
| `entity.is_alive()`   | Entity: Check entity validity |
| `entity.id()`         | Entity: Get entity identifier |
| `entity.set<T>()`     | Component: Add component to entity  |
| `entity.set<T>()`     | Component: Update entity's component |
| `entity.get<T>()`     | Component: Get component from entity        |
| `entity.get_mut<T>()` | Component: Get mutable component from entity|
| `entity.remove<T>()`  | Component: Remove component from entity     |
| `entity.has<T>()`     | Component: Check component from entity      |
| `entity.add<T>()`     | Tag: Add tag to entity  |
| `entity.remove<T>()`  | Tag: Remove tag from entity     |
| `world.query<T>()`    | Query: Create query          |
| `query.each()`        | Query: Iterate query results (all) |
| `query.find()`        | Query: Iterate query results (not all) |
| `world.system<T>()`   | System: Create system         |
| `world.prefab()`      | Prefab: Create prefab         |

### Clarification

There is an important difference between checking one entity and querying many entities:

| API                | What it does                                       | Scope         |
| ------------------ | -------------------------------------------------- | ------------- |
| `entity.has<T>()`  | Checks whether **one specific entity** has `T`     | One entity    |
| `world.query<T>()` | Creates a **query** for entities that have `T`     | Many entities |
| `query.each()`     | **Iterates** through **ALL** entities matched by the query | Many entities |
| `query.find()`     | **Iterates** through entities matched by the query until the first one satisfying a particular condition | Many entities |

### `has`

*"Does this entity have `Position`?"*

```cpp
entity.has<Position>()
```

*"Does this entity have `Position` AND `Velocity`?"*
For multiple components:

```cpp
entity.has<Position, Velocity>()
```

### `query`

*"Which entities have `Position` AND `Velocity`?"*

```cpp
auto query = world.query<Position, Velocity>();
```

### `query.each`

*"Give me each matching entity and its components so I can process them."*

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

*"Search the matching entities and return the first one that satisfies my condition."*

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

The important concept is that **`find`** is a **search**, not a general iteration mechanism. The callback's return value determines whether the current entity is the one you're looking for.


