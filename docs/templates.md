# C++ Templates

C++ templates allow you to write generic code that works with different data types without duplicating the same implementation.

Instead of writing separate functions or classes for `int`, `double`, and `string`, you can write one template and let the compiler generate the appropriate versions.

## 1. Function templates

A function template works with different data types.

Example: A generic function



```cpp
#include <iostream>
#include <string>

template <typename T>
T add(T a, T b) {
    return a + b;
}

int main() {
    std::cout << add(10, 20) << std::endl;       // int: 30
    std::cout << add(1.5, 2.5) << std::endl;     // double: 4
    std::cout << add<std::string>("Hello ", "World");

    return 0;
}
```

Explanation:

- `template<typename T>` declares a template parameter.
- `T` represents a generic type.
- The compiler deduces the type from the function arguments.
- You can use the same function with different types.

## 2. Class templates

Class templates allow you to create classes that work with different data types.

Example: A generic Box



```cpp
#include <iostream>
#include <string>

template <typename T>
class Box {
private:
    T value;

public:
    Box(T v) {
        value = v;
    }

    T getValue() {
        return value;
    }
};

int main() {
    Box<int> intBox(100);
    Box<double> doubleBox(10.5);
    Box<std::string> stringBox("Hello");

    std::cout << intBox.getValue() << std::endl;
    std::cout << doubleBox.getValue() << std::endl;
    std::cout << stringBox.getValue() << std::endl;

    return 0;
}
```

Explanation:

- `Box<T>` is a generic class.
- `Box<int>` creates a box storing integers.
- `Box<double>` creates a box storing decimal numbers.
- Each specialization has its own type.

## 3. Templates with multiple parameters

A template can have more than one type parameter.

Example: A generic Pair



```cpp
#include <iostream>
#include <string>

template <typename T1, typename T2>
class Pair {
public:
    T1 first;
    T2 second;

    Pair(T1 a, T2 b) {
        first = a;
        second = b;
    }

    void display() {
        std::cout << first << " - " << second << std::endl;
    }
};

int main() {
    Pair<int, std::string> p1(1, "Apple");
    Pair<std::string, double> p2("Price", 9.99);

    p1.display();
    p2.display();

    return 0;
}
```

Explanation:

- `T1` and `T2` are independent template parameters.
- They can represent different data types.
- You can combine types in a single class.

## 4. Template functions with explicit types

You can explicitly specify the template type instead of relying on type deduction.



```cpp
#include <iostream>
#include <string>

template <typename T>
void print(T value) {
    std::cout << value << std::endl;
}

int main() {
    print<int>(10);
    print<double>(3.14);
    print<std::string>("Hello");

    return 0;
}
```

Here, `<int>`, `<double>`, and `<string>` explicitly specify the template arguments.

## 5. Non-type template parameters

Templates can also accept values as parameters, not just types.

Example: Fixed-size array



```cpp
#include <iostream>

template <typename T, int SIZE>
class Array {
private:
    T data[SIZE];

public:
    int getSize() {
        return SIZE;
    }
};

int main() {
    Array<int, 5> numbers;
    Array<double, 10> values;

    std::cout << numbers.getSize() << std::endl; // 5
    std::cout << values.getSize() << std::endl;  // 10

    return 0;
}
```

Here:

- `T` is a type parameter.
- `SIZE` is a non-type parameter.
- The size is determined at compile time.

## 6. Template specialization

Template specialization allows you to provide a specific implementation for a particular type.

Example: Special handling for bool



```cpp
#include <iostream>

template <typename T>
void print(T value) {
    std::cout << "Value: " << value << std::endl;
}

template <>
void print<bool>(bool value) {
    std::cout << (value ? "True" : "False") << std::endl;
}

int main() {
    print(10);
    print(3.14);
    print(true);

    return 0;
}
```

The compiler uses the specialized implementation when the type is `bool`.

## 7. Variadic templates (introduction)

Variadic templates allow a function or class to accept an arbitrary number of template arguments.

Example: Print multiple values



```cpp
#include <iostream>

template <typename T>
void print(T value) {
    std::cout << value << std::endl;
}

template <typename T, typename... Args>
void print(T first, Args... rest) {
    std::cout << first << " ";
    print(rest...);
}

int main() {
    print(10, 20, 30, "Hello", 3.14);

    return 0;
}
```

`Args...` represents zero or more additional template parameters.

## 8. Summary

| Template concept | Purpose |
| --- | --- |
| Function template | Generic functions |
| Class template | Generic classes |
| Multiple parameters | Support multiple types |
| Explicit arguments | Specify template types manually |
| Non-type parameters | Pass compile-time values |
| Specialization | Customize behavior for a specific type |
| Variadic templates | Accept a variable number of arguments |

## 9. When should you use templates?

Templates are particularly useful when:

- You want to avoid duplicating code.
- You want reusable data structures.
- You want generic algorithms.
- You want compile-time type safety.
- You want to create libraries that work with many types.

Some familiar examples from the C++ Standard Library are:

- `std::vector<T>` – dynamic arrays.
- `std::map<K, V>` – key-value containers.
- `std::pair<T1, T2>` – pairs of values.
- `std::optional<T>` – optional values.
- `std::array<T, N>` – fixed-size arrays.

## 10. Practice exercises

Try implementing these yourself:

1. Write a template function that returns the maximum of two values.
2. Create a `Calculator<T>` class with addition, subtraction, multiplication, and division.
3. Create a template function that swaps two variables.
4. Create a `Stack<T>` class with `push()`, `pop()`, and `top()`.
5. Create a template function that calculates the sum of an array of any numeric type.

Key takeaway: C++ templates are the foundation of generic programming. They let you write reusable, type-safe code that works with many different data types.
