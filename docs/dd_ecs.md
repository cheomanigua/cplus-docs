# Data Driven ECS

You would seriously consider combining a JSON-driven type system with an ECS architecture, rather than creating C++ classes such as `Weapon`, `Character`, `Monster`, etc.

The key idea is:

JSON defines the entities and their components. ECS stores and processes them. C++ implements the reusable systems that operate on those components.

This means you can add new entity definitions without creating new C++ classes or recompiling your engine.

## 1. How the architecture works

Imagine this JSON definition:


```json
{
    "name": "Fire Dragon",
    "components": {
        "Transform": {
            "x": 10,
            "y": 20
        },
        "Health": {
            "current": 500,
            "maximum": 500
        },
        "Attack": {
            "damage": 80,
            "range": 5
        },
        "Movement": {
            "speed": 10
        }
    }
}
```

Your loader reads the JSON and creates an ECS entity.

JSON entity definition

Fire Dragon

JSON loader / component registry

ECS Entity #42

Transform

Health

Attack

Movement

ECS Systems

MovementSystem, CombatSystem, HealthSystem...

Notice something important: there is no `Dragon` C++ class.

The dragon is simply an entity with a particular combination of components.

## 2. The important part: dynamically defining components

Here is where Flecs becomes particularly interesting. Flecs supports runtime component registration. That means you don't necessarily need this:

```cpp
struct Health {
    float current;
    float maximum;
};

world.component<Health>();
```

You can instead register a component dynamically, specifying its size and alignment, and attach reflection metadata describing its members. Flecs exposes this through its runtime component registration API.

For example, your JSON could define:


```json
{
    "components": {
        "Health": {
            "fields": {
                "current": "float",
                "maximum": "float"
            }
        },
        "Mana": {
            "fields": {
                "current": "float",
                "maximum": "float"
            }
        },
        "Aggression": {
            "fields": {
                "value": "float"
            }
        }
    }
}
```

Your loader would:

1. Read each component definition.
2. Resolve field types (`float`, `int`, `string`, etc.).
3. Calculate the component's memory layout.
4. Register the component with Flecs.
5. Register its reflection metadata.
6. Create entities and populate their component values.

No individual C++ struct is necessary for these dynamically registered components.

There is one important limitation: you would use Flecs' untyped/runtime APIs to access them rather than ordinary C++ expressions such as `entity.get<Health>()`.

## 3. What about systems?

This is the most important architectural consideration.

Consider a conventional ECS system:

```cpp
void HealthSystem(flecs::iter& it)
{
    auto health = it.field<Health>(0);

    for (auto i : it)
    {
        health[i].current -= 10;
    }
}
```

This system needs `Health` to be a known C++ type.

But you can also build generic systems that work with runtime component IDs and reflected values.

For example, a generic property editor could:

- Find all entities.
- Inspect their component IDs.
- Retrieve component metadata.
- Enumerate their properties.
- Display editable fields automatically.

For game simulation, however, I would use a hybrid:

| Component category | Implementation |
| --- | --- |
| Transform | Native C++ component |
| Velocity | Native C++ component |
| Physics | Native C++ component |
| Health | Dynamic or native |
| WeaponStats | Dynamic |
| SpellDefinition | Dynamic |
| Custom editor properties | Dynamic |

Why? Because performance-critical systems benefit from statically typed components, while game definitions benefit from dynamic components.

## 4. How I would organize the complete engine

### Layer 1 — Engine components (C++)

Performance-critical

- Transform
- Velocity
- PhysicsBody
- Collision
- Renderable

### Layer 2 — Dynamic components (JSON)

Runtime-defined

- WeaponStats
- CharacterStats
- SpellDefinition
- MonsterAttributes
- QuestData
- CustomProperties

### Layer 3 — Behavior systems

Reusable logic

- MovementSystem
- CombatSystem
- SpellSystem
- InventorySystem
- AI System

The behavior systems can be implemented in C++, Lua, or a combination.

For example, you could define a completely new monster in JSON, attach dynamic components, and use existing combat and AI systems without adding a `Monster` C++ class.

## 5. Which ECS should you use?

My preference would be Flecs for this particular architecture.

| Capability | Flecs | EnTT |
| --- | --- | --- |
| Runtime component registration | Yes | More manual/custom |
| Reflection | Built-in facilities | More manual/custom |
| Dynamic component access | Yes | Possible with custom storage |
| JSON serialization | Built-in addon | Custom implementation |
| Query-based systems | Yes | Yes |
| Runtime-defined schemas | Very suitable | Requires more infrastructure |

Flecs also has its own JSON serialization and deserialization facilities, including reflected component values. You can use these instead of implementing every conversion yourself.

Documentation:

- [Flecs entities and components](https://www.flecs.dev/flecs/EntitiesComponents.html)
- [Flecs reflection](https://www.flecs.dev/flecs/examples-index.html#reflection)
- [Flecs JSON support](https://www.flecs.dev/flecs/examples-reflection-basics_json.html)

## 6. One last architectural distinction

There are actually two different things you might want to make dynamic:

- **Component definitions**: Create entirely new component types at runtime.
- **System definitions**: Create entirely new processing logic at runtime.

Flecs can help you with the first. For the second, you need an execution mechanism, such as Lua scripting or a custom behavior interpreter.

For your RPG/simulation engine, I'd aim for:

Flecs + nlohmann/json + Lua

- Flecs: entity/component storage and queries.
- nlohmann/json: load your game definitions.
- Flecs reflection: dynamically register component schemas.
- Lua: define new behaviors without recompiling C++.
- C++: implement performance-critical systems and reusable native operations.

This would give you a genuinely extensible engine where adding a new entity type, its properties, and even much of its behavior doesn't require changing or recompiling the C++ engine.
