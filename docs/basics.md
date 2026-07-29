# Basics

# Uniform Initialization

## Initialization

Uniform initialization is a C++11 feature that uses **curly braces `{}`** to initialize almost every kind of object. The goal was to provide **one consistent syntax** instead of several different initialization styles.

Instead of remembering when to use `=`, `()`, or `{}`, modern C++ encourages using `{}` by default:

```cpp
int a{5}; // int a = 5
```

For structs and classes:

```cpp
Position p{10.0f, 20.0f};
```

### Before C++11

There were multiple ways to initialize objects. Different types often required different syntax:

```cpp
int a = 5;      // Copy initialization
int b(5);       // Direct initialization
int c = int(5); // Another form
```

For struct and classes:

```cpp
Position p = {10.0f, 20.0f}; // struct
Position p(10.0f, 20.0f);    // class
```


## Value Initialization

Empty braces initialize objects to their default or zero value.

```cpp
int x{};
float y{};
Position pos{};
```

Equivalent to:

```cpp
int x = 0;
float y = 0.0f;
Position pos{0.0f, 0.0f};
```

## Summary

Use brace initialization (`{}`) by default in modern C++.

It provides:

* One consistent initialization syntax.
* Protection against accidental narrowing conversions.
* Safe default initialization.
* Natural support for aggregates, containers, and most class types.

Use parentheses `()` only when you specifically want constructor semantics that differ from brace initialization (such as avoiding an `std::initializer_list` overload).

| Situation                         | Before C++11                                                        | Uniform Initialization (Preferred)                                 |
| --------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| Basic variables                   | `int x = 5;` or `int x(5);`                                         | `int x{5};`                                            |
| Aggregate structs (POD)           | `Position p = {1.0f, 2.0f};`                                        | `Position p{1.0f, 2.0f};`                              |
| Classes                           | `Player p(100, 4.5f);`                                              | `Player p{100, 4.5f};`                                 |
| Containers with explicit elements | `v.push_back(1); v.push_back(2); v.push_back(3);`                   | `std::vector<int> v{1, 2, 3};`                         |
| Zero/default initialization       | `int x = 0;`<br>`Position p = {};` (where supported)<br>`Player p;` | `int x{};`<br>`Position p{};`<br>`Player p{};`                                           |
| Prevent narrowing conversions     | Compiler usually allowed narrowing                                  | Brace initialization rejects narrowing at compile time |

# For loops

There are two types of **For loops**: Index-based and Ranged-based.

In modern C++, prefer a range-based `for` loop whenever you don't need the element's index. It's safer, shorter, and more expressive.

| Use a range-based `for`                 | Use an index-based `for`                     |
| --------------------------------------- | -------------------------------------------- |
| Process every element                   | Need the element's index (`i`)               |
| Read or modify elements                 | Access multiple containers by the same index |
| Don't care about the element's position | Skip or jump by arbitrary amounts            |
| Avoid indexing mistakes                 | Iterate over only part of a container        |
| Improve readability                     | Work with raw arrays or pointers             |

## range-based `for`

Use cases for **ranged-based** `for` loops:

### Read elements

```cpp
std::vector<int> values{1, 2, 3, 4};

for (int value : values)
{
    std::cout << value << '\n';
}
```



### Modify elements

Use a reference.

```cpp
for (int& value : values)
{
    value *= 2;
}
```



### Read large objects

Use a `const` reference to avoid copying.

```cpp
for (const Position& pos : positions)
{
    Draw(pos);
}
```

This is the most common form.



## index-based `for`

Use cases for **index-based** `for` loops:

### You need the index

```cpp
for (std::size_t i = 0; i < positions.size(); ++i)
{
    std::cout << i << ": " << positions[i].x << '\n';
}
```



### Access multiple containers

Very common in SoA and ECS.

```cpp
for (std::size_t i = 0; i < positions.size(); ++i)
{
    positions[i].x += velocities[i].x;
}
```

A range-based `for` doesn't directly give you matching elements from both containers.



### Skip elements

```cpp
for (std::size_t i = 0; i < values.size(); i += 2)
{
    Process(values[i]);
}
```



### Iterate over a subrange

```cpp
for (std::size_t i = start; i < end; ++i)
{
    Process(values[i]);
}
```



## Data-Oriented Design / ECS

### AoS

If all the data is in one object, a range-based `for` is ideal:

```cpp
for (Position& pos : positions)
{
    pos.x += 1.0f;
}
```



### SoA

An index-based loop is usually better:

```cpp
for (std::size_t i = 0; i < count; ++i)
{
    x[i] += vx[i];
    y[i] += vy[i];
}
```

The index ties together multiple arrays.

| Situation                                  | Preferred Loop                    |
| ------------------------------------------ | --------------------------------- |
| One container                              | Range-based `for`                 |
| AoS (ECS)                                  | Range-based `for`                 |
| Read-only iteration                        | `for (const T& item : container)` |
| Modify elements                            | `for (T& item : container)`       |
| Need the index                             | Index-based `for`                 |
| Multiple synchronized containers (SoA/ECS) | Index-based `for`                 |
| Raw pointers or flat arrays                | Index-based `for`                 |
| Partial or stepped iteration               | Index-based `for`                 |

# `int` vs `std::size_t`

There are two types of indices in index-based `for` loops: `std::size_t` and `int`.

## std::size_t

Used in standard library containers. Container sizes and indices are represented by `std::size_t`:

```cpp
std::vector<Position> positions;

for (std::size_t i = 0; i < positions.size(); ++i)
{
    positions[i].x += 1.0f;
}
```

`positions.size()` returns a `std::size_t`, so the types match exactly.

If you write

```cpp
for (int i = 0; i < positions.size(); ++i)
```

many compilers will warn about comparing a signed (`int`) and unsigned (`std::size_t`) value.

These containers use `std::size_t` (via `size_type`):

* `std::vector`
* `std::array`
* `std::deque`
* `std::list`
* `std::forward_list`
* `std::map`
* `std::set`
* `std::unordered_map`
* `std::unordered_set`
* `std::string`
* `std::span`
* `std::string_view`

## int

* Most loops never exceed `INT_MAX`.
* Signed arithmetic is less error-prone than unsigned arithmetic.
* `size_t` can introduce surprising behavior.

For example:

```cpp
std::size_t x = 5;

std::cout << x - 10;
```

This doesn't produce `-5`. Instead, it wraps around to a very large positive number because `std::size_t` is an unsigned type.

With `int`:

```cpp
int x = 5;

std::cout << x - 10;   // -5
```

the result is often what people expect.


## Rule of Thumb

| Situation                     | Preferred Type                    |
| ----------------------------- | --------------------------------- |
| Indexing a standard container | `std::size_t`                     |
| Using `container.size()`      | `std::size_t`                     |
| Memory sizes / byte counts    | `std::size_t`                     |
| General integer calculations  | `int`                             |
| Values that may be negative   | `int`                             |
| Reverse loops                 | `int`                             |
| Performance considerations    | Either (no meaningful difference) |
