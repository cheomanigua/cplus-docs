# Structs

## Definition

A `struct` in C++ is a user-defined type used to group related data members into a single unit, providing a highly efficient memory layout. Unlike classes, where members are private by default, members of a `struct` are public by default.

By default, a `struct` instance is allocated directly on the CPU stack or inline within its containing type, ensuring that its memory footprint is contiguous and its lifetime is strictly deterministic. This direct allocation eliminates pointer indirection and maximizes CPU cache efficiency by keeping data tightly packed. As a result, `structs` are the ideal choice for defining lightweight, performant data types (such as vectors, coordinates, or mathematical matrices) that are frequently created and destroyed within performance-critical execution loops.

```cpp
struct Point {
    float x;
    float y;
};

int main () {
	Point foo {1.0f, 2.0f}; // OK. Aggregate initialization, no constructor needed
	Point foo (1.0f, 2.0f); // ERROR. Constructor call, no constructor present in struct Point

	// C++20 and later
	Point foo (1.0f, 2.0f); // OK. Aggregate initialization, no constructor needed
	Point foo {1.0f, 2.0f}; // OK. Aggregate initialization, no constructor needed. Preferred.
}
```

### Constructor

In the example above, the constructor is not necessary because it is simply assigning values, which is equivalent to aggregate initialization.

Constructors become useful when you need to:

- Validate input.
- Compute derived values.
- Initialize const or reference members.
- Enforce invariants.
- Hide implementation details.

Example:

```cpp
struct Point {
    int x, y;

	// Constructor. In this case limits x to not be bigger than 5
    Point(int x, int y) : x(x > 5 ? 5 : x), y(y) {}
};

int main () {
	Point foo {8, 2}; // actual values of foo: 5, 2
}
```

### Value initialization

It is always preferred to value initializate the struct members:

```cpp
struct Point {
    float x{};
    float y{};
};
```

## Struct: Pass-by-Reference

In C++, you use **references** (`&`) or **pointers** (`*`) to pass the memory address of an object instead of copying it:

```cpp
// 'const & ' passes by reference (memory address), avoids copying the struct and ensures it is read-only.

// Calculates the Euclidean distance between two points.
float CalculateDistance(const Point& a, const Point& b) {
    int dx = a.x - b.x;
    int dy = a.y - b.y;
    
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

struct PositionComp {
    float x{};
    float y{};
};

struct SensorComp {
    float rangeSquared{};
    bool enabled{};

    SensorComp(float range, bool enabled)
        : rangeSquared(range * range), enabled(enabled) {}
};

// C++ equivalent of 'in': const reference (const &)
// Passes by memory address (efficient) and enforces read-only (safety)
bool IsWithinRadarRange(
        const PositionComp& sourcePos,
        const PositionComp& targetPos,
        const SensorComp& radar)
{
    if (!radar.enabled)
        return false;

    float deltaX = targetPos.x - sourcePos.x;
    float deltaY = targetPos.y - sourcePos.y;
    float distanceSquared = (deltaX * deltaX) + (deltaY * deltaY);

    std::cout << "Distance: " << distanceSquared 
              << ". Radar Range: " << radar.rangeSquared << "\n";

    return distanceSquared <= radar.rangeSquared;
}

int main() {
    // Stack allocation (standard behavior for structs in C++)
    PositionComp ussPasadenaPos {110.15f, 30.85f};
    PositionComp targetPos {160.14f, 31.15f};
    SensorComp passiveRadar(50.0f, true);

    bool detected = IsWithinRadarRange(ussPasadenaPos, targetPos, passiveRadar);

    std::cout << "Target Detected: " << (detected ? "True" : "False") << "\n";

    return 0;
}
```

### Key Mapping Notes for Your Transition:

* **Sequential Layout:** C++ `structs` are always sequential. The memory will always be `[x][y]` in that order. This makes them perfectly cache-friendly for arrays and CPU access.
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
