# Classes

## Terminology

* **Members**: represent the data and behavior of a class or struct: fields, constants, methods, constructors, destructors, nested types. All members usually use PascalCase style, except private fields, which often use a `m_` prefix or camelCase with an underscore, and local variables, which use camelCase.
* **Fields**: variable of any type that is declared directly in a class or struct. Generally, you should declare private or protected accessibility for fields. Data exposed to client code should be provided through methods and properties (or getter/setter methods in C++).
```cpp
private:
    std::string m_lastName; // private fields often use m_ prefix or camelCase
public:
    std::string firstName;  // public fields use camelCase or PascalCase depending on style

```


* **Properties (Getter/Setter Methods)**: C++ does not have native property syntax like C#. Instead, you implement "getter" and "setter" methods to read or write data fields.
```cpp
private:
    std::string m_firstName;
public:
    void setFirstName(const std::string& name) { m_firstName = name; }
    std::string getFirstName() const { return m_firstName; }

```


* **Methods**: A method is a member function that contains a series of statements. A program causes the statements to be executed by calling the method and specifying any required arguments.
```cpp
public:
    void startEngine() { /* Method statements here */ }

```


* **Constructors**: A constructor is a special member function called when an instance of a class is created. A class can have multiple constructors that take different arguments.
```cpp
class Person {
private:
    std::string m_last;
    std::string m_first;
public:
    Person(std::string last, std::string first) 
        : m_last(last), m_first(first) {}
};

```


* **Local variables**: Declared within a method, constructor, or block (e.g., inside curly braces {}). They exist only within that specific scope and are destroyed when the scope is exited.
```cpp
class Person {
private:
    int m_luck;
public:
    int increaseLuck() {
        int localVar = 10; // local variable
        m_luck += localVar;
        return m_luck;
    }
};

```



### Naming conventions

* Use PascalCase for class names.
* Use camelCase for method names, property methods, local variables, and parameters.
* Use `m_` prefix or camelCase with underscore for private fields.

```cpp
class Person {
private:
    int m_count;
    int m_age;
public:
    // Getter/Setter for m_age
    void setAge(int age) { m_age = age; }
    int getAge() const { return m_age; }

    // Getter for m_count
    int getCount() const { return m_count; }

    Person(std::string lastName, std::string firstName, int age)
        : m_lastName(lastName), m_firstName(firstName), m_age(age) {}

    void increment() {
        int step = 1; // local variable
        m_count += step;
    }
private:
    std::string m_firstName;
    std::string m_lastName;
};

```

---

## 1. Class definition

### 1.1. Data

#### Field and Methods

```cpp
class Car {
private:
    int m_purchaseYear;
public:
    // Getter/Setter
    int getPurchaseYear() const { return m_purchaseYear; }
    void setPurchaseYear(int year) { m_purchaseYear = year; }
};

```

#### Public Fields vs Getter/Setter Methods

|  | Public Field | Getter/Setter Method |
| --- | --- | --- |
| **Encapsulation** | None; direct access. | Encapsulates data; controls access. |
| **Logic** | No logic for set. | Can include validation. |
| **Flexibility** | Fixed; cannot change logic. | Can modify logic later. |
| **Usage** | Avoid in public APIs. | Preferred for public APIs. |
| **Performance** | Fastest. | Negligible overhead (inline). |

---

### 1.2. Methods

1. **Access control**:
```cpp
public: std::string hello() {}
private: int addition() {}

```


2. **Return values**:
```cpp
public: std::string hello() { return "Hello world"; }
public: void hola() { std::cout << "Hello world"; }

```


3. **Parameters**:
```cpp
private: int addition(int a, int b) { return a + b; }

```



### 1.3. Constructor

```cpp
class Car {
public:
    Car() { std::cout << "Car constructor" << std::endl; }
};

class Toyota : public Car {
public:
    Toyota() : Car() { std::cout << "Toyota constructor" << std::endl; }
};

```

### 1.4. Logic & validation in Methods

```cpp
class Person {
private:
    int m_health;
    int m_strength;
    int m_endurance;

    void updateHealth() {
        m_health = std::clamp(m_strength + m_endurance, 0, 100);
    }
public:
    void setStrength(int val) { m_strength = val; updateHealth(); }
    int getHealth() const { return m_health; }
};

```

The above code works only during instantiation. However, if during the game Strength or Endurance changes value, it won't be reflected to Health. Likewise, if Intelligence changes value, it won't be reflected to Mana. If we want Health and Mana to update when Strength, Endurance or Intelligence changes, use the code below instead.

In C++, because there is no direct equivalent to C# properties with integrated `get` and `set` logic, the standard approach is to use private member variables with public getter and setter methods. To enforce the logic (updating `Health` or `Mana` when attributes change), you call the update methods within the setters.

Here is the equivalent C++ implementation:

```cpp
#include <string>
#include <algorithm> // For std::clamp

class Person {
private:
    // Private fields
    int m_strength;
    int m_endurance;
    int m_intelligence;
    int m_health;
    int m_mana;

    // Internal update methods
    void updateHealth() {
        // C++17 std::clamp equivalent
        m_health = std::clamp(m_strength + m_endurance, 0, 100);
    }

    void updateMana() {
        m_mana = std::clamp(m_intelligence * 2, 0, 50);
    }

public:
    // Public data (C++ often uses direct access or simple getters for these)
    std::string name;
    int dexterity;

    // Constructor
    Person(std::string name, int str, int intel, int dex, int endu)
        : name(name), dexterity(dex) {
        // Initialize fields using setters to trigger health/mana calculation
        setStrength(str);
        setEndurance(endu);
        setIntelligence(intel);
    }

    // Getters and Setters
    int getStrength() const { return m_strength; }
    void setStrength(int value) { m_strength = value; updateHealth(); }

    int getEndurance() const { return m_endurance; }
    void setEndurance(int value) { m_endurance = value; updateHealth(); }

    int getIntelligence() const { return m_intelligence; }
    void setIntelligence(int value) { m_intelligence = value; updateMana(); }

    int getHealth() const { return m_health; }
    int getMana() const { return m_mana; }
};

```

### Key Differences in this Implementation

* **Properties vs. Methods**: C# properties (`Strength { get; set; }`) are syntactic sugar that map to methods. In C++, you must explicitly define `getStrength()` and `setStrength()`.
* **Encapsulation**: In the C# example, the setters for `Health` and `Mana` are `private`. In the C++ version, I have omitted public setters for `Health` and `Mana` and instead rely on the class's internal `update` methods, which effectively makes them read-only from the outside.
* **Initialization**: In C++, we use a member initializer list (after the `:`) in the constructor to initialize member variables before the body of the constructor runs.

Would you like to see how to implement an Observer pattern in C++ so that external classes can be notified when `Health` or `Mana` changes, similar to the C# `event` example provided in your documentation?


## 2. Class instantiation

### 2.1. New (Stack vs Heap)

```cpp
// Stack allocation
Car car(2025);

// Heap allocation (requires pointer/smart pointer)
Car* carPtr = new Car(2025);
delete carPtr; // Manual cleanup

```

## 3. Virtual methods

```cpp
class Car {
public:
    virtual void startEngine() { std::cout << "Starting engine..."; }
};

class Toyota : public Car {
public:
    void startEngine() override { std::cout << "Toyota starting engine..."; }
};

```

## 4. Abstract class

An abstract class in C++ is a class that contains at least one **pure virtual function**.

```cpp
class Animal {
public:
    virtual void makeSound() = 0; // Pure virtual
    void sleep() { std::cout << "Sleeping..."; }
};

class Dog : public Animal {
public:
    void makeSound() override { std::cout << "Woof!"; }
};

```

## 5. Interface

C++ does not have an `interface` keyword; you define an interface as an abstract class containing only pure virtual functions.

```cpp
class IVehicle {
public:
    virtual ~IVehicle() = default;
    virtual void start() = 0;
    virtual int getSpeed() const = 0;
};

class Car : public IVehicle {
public:
    void start() override { /* implementation */ }
    int getSpeed() const override { return 0; }
};

```

## 6. Abstract Class vs. Interface

* **Abstract Class**: Use when you need a base class with shared implementation (methods/fields) and at least one virtual function.
* **Interface**: Use when you need a pure contract (only pure virtual functions).

## 7. OOP Basic Theory

### 7.1. Inheritance

```cpp
class Character {};
class Wizard : public Character {};

```

### 7.2. Encapsulation

* **Public**: Visible outside.
* **Private**: Visible only inside class.
* **Protected**: Visible inside class and derived classes.

### 7.3. Polymorphism

```cpp
Car* myCar = new Toyota(); // Using pointers for polymorphism

```
