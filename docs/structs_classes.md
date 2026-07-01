# Strucs vs Classes

## Comparison

Structs and classes are almost the same thing in C++. The only difference is the default access level for members and base classes: `struct` defaults to **public**, while `class` defaults to **private**. Given this code:

```cpp
#include <iostream>
#include <string>

class Car
{
public:
    std::string Brand;
    int PurchaseYear;
    Car(std::string brand, int purchaseYear) : Brand(brand), PurchaseYear(purchaseYear)
    {
        std::cout << "Car " << Brand << " built in " << PurchaseYear << "." << std::endl;
    }
};

struct Truck
{
    std::string Brand;
    int PurchaseYear;
    Truck(std::string brand, int purchaseYear) : Brand(brand), PurchaseYear(purchaseYear)
    {
        std::cout << "Truck " << Brand << " built in " << PurchaseYear << "." << std::endl;
    }
};

int main()
{
    Car toyota("Toyota", 2025);
    Truck ford("Ford", 2021);
    return 0;
}

```

> **Note**: In C++, both `struct` and `class` are user-defined types that can contain both data and methods. Unlike C#, where structs are value types and classes are reference types, in C++, both are generally treated as **value types** by default unless you explicitly use pointers or references.

What is the difference between a `struct` and a `class` in C++?

In C++, **classes** and **structs** are nearly identical, but they differ in default visibility. Here's a concise comparison:

### **Class**

* **Default Access**: Members and base classes are **private** by default.
* **Use Case**: Typically used for complex objects where you want to enforce encapsulation by keeping data private and providing public methods.
* **Example**:
```cpp
class Person {
    std::string name; // private by default
public:
    Person(std::string n) : name(n) {}
};

```



### **Struct**

* **Default Access**: Members and base classes are **public** by default.
* **Use Case**: Typically used for "Plain Old Data" (POD) structures or simple containers where you want easy access to members without writing getters/setters.
* **Example**:
```cpp
struct Point {
    int x; // public by default
    int y;
};

```



### **Key Differences**

| Feature | Class | Struct |
| --- | --- | --- |
| **Default Access** | Private | Public |
| **Inheritance** | Private inheritance by default | Public inheritance by default |
| **Usage Convention** | OOP, Encapsulation | Data structures, PODs |

### **When to Use**

* **Class**: Use when you need to enforce strict data hiding (encapsulation), complex internal state, or invariant checking.
* **Struct**: Use for simple data objects where data members are intended to be accessed directly and no complex invariants are required.

## Examples Comparison

### Example 1. Encapsulation
```cpp
#include <iostream>

struct SimpleData {
    int x; // Public
};

class EncapsulatedData {
    int x; // Private
public:
    void setX(int val) { x = val; }
    int getX() { return x; }
};

int main() {
    SimpleData s;
    s.x = 10; // Allowed

    EncapsulatedData e;
    // e.x = 10; // Error: x is private
    e.setX(10); // Allowed
}

```

### Example 2. Reference vs Value

To achieve the exact same behavior in C++ as your C# example, you must explicitly use memory management tools (pointers or smart pointers) for the "Reference type" equivalent, and standard value types for the "Value type" equivalent.

Here is the C++ code that replicates the logic and output of your C# snippet:

```cpp
#include <iostream>
#include <string>
#include <memory>

// --- Class equivalent (Reference semantics) ---
class Person {
public:
    std::string Name;
    int Age;
    Person(std::string name, int age) : Name(name), Age(age) {}
};

// --- Struct equivalent (Value semantics) ---
struct Point {
    int X, Y;
    Point(int x, int y) : X(x), Y(y) {}
};

int main() {
    // 1. Class: Reference type (using smart pointers to simulate C# reference behavior)
    // We use std::shared_ptr to manage memory and allow multiple references to one object.
    auto person1 = std::make_shared<Person>("Alice", 30);
    std::shared_ptr<Person> person2 = person1; // Reference to same object
    
    person2->Name = "Bob";
    std::cout << person1->Name << std::endl; // Outputs: Bob

    // 2. Struct: Value type
    Point point1(10, 20);
    Point point2 = point1; // Creates a copy
    
    point2.X = 50;
    std::cout << point1.X << std::endl;      // Outputs: 10

    return 0;
}

```

### Why this works:

* **Reference Semantics (`class`)**: In C#, a variable of a class type is essentially a reference to the heap. To mirror this in C++, `std::shared_ptr` provides that behavior. Assigning `person2 = person1` does not copy the `Person` object; it copies the pointer, meaning both variables point to the same memory location on the heap.
* **Value Semantics (`struct`)**: In C++, both `class` and `struct` default to value semantics. When you assign `point2 = point1`, the compiler performs a **member-wise copy**. `point2` is a physically distinct instance in memory with its own values, so modifying it has no impact on `point1`.



## Passing by Value vs. Passing by Reference

In C++, passing objects to functions can significantly impact performance, especially with large structures. By default, passing an object by **value** triggers a copy, which can be computationally expensive. Using **references** allows you to interact with the original object directly.

* **Passing by Value:** When you pass a `struct` or `class` by value, the compiler creates a complete, bit-for-bit duplicate of the object on the stack. This process is slow for large objects because it involves allocating memory and copying every member variable.
* **Passing by Reference (`&`):** When you pass by reference, you only pass the memory address of the object. This is essentially a pointer under the hood, making it extremely fast regardless of how large the structure is.

### Code Comparison

Here is how passing by value and passing by reference compare in practice:

```cpp
#include <iostream>
#include <vector>

struct LargeData {
    std::vector<int> data; // Imagine this holds 1,000,000 integers
    LargeData() { data.resize(1000000); }
};

// 1. Pass by Value: Triggers a deep copy of the entire vector
void processByValue(LargeData obj) {
    // Operations here...
}

// 2. Pass by Reference: No copy occurs, just a reference to the original
void processByReference(const LargeData& obj) {
    // Operations here...
}

int main() {
    LargeData myData;

    processByValue(myData);      // SLOW: Copies 1,000,000 integers
    processByReference(myData);  // FAST: No copying
    
    return 0;
}

```

### Why use `const` with references?

When you pass by reference, the function can modify the original object. If you only need to *read* the data and want to ensure the function does not accidentally change your original `struct`, you should use **`const` reference** (`const T&`).

| Method | Syntax | Performance | Safety |
| --- | --- | --- | --- |
| **Pass by Value** | `void func(Type obj)` | Slow (copies data) | High (original is safe) |
| **Pass by Reference** | `void func(Type& obj)` | Fast (no copy) | Low (original can be changed) |
| **Pass by Const Ref** | `void func(const Type& obj)` | Fast (no copy) | High (original is protected) |

By using `const` references, you gain the performance of pointers while maintaining the safety of value-based semantics.

Would you like to explore how **Move Semantics** provide an alternative way to optimize performance when you need to transfer ownership of large objects instead of just referencing them?



## **Performance Considerations**

* In C++, there is **no performance difference** between a `struct` and a `class`. The compiler generates the exact same machine code for both.
* You control memory layout (stack vs. heap) in C++ by how you instantiate them (e.g., `Point p;` is stack-allocated; `Point* p = new Point();` is heap-allocated), regardless of whether you use `struct` or `class`.

### **Memory Allocation: Stack vs. Heap**

Unlike C#, C++ gives you explicit control over where objects live:

* **Stack Allocation:** Created automatically when defined in a function scope. Fast, lifetime managed by scope.
```cpp
Point p; // Allocated on the stack

```


* **Heap Allocation:** Created manually using `new` or `std::make_unique`. Useful for large objects or objects that must persist beyond the current scope.
```cpp
Point* p = new Point(); // Allocated on the heap
// ... must delete p to avoid memory leaks ...

```

