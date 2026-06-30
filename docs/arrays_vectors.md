# Arrays and Vectors

In C++, **arrays** and **vectors** are both used to store collections of items, but they have key differences in terms of flexibility, performance, and use cases. Here's a concise comparison:

## Array (`std::array` and Raw Arrays)

* **Definition**: A fixed-size collection of elements of the same type. C++ provides both C-style raw arrays (`T[]`) and the modern `std::array<T, N>` container.
* **Key Characteristics**:
* **Fixed Size**: Size is defined at compile-time and cannot be changed. Use `std::vector` for dynamic sizing.
* **Performance**: Extremely fast; no dynamic allocation overhead. `std::array` provides the performance of a raw array with the safety of a container.
* **Memory**: Highly memory-efficient as they are stored on the stack (usually) or directly within the containing object.
* **Type Safety**: Strongly typed; elements must be of the declared type.
* **Usage**: Use when the size is known at compile-time and performance is critical.
* Raw arrays decay into pointers, which can be error-prone. `std::array` is preferred in modern C++.



### Declaring and Initializing Arrays

```cpp
#include <array>

// C-style array (fixed size)
int numbers[3] = {1, 2, 3};

// std::array (modern C++)
std::array<int, 3> modernNumbers = {1, 2, 3};

// Accessing elements
numbers[0] = 10;
modernNumbers.at(0) = 10; // .at() provides bounds checking

```

---

## Vector (`std::vector<T>`)

* **Definition**: A dynamic, resizable sequence container implemented as a dynamic array.
* **Key Characteristics**:
* **Dynamic Size**: Can grow or shrink automatically as needed using methods like `push_back`, `pop_back`, or `clear`.
* **Performance**: Very efficient for adding/removing items at the end. Random access is O(1).
* **Memory**: Manages memory on the heap. It may reallocate its internal buffer when it grows, which can be an expensive operation.
* **Type Safety**: Strongly typed; part of the Standard Template Library (STL).
* **Usage**: The default choice for dynamic collections.



### Key Features of `std::vector<T>`

* **Dynamic Size**: Automatically handles resizing and memory management.
* **Common Methods**:
* `push_back(T item)`: Adds an item to the end.
* `pop_back()`: Removes the last item.
* `insert()` / `erase()`: Insert or remove items at specific positions.
* `clear()`: Removes all items.
* `size()`: Gets the current number of elements.
* `capacity()`: Gets the number of elements the vector can hold before needing a reallocation.



### Example Usage

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <algorithm> // Required for std::sort

int main() {
    std::vector<int> numbers = {10, 20, 30};

    // Add elements
    numbers.push_back(40);

    // Access elements
    std::cout << "First: " << numbers[0] << std::endl;

    // Remove last element
    numbers.pop_back();

    // Remove the value 20
    numbers.erase(std::remove(numbers.begin(), numbers.end(), 20), numbers.end());

    // Iterate
    for (int num : numbers) {
        std::cout << num << " ";
    }

    // Sort
    std::sort(numbers.begin(), numbers.end());


    // Strings
    // Declare and initialize the vector
    std::vector<std::string> sumer = {"Ur", "Uruk", "Adab", "Kish", "Lagash", "Larsa", "Umma"};

    // Sort the vector using the begin and end iterators
    std::sort(sumer.begin(), sumer.end());

    // Iterate and print
    for (const std::string& city : sumer) {
        std::cout << city << std::endl;
    }
    
    return 0;
}

```

---

## Differences between Arrays and Vectors

| Feature | Array (`std::array<T, N>`) | Vector (`std::vector<T>`) |
| --- | --- | --- |
| **Size** | Fixed at compile-time | Dynamic, can grow/shrink |
| **Performance** | Maximum speed (stack-allocated) | Fast, but reallocation overhead |
| **Memory** | Efficient (no dynamic allocation) | Heap allocation with growth overhead |
| **Functionality** | Limited (basic indexing) | Rich methods (`push_back`, `erase`, etc.) |
| **Declaration** | `std::array<int, 5> arr;` | `std::vector<int> vec;` |
| **Header** | `#include <array>` | `#include <vector>` |

### When to Use

* **Array**: Use when the number of elements is fixed at compile-time and you want to ensure minimal memory and execution overhead.
* **Vector**: Use as the default choice for most collections in C++ where the size might change or is not known until runtime.

### Conversion / Interop

* To get a pointer to the start of a vector (to interface with C-style APIs): `int* ptr = vec.data();`
* You cannot "convert" a `std::array` to a `std::vector` automatically; you must copy the elements into a new vector constructor: `std::vector<int> v(arr.begin(), arr.end());`

## Performance

Using fixed-size arrays instead of `std::vector` can indeed improve performance, but it comes with specific trade-offs regarding memory and safety.

### The Performance Reality

* **Contiguity**: `std::vector` *is* a flat array in memory. When you access `vector[i]`, you are accessing a contiguous memory block just like a standard array `array[i]`. The performance difference in memory access is negligible.
* **Vector Overhead**: `std::vector` has a tiny overhead (three pointers: begin, end, capacity). It performs a heap allocation on creation. A static array allocates memory on the stack (or data segment) and has zero allocation overhead.
* **The Benefit of Fixed Size**: Because your limits are known (`1024`), you can eliminate heap allocations entirely by using `std::array<T, MaxEntities>`. This improves **cache locality** and removes the risk of dynamic resizing (which causes "reallocations," the most expensive part of a `std::vector`).

### Implementing Fixed-Size Arrays (The Data-Oriented Way)

To match the high-performance architecture described in your documents (like SoA—Structure of Arrays), you would move away from a vector of objects to static arrays for your components.

**Instead of:**

```cpp
std::vector<EntityStats> stats; // Potentially on the heap, reallocates

```

**Use:**

```cpp
#include <array>
#include "Core/Constants.hpp"

// This sits on the stack or in the data segment (fixed memory footprint)
std::array<EntityStats, MaxEntities> stats; 

```

### Should you do it?

| Aspect | `std::vector` | `std::array` (Fixed) |
| --- | --- | --- |
| **Speed** | Very Fast | Faster (No heap allocation) |
| **Safety** | Prevents overflow (dynamic) | Fixed (Must manually check bounds) |
| **Memory** | Dynamic (Grows as needed) | Static (Always consumes full size) |
| **Usage** | Easiest to use | Best for performance-critical ECS loops |

### Recommendation

Since you have a predefined `MaxEntities = 1024`, using `std::array` is a excellent way to tighten your architecture. However, you must implement a "handle" system or an "active count" variable to keep track of how many of those 1024 slots are actually being used, otherwise, your loops will iterate over 1024 items even if only 2 NPCs exist.

Would you like to see how to implement a simple "Active List" or "Sparse Set" to track which of those 1024 array slots are currently in use?
