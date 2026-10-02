# Flecs

## 1. Download Flecs distribution files

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

## 4. Example `main.cpp`

```cpp
#include <iostream>
#include "flecs.h"

struct Position {
    float x{}, y{};
};

void printPos(flecs::world& world)
{
    auto query = world.query<Position>();

    query.each([](flecs::entity entity, Position& pos) {
        std::cout << "Entity "
                  << entity.id() << ": "
                  << pos.x << ", "
                  << pos.y << "\n";
    });

    std::cout << "\n";
}

int main() {
    flecs::world world;

    for (std::size_t i = 0; i < 5; ++i) {
        auto entity = world.entity();

        entity.set<Position>({
            static_cast<float>(i),
            static_cast<float>(i)
        });
    }
    printPos(world);

    world.entity(520).destruct();
    printPos(world);

    auto entity = world.entity();
    entity.set<Position>({5.0f, 5.0f});

    printPos(world);
}
```

## 5. Run the executable

```bash
./myapp
```
