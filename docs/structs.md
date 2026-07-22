# Structs

## Definition

A `struct` in C++ is a user-defined type used to group related data members into a single unit, providing a highly efficient memory layout. Unlike classes, where members are private by default, members of a `struct` are public by default.

By default, a `struct` instance is allocated directly on the CPU stack or inline within its containing type, ensuring that its memory footprint is contiguous and its lifetime is strictly deterministic. This direct allocation eliminates pointer indirection and maximizes CPU cache efficiency by keeping data tightly packed. As a result, `structs` are the ideal choice for defining lightweight, performant data types—such as vectors, coordinates, or mathematical matrices—that are frequently created and destroyed within performance-critical execution loops.

```cpp
struct Point {
    int X;
    int Y;

    // Constructor to initialize members
    Point(int x, int y) : X(x), Y(y) {}
};

```


## Struct: Pass-by-Reference

In C++, you use **references** (`&`) or **pointers** (`*`) to pass the memory address of an object instead of copying it:

```cpp
// 'const & ' passes by reference (memory address), avoids copying the struct and ensures it is read-only.

// Calculates the Euclidean distance between two points.
float CalculateDistance(const Point& a, const Point& b) {
    int dx = a.X - b.X;
    int dy = a.Y - b.Y;
    
    // Highly efficient math directly on the memory, zero data copying.
    // std::sqrt and std::pow are efficient for standard distance calculation
    return std::sqrt(static_cast<float>(dx * dx + dy * dy));
}

```

### Key Technical Mapping

| Concept | C# Keyword | C++ Equivalent |
| --- | --- | --- |
| **Pass by Copy** | Default (Value type) | Pass by Value (`Type obj`) |
| **Pass by Ref** | `ref` | Pass by Reference (`Type& obj`) |
| **Read-Only Ref** | `in` | Pass by Const Reference (`const Type& obj`) |

### Why this is standard in C++

In C#, `ref` and `in` are specialized tools to bypass the default behavior of the language (which is to copy value types). In C++, however, **passing by `const &` is the idiomatic standard.** * **No Overhead:** When you pass `const PositionComp& pos`, the compiler generates code to pass a single memory address (typically 8 bytes on a 64-bit machine).

* **Safety:** The `const` qualifier explicitly tells the compiler that the function is prohibited from modifying the source object, providing the same "super safe" guarantee you noted in your C# documentation.
* **Flexibility:** Because this is the native way to pass objects in C++, it applies equally to small structs and large, complex classes, ensuring consistent performance throughout your codebase.

By using `const &` in your function signatures, you eliminate the cost of duplicating your struct data, ensuring your game logic remains performant even when handling large numbers of components.

#### A Complete Implementation

In C++, the behavior you are looking for (specifically sequential memory layout and efficient pass-by-reference) is the default way the language works. You do not need attributes like `[StructLayout]` because C++ guarantees that members defined in a `struct` are laid out in memory in the exact order they are declared.

Here is the native C++ implementation of your code:

```cpp
#include <iostream>

namespace SimulationEngine {

    struct PositionComp {
        float X;
        float Y;

        PositionComp(float x, float y) : X(x), Y(y) {}
    };

    struct SensorComp {
        float Range;
        float RangeSquared;
        bool IsEnabled;

        SensorComp(float range, bool isEnabled) 
            : Range(range), RangeSquared(range * range), IsEnabled(isEnabled) {}
    };

    class RadarSystem {
    public:
        // C++ equivalent of 'in': const reference (const &)
        // Passes by memory address (efficient) and enforces read-only (safety)
        static bool IsWithinRadarRange(const PositionComp& sourcePos, 
                                       const PositionComp& targetPos, 
                                       const SensorComp& radar) 
        {
            if (!radar.IsEnabled)
                return false;

            float deltaX = targetPos.X - sourcePos.X;
            float deltaY = targetPos.Y - sourcePos.Y;
            float distanceSquared = (deltaX * deltaX) + (deltaY * deltaY);

            std::cout << "Distance: " << distanceSquared 
                      << ". Radar Range: " << radar.RangeSquared << std::endl;

            return distanceSquared <= radar.RangeSquared;
        }
    };
}

int main() {
    using namespace SimulationEngine;

    // Stack allocation (standard behavior for structs in C++)
    PositionComp ussPasadenaPos(120.15f, 30.85f);
    PositionComp targetPos(170.14f, 31.15f);
    SensorComp passiveRadar(50.0f, true);

    bool detected = RadarSystem::IsWithinRadarRange(ussPasadenaPos, targetPos, passiveRadar);

    std::cout << "Target Detected: " << (detected ? "True" : "False") << std::endl;

    return 0;
}

```

### Key Mapping Notes for Your Transition:

* **Sequential Layout:** C++ `structs` are always sequential. The memory will always be `[X][Y]` in that order. This makes them perfectly cache-friendly for arrays and CPU access.
* **The `in` Keyword:** In C#, `in` was created to provide "read-only pointer" semantics for value types. In C++, `const Type&` is the exact tool used for this. It is the idiomatic way to pass data without copying, while guaranteeing the function cannot mutate the original data.
* **Instantiation:** Notice in `main()`, I didn't use `new`. In C++, `PositionComp ussPasadenaPos(...)` creates the object directly on the stack. There is no constructor overhead, no garbage collection, and it is automatically cleaned up when `main()` returns.

Does this implementation provide the performance and memory behavior you are aiming for?


## Memory Layout and Performance

In C++, structs are C# `LayoutKind::Sequential` equivalent by default. This means the compiler lays out the members in memory exactly in the order they are declared. This is highly efficient for CPU cache utilization because data is stored contiguously.

### Struct Layout

| Concept | C++ Implementation | Performance Impact |
| --- | --- | --- |
| **Default Layout** | Sequential | High (Cache friendly) |
| **Padding** | Compiler-managed | Alignment can cause gaps |
| **Access** | Direct memory access | Extremely fast |

## Controlling Layout

While C++ defaults to sequential layout, you can use the `alignas` specifier to ensure your data is aligned with CPU cache lines (e.g., 64 bytes), which is a common practice in high-performance engines to prevent "false sharing" or to optimize SIMD operations.

```cpp
struct alignas(16) Vector4 {
    float x, y, z, w;
};

```

## Passing Structs to Functions

To ensure high performance, avoid passing large structs by value, as this causes a full copy of the data on the stack. Instead, pass by `const` reference or by pointer.

### Comparison of Passing Methods

| Method | Syntax | Performance |
| --- | --- | --- |
| **Pass by Value** | `void Process(Point p)` | Low (Copying occurs) |
| **Pass by Reference** | `void Process(const Point& p)` | High (No copy, read-only) |
| **Pass by Pointer** | `void Process(const Point* p)` | High (No copy) |

## Data-Oriented Design (DOD)

Modern C++ game engines often utilize **Structure of Arrays (SoA)** rather than the traditional **Array of Structures (AoS)**. This minimizes cache misses when iterating over large datasets.

### Array of Structures (AoS) - Default

```cpp
struct Entity {
    float health;
    float mana;
};
std::array<Entity, 1024> entities;

```

### Structure of Arrays (SoA) - High Performance

```cpp
struct EntitySystem {
    std::array<float, 1024> healths;
    std::array<float, 1024> manas;
};

```

In the SoA example, when you need to update only the `healths` of all entities, the CPU only loads the `healths` array into the cache, ignoring the `manas` data. This drastically improves throughput when scaling to thousands of entities.
