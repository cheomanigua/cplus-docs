# EnTT

## Download

```bash
wget https://raw.githubusercontent.com/skypjack/entt/refs/heads/main/single_include/entt/entt.hpp
```

## Basics

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
