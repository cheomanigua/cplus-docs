# Enums and Flags

# Enumerations

In C++, an **enumeration** is a user-defined type that defines a set of named constants representing integral values. In modern C++, **`enum class`** (scoped enums) is preferred to create readable, type-safe code when a variable can only take one of a predefined set of values.

[!INFO]
By convention, enum name should be in singular.

There are to types of enumeration: **Unscoped enumeration** and **Scoped enumeration (Enum Class)**.

The primary difference between unscoped enums (`enum`) and scoped enums (`enum class`) in C++ is how they handle type safety, name collisions, and implicit conversions.

### Key Differences at a Glance

| Feature | Unscoped Enum (`enum`) | Scoped Enum (`enum class`) |
| --- | --- | --- |
| **Scope** | Pollutes the surrounding namespace | Members are scoped to the enum name |
| **Type Safety** | Weak (implicitly converts to `int`) | Strong (no implicit conversion to `int`) |
| **Namespace** | Must be unique in the parent scope | Can share names with other scopes |

### Detailed Breakdown

* **Namespace Pollution**:
    * **Unscoped**: The enumerators (e.g., `Monday`) are injected into the same scope as the `enum` definition. If you have two different `enum` types that both use the name `Monday`, you will trigger a naming collision.
    * **Scoped**: The enumerators must be accessed using the `EnumName::Enumerator` syntax. This prevents collisions, allowing you to use the same names in different `enum class` types without conflict.
* **Implicit Conversions**:
    * **Unscoped**: These automatically convert to `int`. This can lead to bugs where you accidentally compare an enum to an unrelated integer value, or perform arithmetic on them without intending to.
    * **Scoped**: These are strongly typed and do not implicitly convert to `int`. You must use a `static_cast<int>(...)` if you specifically need to treat the enum as an integer value.
* **Explicit Casting**:
    * Because scoped enums do not convert implicitly, you are forced to be explicit when converting between the `enum` type and its underlying integer representation. This makes your code more predictable and prevents accidental logic errors.

In modern C++, **scoped enums are generally preferred** unless you specifically require the implicit integer conversion behavior for legacy reasons or specific architectural designs.

Does this clarify the trade-offs between the two types for your documentation?


### Key Points About C++ Enums

1. **Syntax**:

:::tabs
@tab Unscoped enum

```cpp
enum EnumName
{
    Value1,  // Implicitly assigned 0
    Value2,  // Implicitly assigned 1
    Value3   // Implicitly assigned 2
};
```
@tab Scoped enum
```cpp
enum class EnumName
{
    Value1,  // Implicitly assigned 0
    Value2,  // Implicitly assigned 1
    Value3   // Implicitly assigned 2
};
```
:::



2. **Underlying Type**:
* By default, enums use `int` as the underlying type, but you can specify other integral types (`uint8_t`, `int8_t`, `short`, `unsigned short`, `int`, `unsigned int`, `long`, `unsigned long`).

:::tabs
@tab Unscoped enum

```cpp
enum Day : uint8_t
{
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3
};
```
@tab Scoped enum
```cpp
enum class Day : uint8_t
{
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3
};
```
:::




3. **Explicit Values**:
* You can assign specific values to enum members.

:::tabs
@tab Unscoped enum
```cpp
enum ErrorCode
{
    None = 0,
    NotFound = 404,
    ServerError = 500
};
```
@tab Scoped enum
```cpp
enum class ErrorCode
{
    None = 0,
    NotFound = 404,
    ServerError = 500
};
```
:::


4. **Usage**:
* Enums are used to improve code readability and maintainability by replacing magic numbers or strings with meaningful names.

:::tabs
@tab Unscoped enum
```cpp
Day today = Monday;
if (today == Monday)
{
    std::cout << "It's Monday!" << std::endl;
}
```
@tab Scoped enum
```cpp
Day today = Day::Monday;
if (today == Day::Monday)
{
    std::cout << "It's Monday!" << std::endl;
}
```
:::

5. **Enum Operations**:
* **ToString**: C++ does not have a built-in `ToString()`. You must implement a helper function to convert the enum to a string.

:::tabs
@tab Unscoped enum
```cpp
// Requires custom implementation
std::cout << DayToString(Monday) << std::endl; // Outputs: Monday
```
@tab Scoped enum
```cpp
// Requires custom implementation
std::cout << DayToString(Day::Monday) << std::endl; // Outputs: Monday
```
:::

* **Parse**: C++ does not have a built-in `Parse()`. You must implement a helper to convert a string to an enum value.
    ```cpp
    Day day = StringToDay("Tuesday");
    ```

* **Iterating**: There is no built-in `GetValues()`. You must manually define a collection or use a library like `magic_enum`.


6. **Flags Attribute**:
* C++ does not have a `[Flags]` attribute. Instead, you manually define values as powers of 2 and overload bitwise operators for the `enum class` to allow type-safe combining.

:::tabs
@tab Unscoped enum
```cpp
enum Permissions : uint8_t
{
    None = 0,
    Read = 1,
    Write = 2,
    Delete = 4
};
// Manually implement bitwise operators
```
@tab Scoped enum
```cpp
enum class Permissions : uint8_t
{
    None = 0,
    Read = 1,
    Write = 2,
    Delete = 4
};
// Manually implement bitwise operators
:::


7. **Common Practices**:
* Use singular names for enums (e.g., `Day` instead of `Days`) unless it’s a bitmask enum, where plural is common.
* Define a `None` or `Unknown` value for cases where no valid option applies.
* Enums are often used in switch statements for clean control flow:

:::tabs
@tab Unscoped enum
```cpp
switch (today)
{
    case Monday:
        std::cout << "Start of the week!" << std::endl;
        break;
    default:
        std::cout << "Not Monday." << std::endl;
        break;
}
```
@tab Scoped enum
```cpp
switch (today)
{
    case Day::Monday:
        std::cout << "Start of the week!" << std::endl;
        break;
    default:
        std::cout << "Not Monday." << std::endl;
        break;
}
```
:::


8. **Limitations**:
* Enums cannot contain methods, properties, or fields.
* Enums are not extensible (cannot inherit from other enums or classes).
* `enum class` enums are stored as their underlying type.


9. **Type Safety**:
* `enum class` prevents implicit conversion to `int`, enforcing type safety.
* Casting an invalid integer to an enum is possible using `static_cast` and may cause undefined behavior if not careful:
    ```cpp
    Day invalid = static_cast<Day>(999); // Compiles but may lead to undefined behavior
    
    ```


10. **Best Practices**:
* Use enums for fixed, well-known sets of values (e.g., days of the week, error codes).
* Avoid using enums for values that might change frequently or require complex logic.
* Validate values when casting from integers or strings by checking against known members.



### Example in Action

:::tabs
@tab Unscoped enum
```cpp
#include <iostream>

enum Day
{
    Monday = 1,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    Sunday
};

int main()
{
    Day today = Wednesday;
    std::cout << "Today is (Value: " << today << ")" << std::endl; 

    // Check if value is valid (Requires manual check)
    int input = 2;
    if (input >= 1 && input <= 7)
    {
        Day day = static_cast<Day>(input);
        std::cout << "Day from input: " << day << std::endl;
    }
    return 0;
}
```
@tab Scoped enum
```cpp
#include <iostream>

enum class Day
{
    Monday = 1,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    Sunday
};

int main()
{
    Day today = Day::Wednesday;
    std::cout << "Today is (Value: " << static_cast<int>(today) << ")" << std::endl; 

    // Check if value is valid (Requires manual check)
    int input = 2;
    if (input >= 1 && input <= 7)
    {
        Day day = static_cast<Day>(input);
        std::cout << "Day from input: " << static_cast<int>(day) << std::endl;
    }
    return 0;
}
```
:::

### When to Use Enums

* Use enums when you have a fixed set of related constants (e.g., states, categories, or options).
* Avoid enums for dynamic or open-ended sets of values; consider classes or structs instead.

---

# Flags

In C++, bitmasks are used with enums to indicate that the enum values can be combined using bitwise operations. Comparing bitmasks involves checking whether specific flags are set, unset, or match certain combinations using bitwise operators.

By convention, flags name should be in plural.

## Basic Usage

### Declaration

:::tabs
@tab Unscoped enum
```cpp
enum Elements : uint8_t { None = 0, Fire = 1<<0, Water = 1<<1, Earth = 1<<2 };
// Fire = 1, Water = 2, Earth = 4
```
@tab Scoped enum
```cpp
enum class Elements : uint8_t { None = 0, Fire = 1<<0, Water = 1<<1, Earth = 1<<2 };
// Fire = 1, Water = 2, Earth = 4
```
:::

### Set

There are five ways to set the same bits of a variable:

:::tabs
@tab Unscoped enum
```cpp
Elements elements {Elements(Fire | Water)};
Elements elements = static_cast<Elements>(Fire | Water);
Elements elements = static_cast<Elements>(3);
Elements elements = static_cast<Elements>(1<<0 | 1<<1);
Elements elements = static_cast<Elements>(0b011);
```
@tab Scoped enum
```cpp
Elements elements {static_cast<Elements>(static_cast<uint8_t>(Elements::Fire) | static_cast<uint8_t>(Elements::Water))};
Elements elements = static_cast<Elements>(static_cast<uint8_t>(Elements::Fire) | static_cast<uint8_t>(Elements::Water));
Elements elements = static_cast<Elements>(3);
Elements elements = static_cast<Elements>((1 << 0) | (1 << 1));
Elements elements = static_cast<Elements>(0b011);
```
:::

### Get

There is one way to get the bits set in a variable:

```cpp
std::cout << static_cast<int>(elements) << std::endl; // 3
```

[!INFO]
When doing queries and comparing, static_cast(elements) must be used.

### Key Concepts

* Bitfields can be created by treating enum values as powers of 2 (1, 2, 4, 8, etc.).
* Bitwise operators (`|`, `&`, `^`, `~`) are used to manipulate and compare flags.
* Common comparison tasks include checking if a specific flag is set, if all flags in a mask are set, or if any flags match.


:::tabs
@tab Unscoped enum
```cpp
#include <iostream>

enum Sumer { Ur = 1<<0, Uruk = 1<<1, Kish = 1<<2, Adab = 1<<3, Lagash = 1<<4 };

int main()
{
    // Four different ways to set the same bits
    Sumer capitals = (Sumer)(Uruk | Kish);
    capitals = (Sumer)6; // You can also use capitals = static_cast<Sumer>(6);
    capitals = (Sumer)(1<<1 | 1<<2);
    capitals = (Sumer)0b00110;
    
    // How to query using bitmasks
    Sumer target = (Sumer)0b11011;   // Ur, Uruk, Adab, Lagash
    Sumer current = (Sumer)0b01110;  // Uruk, Kish, Adab

    // Unscoped enums convert implicitly to int, so casting is optional for output
    std::cout << target << std::endl;                   // 27 (11011) <- target bits to achieve
    std::cout << current << std::endl;                  // 14 (01110) <- current bits
    std::cout << (current & target) << std::endl;       // 10 (01010) <- target bits achieved
    std::cout << (target & ~current) << std::endl;      // 17 (10001) <- remaining target bits to achieve
    std::cout << ((current & target) ^ current) << std::endl; // 4 (00100) - other

    // Comparison logic
    // Unscoped enums allow direct bitwise operations without casting
    if ((current & target) == current) {
        std::cout << "Exact match. Target achieved!" << std::endl;
    }
    else if ((current | target) == current) {
        std::cout << "Target achieved!" << std::endl;
    }
    else {
        std::cout << "Target not achieved!" << std::endl;
        std::cout << (target & ~current) << " missing" << std::endl;
    }

    return 0;
}
```
@tab Scoped enum
```cpp
#include <iostream>
#include <bitset>

enum class Sumer : int { Ur = 1<<0, Uruk = 1<<1, Kish = 1<<2, Adab = 1<<3, Lagash = 1<<4 };

int main()
{
    // Four different ways to set the same bits
    Sumer capitals = static_cast<Sumer>(static_cast<int>(Sumer::Uruk) | static_cast<int>(Sumer::Kish));
    capitals = static_cast<Sumer>(6); // Also you can use capitals = (Sumer)(6);
    capitals = static_cast<Sumer>(1<<1 | 1<<2);
    capitals = static_cast<Sumer>(0b00110);

    // How to query using bitmasks
    Sumer target = static_cast<Sumer>(0b11011);    // Ur, Uruk, Adab, Lagash
    Sumer current = static_cast<Sumer>(0b01110);   // Uruk, Kish, Adab

    std::cout << static_cast<int>(target) << std::endl;                                   // 11011 <- target bits to achieve
    std::cout << static_cast<int>(current) << std::endl;                                  // 01110 <- current bits
    std::cout << (static_cast<int>(current) & static_cast<int>(target)) << std::endl;     // 01010 <- target bits achieved
    std::cout << (static_cast<int>(target) & ~static_cast<int>(current)) << std::endl;    // 10001 <- remaining target bits to achieve
    std::cout << ((static_cast<int>(current) & static_cast<int>(target)) ^ static_cast<int>(current)) << std::endl; // 00100 <- other

    // Comparison logic
    if ((static_cast<int>(current) & static_cast<int>(target)) == static_cast<int>(current)) {
        std::cout << "Exact match. Target achieved!" << std::endl;
    }
    else if ((static_cast<int>(current) | static_cast<int>(target)) == static_cast<int>(current)) {
        std::cout << "Target achieved!" << std::endl;
    }
    else {
        std::cout << "Target not achieved!" << std::endl;
        std::cout << (static_cast<int>(target) & ~static_cast<int>(current)) << " missing" << std::endl;
    }

    return 0;
}
```
:::

## Comparison Patterns

### Comparing Bitmasks

Here’s how to perform common comparisons with bitmasks in C++.

:::tabs
@tab Unscoped enum
```cpp
enum Elements { Fire = 1<<0, Water = 1<<1, Earth = 1<<2 };

int main()
{
    // Bitwise operations work directly without casts
    Elements elements = (Elements)(Fire | Water);

    // Using bitwise `&`, equality operator `==`
    bool isFire = (elements & Fire) == Fire;
    
    // Using bitwise `&`, equality operator `!= 0`
    bool isFireAny = (elements & Fire) != 0;
}
```
@tab Scoped enum
```cpp
enum class Elements : int { Fire = 1<<0, Water = 1<<1, Earth = 1<<2 };

int main()
{
    Elements elements = static_cast<Elements>(static_cast<int>(Elements::Fire) | static_cast<int>(Elements::Water));

    // Using bitwise `&`, equality operator `==`
    bool isFire = (static_cast<int>(elements) & static_cast<int>(Elements::Fire)) == static_cast<int>(Elements::Fire);
    
    // Using bitwise `&`, equality operator `!= 0`
    bool isFireAny = (static_cast<int>(elements) & static_cast<int>(Elements::Fire)) != 0;
}
```
:::

#### 1. **Check if a Specific Flag is Set**

:::tabs
@tab Unscoped enum
```cpp
enum Permissions { None = 0, Read = 1, Write = 2, Execute = 4, Delete = 8 };

Permissions userPermissions = (Permissions)(Read | Write);

bool canWrite = (userPermissions & Write) == Write;
```
@tab Scoped enum
```cpp
enum class Permissions : int { None = 0, Read = 1, Write = 2, Execute = 4, Delete = 8 };

Permissions userPermissions = static_cast<Permissions>(static_cast<int>(Permissions::Read) | static_cast<int>(Permissions::Write));

// Using bitwise AND
bool canWrite = (static_cast<int>(userPermissions) & static_cast<int>(Permissions::Write)) == static_cast<int>(Permissions::Write);
```
:::

#### 2. **Check if All Flags in a Mask are Set**

:::tabs
@tab Unscoped enum
```cpp
Permissions required = (Permissions)(Read | Execute);
bool hasAll = (userPermissions & required) == required;
```
@tab Scoped enum
```cpp
Permissions required = static_cast<Permissions>(static_cast<int>(Permissions::Read) | static_cast<int>(Permissions::Execute));
bool hasAll = (static_cast<int>(userPermissions) & static_cast<int>(required)) == static_cast<int>(required);
```
:::

#### 3. **Check if Any Flag in a Mask is Set**

:::tabs
@tab Unscoped enum
```cpp
Permissions check = (Permissions)(Write | Delete);
bool hasAny = (userPermissions & check) != 0;
```
@tab Scoped enum
```cpp
Permissions check = static_cast<Permissions>(static_cast<int>(Permissions::Write) | static_cast<int>(Permissions::Delete));
bool hasAny = (static_cast<int>(userPermissions) & static_cast<int>(check)) != 0;
```
:::

#### 4. **Check if No Flags in a Mask are Set**

:::tabs
@tab Unscoped enum
```cpp
Permissions forbidden = (Permissions)(Execute | Delete);
bool hasNone = (userPermissions & forbidden) == 0;
```
@tab Scoped enum
```cpp
Permissions forbidden = static_cast<Permissions>(static_cast<int>(Permissions::Execute) | static_cast<int>(Permissions::Delete));
bool hasNone = (static_cast<int>(userPermissions) & static_cast<int>(forbidden)) == 0;
```
:::

#### 5. **Compare Exact Bitmask**

:::tabs
@tab Unscoped enum
```cpp
Permissions expected = (Permissions)(Read | Write);
bool isExactMatch = (userPermissions == expected);
```
@tab Scoped enum
```cpp
Permissions expected = static_cast<Permissions>(static_cast<int>(Permissions::Read) | static_cast<int>(Permissions::Write));
bool isExactMatch = userPermissions == expected;
```
:::

#### 6. **Toggle or Modify Flags**

:::tabs
@tab Unscoped enum
```cpp
// Add a flag
userPermissions = (Permissions)(userPermissions | Execute);

// Remove a flag
userPermissions = (Permissions)(userPermissions & ~Write);

// Toggle a flag
userPermissions = (Permissions)(userPermissions ^ Read);
```
@tab Scoped enum
```cpp
// Add a flag
userPermissions = static_cast<Permissions>(static_cast<int>(userPermissions) | static_cast<int>(Permissions::Execute));

// Remove a flag
userPermissions = static_cast<Permissions>(static_cast<int>(userPermissions) & ~static_cast<int>(Permissions::Write));

// Toggle a flag
userPermissions = static_cast<Permissions>(static_cast<int>(userPermissions) ^ static_cast<int>(Permissions::Read));
```
:::


### Best Practices

* **Use Powers of 2**: Ensure enum values are powers of 2.
* **Explicitly Define Combinations**: For commonly used combinations, define them in the enum.

### Example: Comprehensive Comparison

:::tabs
@tab Unscoped enum
```cpp
#include <iostream>

// 1. Unscoped enum (Implicitly converts to int)
enum Permissions {
    None = 0,
    Read = 1,
    Write = 2,
    Execute = 4,
    Delete = 8
};

void CheckPermissions(Permissions userPermissions) {
    std::cout << "Checking permissions..." << std::endl;

    // Check individual flag (No casting needed)
    bool canRead = (userPermissions & Read) == Read;
    std::cout << "Can Read: " << (canRead ? "True" : "False") << std::endl;

    // Check all flags in mask
    Permissions required = (Permissions)(Read | Write);
    bool hasAll = (userPermissions & required) == required;
    std::cout << "Has Read and Write: " << (hasAll ? "True" : "False") << std::endl;

    // Check any flag in mask
    Permissions check = (Permissions)(Execute | Delete);
    bool hasAny = (userPermissions & check) != None;
    std::cout << "Has Execute or Delete: " << (hasAny ? "True" : "False") << std::endl;

    // Check exact match
    Permissions expected = (Permissions)(Read | Write);
    bool isExactMatch = (userPermissions == expected);
    std::cout << "Exact match for Read|Write: " << (isExactMatch ? "True" : "False") << std::endl;
}

int main() {
    // Combine flags simply
    Permissions perms = (Permissions)(Read | Write);
    CheckPermissions(perms);
    return 0;
}
```
@tab Scoped enum
```cpp
#include <iostream>

// 1. Define the enum class
enum class Permissions : int {
    None = 0,
    Read = 1,
    Write = 2,
    Execute = 4,
    Delete = 8
};

// 2. Enable bitwise OR operator for type-safe combining
inline Permissions operator|(Permissions a, Permissions b) {
    return static_cast<Permissions>(static_cast<int>(a) | static_cast<int>(b));
}

// 3. Enable bitwise AND operator for masking
inline Permissions operator&(Permissions a, Permissions b) {
    return static_cast<Permissions>(static_cast<int>(a) & static_cast<int>(b));
}

void CheckPermissions(Permissions userPermissions) {
    std::cout << "Checking permissions..." << std::endl;

    // Check individual flag
    bool canRead = (userPermissions & Permissions::Read) == Permissions::Read;
    std::cout << "Can Read: " << (canRead ? "True" : "False") << std::endl;

    // Check all flags in mask
    Permissions required = Permissions::Read | Permissions::Write;
    bool hasAll = (userPermissions & required) == required;
    std::cout << "Has Read and Write: " << (hasAll ? "True" : "False") << std::endl;

    // Check any flag in mask
    Permissions check = Permissions::Execute | Permissions::Delete;
    bool hasAny = (userPermissions & check) != Permissions::None;
    std::cout << "Has Execute or Delete: " << (hasAny ? "True" : "False") << std::endl;

    // Check exact match
    Permissions expected = Permissions::Read | Permissions::Write;
    bool isExactMatch = userPermissions == expected;
    std::cout << "Exact match for Read|Write: " << (isExactMatch ? "True" : "False") << std::endl;
}

int main() {
    Permissions perms = Permissions::Read | Permissions::Write;
    CheckPermissions(perms);
    return 0;
}
```
:::

##### Output

```
Checking permissions...
Can Read: True
Has Read and Write: True
Has Execute or Delete: False
Exact match for Read|Write: True
cheo@hal:~/code/cplus/enums$ 
```

### From `int` to binary

```cpp
#include <bitset>

int element = 4;
std::cout << element << ": " << std::bitset<3>(element) << std::endl; // prints 100

int element = 1;
std::cout << element << ": " << std::bitset<3>(element) << std::endl; // prints 001
```

### Notes

* Ensure bitwise operations are performed on the underlying integral types.

---

## Mask-Based Filtering

Given the sample json file:

```json
{
  "30": { <--- EntitiyId
    "Name": "Ring of Strength"
  },
  "101": { <--- EntityId
    "Name": "Sword of Flames"
  }
}
```

The example below uses bitmasks to filter the category of an EntityID.

```cpp
namespace EntityMasks
{
    // These values identify the bit-flags corresponding to your current pointer ranges
    const int ITEM_MASK       = 0x000; // 0-255 (No high bits set)
    const int NPC_MASK        = 0x100; // 256 (Bit 8 set)
    const int PROJECTILE_MASK = 0x200; // 512 (Bit 9 set)
    
    // Mask to isolate only the type bits (ignoring the 0-255 index bits)
    const int TYPE_MASK       = ITEM_MASK | NPC_MASK | PROJECTILE_MASK;
}

// Logic to check entity type
bool IsItem(int id)
{
    return (id & EntityMasks::TYPE_MASK) == EntityMasks::ITEM_MASK;
}
```


### Understanding EntityMasks and Bitwise Filtering

### Advanced Application: Mask-Based Entity Filtering

Your code utilizes the concepts of **Bitmasks** to partition and validate entity IDs efficiently. Here is how the logic works in C++:

#### 1. The Strategy: Partitioning

By assigning IDs in specific bit-blocks (e.g., `0x100` for NPCs, `0x200` for Projectiles), you are creating a system where the "Type" of an entity is encoded directly into its ID.

* **`ITEM_MASK` (0x000)**: Uses the lowest bits (0-255).
* **`NPC_MASK` (0x100)**: Flips bit 8.
* **`PROJECTILE_MASK` (0x200)**: Flips bit 9.

#### 2. The Power of `TYPE_MASK`

Using the **Bitwise OR** (`|`) operator to create `TYPE_MASK` creates a "master mask" that identifies the structural region of your ID, allowing you to ignore the specific index (0-255) and focus only on the category bits.

#### 3. Efficient Validation

In your `GetItem(int id)` method, you perform a **Fail-Fast** check:

```cpp
if ((id & EntityMasks::TYPE_MASK) != EntityMasks::ITEM_MASK) return nullptr;
```

* **The Operation**: You use the bitwise `&` (AND) operator to extract the category bits of the `id`.
* **The Comparison**: If the extracted bits don't match `ITEM_MASK`, the system knows instantly—without checking the array or memory—that the ID is not an item.
* **Why it's fast**: Bitwise `&` is a single CPU instruction, which is significantly faster than standard range checking or complex conditionals.

### Key Takeaways

* **Safety**: You are preventing invalid data from reaching your array access logic by validating the ID's type first.
* **Performance**: You are using bitwise `&` rather than multiple `if` branches, which is preferred for performance-critical systems like game engines.
* **Scalability**: By updating `TYPE_MASK` via OR operations, the code is easily extensible if you add more entity types later.

### TYPE_MASK

To understand `TYPE_MASK`, you have to realize that your `id` carries two different pieces of information at the same time:

1. **The Index**: Which slot in the array it occupies (the lower 8 bits, 0-255).
2. **The Type**: Which category it belongs to (the higher bits, 256 and 512).

### The "Filter" Concept

When you look at an entity `id` like `260` (which is an NPC), its binary looks like this:
`0001 0000 0100` (Binary for 260)

If you only want to know the **Type**, you need to "hide" the index part (`0000 0100`) and only look at the category part (`0001 0000 0000`).

**`TYPE_MASK` is the tool that hides the index.**

### How the `&` (AND) operation works:

When you perform `(id & TYPE_MASK)`, the computer performs a logical "multiplication" on every bit:

* If the mask has a `1`, the original bit stays.
* If the mask has a `0`, the original bit is forced to `0` (hidden).

**Example: Is ID `260` an Item?**

* **ID**: `0001 0000 0100` (260)
* **MASK**: `0011 0000 0000` (0x300)
* **Result**: `0001 0000 0000` (0x100, which is `NPC_MASK`)

Now compare the result:
`0x100` (Result) `!=` `0x000` (ITEM_MASK). **The check returns `true`, and the function correctly returns `nullptr` because it's an NPC, not an Item.**

### Why is this better than just checking the number?

If you didn't have `TYPE_MASK`, you would have to write:
`if (id >= 256 && id < 512)`

With `TYPE_MASK`, you are asking the CPU to ignore the "noise" (the specific index) and look only at the "category" (the bits that define the type).

### In short:

* `TYPE_MASK` defines the **"Region of Interest"** in the number.
* By setting it to `0x300`, you are telling the computer: *"I don't care about the last 8 bits (the index); I only care about bits 8 and 9 (the category)."*
