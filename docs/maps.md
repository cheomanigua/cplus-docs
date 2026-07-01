# Maps (unordered)

## Map creation

There are two ways to create a map:

```cpp
#include <unordered_map>
#include <string>

std::unordered_map<std::string, int> attributes = {
    {"strength", 7},
    {"intelligence", 8},
    {"dexterity", 5}
};

```

or

```cpp
std::unordered_map<std::string, int> attributes;
attributes["strength"] = 7;
attributes.insert({"intelligence", 8});
attributes.insert({"dexterity", 5});

```

## New Entry

```cpp
attributes["endurance"] = 10;

```

## Entry Update

```cpp
// Direct update
attributes["endurance"] = 8;                    // endurance == 8

// Update via variable
int endurance = attributes["endurance"];
endurance += 4;
attributes["endurance"] = endurance;            // endurance == 12

```

## Example

```cpp
#include <iostream>
#include <unordered_map>
#include <string>

// Assuming a context similar to Godot's C++ bindings
class Player : public RigidBody2D {
    // Declare a new map
    std::unordered_map<std::string, int> attributes;

public:
    void _Ready() {
        // Define a declared map
        attributes = {
            {"strength", 7},
            {"intelligence", 8},
            {"dexterity", 5}
        };

        // Add new entry
        attributes["endurance"] = 6;

        // Update an entry
        attributes["strength"] = 8;

        // Update an entry
        int strength = attributes["strength"];
        strength += 2;
        attributes["strength"] = strength;

        // Check if element "strength" is in the map
        if (attributes.count("strength"))
        {
            std::cout << "Strength is present." << std::endl;
        }

        // Map iteration
        for (const auto& [key, value] : attributes)
        {
            std::cout << key << ": " << value << std::endl;
        }

        // Iterating only keys
        for (const auto& [key, value] : attributes)
        {
            std::cout << key << std::endl;
        }

        // Iterating only values
        for (const auto& [key, value] : attributes)
        {
            std::cout << value << std::endl;
        }
    }
};

```

## Object vs Variant

##### Object (`std::unordered_map<std::string, std::any>`)

```cpp
#include <any>
#include <unordered_map>
#include <string>

std::unordered_map<std::string, std::any> city = {
    {"name", std::string("Uruk")},
    {"population", 3000},
    {"growth_rate", 2.5f}
};

```

It is better for most scenarios because of performance, simplicity and flexibility.

* **Performance**: Standard C++ map lookups are generally highly optimized for this use case.
* **Simplicity**: No custom conversion logic required for standard types.
* **Flexibility**: Works seamlessly in C++ and can be stored in variants if using Godot's `Variant` type.

##### Variant (`std::unordered_map<std::string, Variant>`)

```cpp
#include <unordered_map>
#include <string>
#include <godot_cpp/variant/variant.hpp>

std::unordered_map<std::string, Variant> city = {
    {"name", "Uruk"},
    {"population", 3000},
    {"growth_rate", 2.5f}
};

```

It is better only if:

* You frequently pass the map to Godot’s API (e.g., `Node::set`, `Node::call`) and want to avoid conversion overhead.
* You’re comfortable with Godot’s `JSON` class for deserialization.
* The implicit conversion of C++ types to `Variant` is preferred in your environment.

## JSON

JSON file: [creatures.json](https://drive.google.com/file/d/1pqJw1z3rW2_9pZzKRPQUmhrX_wpwNScq/view)

##### Object (`std::unordered_map<std::string, std::unordered_map<std::string, std::any>>`)

*(Note: Requires a JSON library like nlohmann/json or similar as C++ does not have a native JSON parser in the standard library.)*

```cpp
// Using nlohmann/json as an example
auto j = nlohmann::json::parse(jsonString);
std::unordered_map<std::string, std::unordered_map<std::string, int>> creatures = j.get<std::unordered_map<std::string, std::unordered_map<std::string, int>>>();

```

> **Warning**: While the code loaded the JSON into a map, using `std::any` or `variant` in C++ can get messy quickly. You have to constantly cast things, which leads to bugs. Since you are using C++ in Godot, the most powerful and clean way to handle NPC stats is to map your JSON directly to a C++ Struct.

##### Struct (`std::unordered_map<std::string, NpcStats>`)

```cpp
struct NpcStats {
    std::string RaceName;
    int Strength;
    int Dexterity;
    int Endurance;
    int Intelligence;
    int Health;
};

// Deserialization mapping handled by JSON library
std::unordered_map<std::string, NpcStats> creatures = j.get<std::unordered_map<std::string, NpcStats>>();

```

## Iteration and access

Given the deserialized data (Object version or Struct version), we can iterate and access particular keys and values:

*(Note: C++ does not have built-in tabs, so the logic is presented linearly.)*

#### Object approach iteration

```cpp
// Accessing goblin strength
int strength = std::any_cast<int>(creatures["goblin"]["strength"]);

```

#### Struct approach iteration

```cpp
// Accessing goblin strength directly
int strength = creatures["goblin"].Strength;

```

## Search particular element

If we want to find out if a particular element is inside a map, use `count()` or `find()`.

#### One dimensional map

```cpp
std::unordered_map<std::string, int> inventory = {
    {"Silver", 23},
    {"Gold", 56},
    {"Ruby", 8}
};

// Option 1. Faster if only checking existence
if (inventory.count("Gold"))
{
    std::cout << "There is gold!!" << std::endl;
}

// Option 2. Faster if quantity is required
auto it = inventory.find("Gold");
if (it != inventory.end())
{
    std::cout << "Gold is found with quantity " << it->second << "." << std::endl;
}

```

## Map vs Struct

* Use a **Map** only if your players can dynamically gain completely unpredictable, random modifications during runtime that you cannot plan for.
* Use a **Struct** for core player stats. It makes your code faster, provides compile-time checks, and naturally interfaces with Godot features.

| Feature | `std::unordered_map<std::string, int>` | Strongly Typed Struct | Winner |
| --- | --- | --- | --- |
| **Data Memory** | Spread across a node-based tree. | Compact, contiguous block of memory. | **Struct** |
| **Access Speed** | $O(\log n)$ (Tree traversal). | $O(1)$ (Direct memory offset). | **Struct** |
| **Typo Protection** | None. `attributes["strenth"]` causes runtime logical errors. | Total. `attributes.Strenth` results in compile error. | **Struct** |
| **Autocomplete** | No. | Yes. | **Struct** |

## Dictionaries Use Cases

Dictionaries/Maps make sense when your game data is **unpredictable, dynamic, or structural chaos is a feature**.

#### 1. When Storing Dynamic Status Effects

```cpp
std::unordered_map<std::string, int> activeStatuses = {
    {"Poisoned", 3},
    {"Frozen", 1}
};

activeStatuses.erase("Poisoned");

```

#### 2. When Handling City Inventories

```cpp
std::unordered_map<std::string, int> cityMarketStock = {
    {"Wheat", 500},
    {"Iron Ore", 12}
};

cityMarketStock["Dragon Scales"] = 1;

```

## Hybrid approach (Map + Struct)

* Use **Structs** for the rigid skeleton (permanent and universal).
* Use **Maps** for the fluid flesh (inventories, status effects, moddable elements).

```cpp
struct NpcStats {
    std::string RaceName;
    int Strength;
    int Dexterity;
    // ...
    std::unordered_map<std::string, std::any> DynamicTraits;
};

// Usage
orc.DynamicTraits["WeaponType"] = std::string("Greataxe");

if (orc.DynamicTraits.count("IsEnraged")) {
    bool enraged = std::any_cast<bool>(orc.DynamicTraits["IsEnraged"]);
}

```

## Map vs Unordered Map

In almost every scenario involving gameplay data—such as NPC attributes, inventory systems, or quest logs—you should prefer `std::unordered_map` over `std::map`.

Because game development relies on fast, repetitive access, the architectural differences between these two are significant:

### Why `std::unordered_map` Wins for Games

* **Access Speed**: `std::unordered_map` provides average $O(1)$ time complexity for lookups, whereas `std::map` provides $O(\log n)$. As your collection of items or stats grows, the performance difference becomes more pronounced.
* **Hash Table Efficiency**: `std::unordered_map` uses a hash table, which is the direct C++ equivalent to the C# `Dictionary` mentioned in the original documentation.
* **Lack of Overhead**: Unless you specifically require the keys to be stored in a sorted order (e.g., displaying a scoreboard or a sorted list of names), the overhead of maintaining the binary search tree structure in `std::map` is wasted CPU time.

### When to Stick with `std::map`

While `std::unordered_map` is the general winner for performance, you should only reach for `std::map` if:

* **Sorted Iteration**: You need to traverse the data in a specific order (like alphabetical order for a UI list).
* **Range Queries**: You need to efficiently find keys within a specific range (e.g., "give me all items with an ID between 100 and 200").

### Strategic Implementation

If you decide to refactor your code to use `std::unordered_map`, the transition is usually seamless because the API is nearly identical. However, you must include the correct header:

```cpp
#include <unordered_map>

// Replace: std::map<std::string, int> attributes;
// With:
std::unordered_map<std::string, int> attributes;

```

By making this switch, you align your C++ architecture with the performance expectations of modern game engines.

## C# vs C++

While the structure of C++ maps mirrors the logic of C# dictionaries, there are several nuances inherent to C++ that change how you interact with them in a professional game development environment.

Here is what you should specifically keep in mind when using `std::map` (and its alternatives) in C++:

### 1. `std::map` vs. `std::unordered_map`

In C#, `Dictionary` is implemented as a hash table. In C++, the default `std::map` is implemented as a **Balanced Binary Search Tree** (usually a Red-Black Tree).

* **`std::map`**: Keeps elements sorted by key. Lookups are $O(\log n)$. This is useful if you need to iterate through your map in alphabetical or numerical order.
* **`std::unordered_map`**: This is the C++ equivalent of a C# `Dictionary` (hash table). Lookups are $O(1)$ on average. **Always prefer `unordered_map**` for game systems like inventories or status effects unless you specifically need the keys to be sorted.

### 2. Memory Ownership and `std::shared_ptr`

Unlike C#, C++ does not have a Garbage Collector. If you store objects in a map, you must manage their lifetime. If your map stores pointers, the map does not automatically delete the object when you call `erase()`.

* **Best Practice**: Use `std::shared_ptr` or `std::unique_ptr` as your value type.
```cpp
std::unordered_map<std::string, std::shared_ptr<PlayerAttributes>> playerRegistry;

```


This ensures that when you remove an entry from the map, the memory is cleaned up properly, preventing memory leaks.

### 3. The `[]` Operator Pitfall

In C++, the `[]` operator in `std::map` and `std::unordered_map` is **not const-safe**. If you use `map["missing_key"]` and the key does not exist, C++ will automatically insert a new, default-constructed element into the map for you.

* **Safety Tip**: If you only want to *read* a value and prevent accidental insertions, always use `.at()` or `.find()`.
```cpp
// This will throw an exception if "Gold" is missing, rather than inserting it
int gold = inventory.at("Gold"); 

```

### 4. Custom Key Types

C# dictionaries are flexible with keys. In C++, if you want to use a custom struct (e.g., `struct ItemID`) as a key in an `unordered_map`, you **must** define a custom hash function for that struct.

If you use a custom struct with a standard `std::map`, you must overload the `<` operator so the map knows how to sort your custom objects.

### 5. Performance and Data Locality

Because `std::map` is a node-based structure, the elements are scattered throughout memory. This leads to "cache misses" which can slow down performance in high-frequency game loops (like an AI combat loop).

* **Pro Tip**: If you have a fixed set of attributes (like Strength, Intel, Dex), avoid maps entirely in favor of a `struct`. If you use a map, prefer `std::vector<std::pair<K, V>>` for small lists (under 10-20 items), as iterating through a contiguous vector is significantly faster than traversing a map/tree.

Would you like to see how to implement a custom hash function for a complex game object key in C++?
