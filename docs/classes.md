# Classes

## Terminology

* **Members**: represent the data and behavior of a class or struct: fields, constants, methods, constructors, destructors, nested types. There is no universal naming convention. However, a common convention is:
    - Classes: `PascalCase`
    - Methods: `camelCase`
    - Private fields: `camelCase_`, `m_camelCase` or `camelCase`.
    - Parameters and local variables: `camelCase`
* **Fields**: variable of any type that is declared directly in a class or struct. Generally, you should declare private or protected accessibility for fields. Data exposed to client code should be provided through methods and properties (or getter/setter methods in C++).
```cpp
private:
    // private fields use "_" suffix, "m_" prefix or camelCase
    float speed_;  
    float m_speed;
    float speed;
public:
    // public fields use camelCase or PascalCase
    float deltaTime;
    float DeltaTime;
```


* **Getter/Setter Methods (C# Properties)**: C++ does not have native property syntax like C#. Instead, you implement "getter" and "setter" methods to read or write data fields.
```cpp
private:
    std::string firstName_;
public:
    void setFirstName(const std::string& name) { firstName_ = name; }
    std::string getFirstName() const { return firstName_; }

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
* Use `_` suffix, `m_` prefix or camelCase for private fields.

```cpp
class Person {
private:
    int count_;
    int age_;
public:
    // Getter/Setter for age_
    void setAge(int age) { age_ = age; }
    int getAge() const { return age_; }

    // Getter for count_
    int getCount() const { return count_; }

    Person(std::string lastName, std::string firstName, int age)
        : lastName_(lastName), firstName_(firstName), age_(age) {}

    void increment() {
        int step = 1; // local variable
        count_ += step;
    }
private:
    std::string firstName_;
    std::string lastName_;
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

### 1.4 Member initializer lists

A member initializer list initializes class members **before the constructor body executes**:

```cpp
class Person
{
private:
    std::string name_;
    int age_;

public:
    Person(std::string name, int age)
        : name_(name), age_(age)
    {
        // Constructor body executes after initialization
    }
};
```

The member initializer list is preferred to this:

```cpp
Person(std::string name, int age)
{
    name_ = name;
    age_ = age;
}
```

[!TIP]
<strong>Rule of thumb</strong>
Prefer member initializer lists because they initialize members directly and are required for certain members, such as references and <code>const</code> fields.

### 1.5. Logic & validation in Methods

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

#include <algorithm>
#include <string>
#include <utility>

class Person
{
public:
    Person(std::string name, int strength, int intelligence,
           int dexterity, int endurance)
        : name_(std::move(name)),
          strength_(strength),
          endurance_(endurance),
          intelligence_(intelligence),
          dexterity_(dexterity)
    {
        updateHealth();
        updateMana();
    }

    // Getters
    const std::string& name() const noexcept { return name_; }
    int strength() const noexcept { return strength_; }
    int endurance() const noexcept { return endurance_; }
    int intelligence() const noexcept { return intelligence_; }
    int dexterity() const noexcept { return dexterity_; }
    int health() const noexcept { return health_; }
    int mana() const noexcept { return mana_; }

    // Setters
    void setStrength(int value) {strength_ = value; updateHealth();}
    void setEndurance(int value) {endurance_ = value; updateHealth();}
    void setIntelligence(int value) {intelligence_ = value; updateMana();}
    void setDexterity(int value) noexcept {dexterity_ = value;}

private:
    // Private fields
    std::string name_;
    int strength_;
    int endurance_;
    int intelligence_;
    int dexterity_;
    int health_ = 0;
    int mana_ = 0;

    // Internal calculations
    void updateHealth() noexcept
    {
        health_ = std::clamp(strength_ + endurance_, 0, 100);
    }

    void updateMana() noexcept
    {
        mana_ = std::clamp(intelligence_ * 2, 0, 50);
    }
};
```

Usage:

```text
Person player("John", 20, 15, 10, 30);

player.setStrength(40);

std::cout << player.health() << '\n';
std::cout << player.mana() << '\n';
```

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

## 8. Class Dissection

### Source code

```cpp
#include <cmath>
#include <stdexcept>

class Latitude
{
public:
    Latitude() = default;

    explicit Latitude(double degrees) : degrees_(degrees)
    {
        if (!std::isfinite(degrees_) || degrees_ < -90.0 || degrees_ > 90.0)
        {
            throw std::invalid_argument("Latitude must be finite and between -90 and 90 degrees.");
        }
    }

    double degrees() const noexcept
    {
        return degrees_;
    }

private:
    double degrees_ = 0.0;
};
```

### C++ features

| Feature | Meaning |
| --- | --- |
| `class` | Defines a custom type. |
| `public` | Accessible from outside the class. |
| `private` | Only accessible inside the class. |
| `Latitude() = default` | Asks the compiler to generate the default constructor. |
| `explicit` | Prevents a constructor from being used for implicit type conversions. |
| `double degrees` | Constructor parameter. |
| `: degrees_(degrees)` | Initializes the member variable. |
| `const` | The getter cannot modify the object. |
| `noexcept` | Guarantees no exception escapes the function. |
| `= 0.0` | Default member initializer. |
| `std::isfinite()` | Checks that a number isn't infinity or NaN. |
| `std::invalid_argument` | Exception for an invalid argument. |
| `throw` | Throws an exception. |

### Other important concepts

- Encapsulation: Keeps internal data private and exposes controlled access.
- Getter: `degrees()` provides read-only access to the latitude.
- Destructor: Automatically generated by C++. No custom destructor is needed.
- Rule of Zero: Avoid implementing special member functions when the compiler-generated versions are sufficient.

### Usage

cpp

```cpp
Latitude madrid(40.4168);

double value = madrid.degrees();

// Invalid latitude: throws std::invalid_argument
Latitude invalid(120.0);
```

### Headers

| Header | Purpose |
| --- | --- |
| `<cmath>` | Mathematical functions such as `std::isfinite()`. |
| `<stdexcept>` | Standard exceptions such as `std::invalid_argument`. |
