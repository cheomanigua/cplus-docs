# Attributes

This is a classic "architectural crossroads" in game development, often referred to as the **Base vs. Derived Stat distinction**. The decision impacts your game's balance and technical complexity.

### The Two Philosophies

1. **The "Fixed Foundation" (Snapshotting)**
* **How it works**: Health is calculated once at creation using base stats.
* **Pros**: Simple to calculate, stable, easier to balance (you don't have to worry about players unequipping an item and suddenly dying because their max health dropped below their current health).
* **Cons**: Items feel less "impactful" because they don't buff the whole character identity.


2. **The "Dynamic Ecosystem" (Calculated Total)**
* **How it works**: Health is a derived stat calculated every time a query is made, or whenever the "dirty flag" is raised.
* **Pros**: Highly rewarding for players (items feel powerful), promotes diverse builds.
* **Cons**: Complex edge cases (e.g., what happens to damage over time effects or life steal when max health fluctuates?).



### The Middle Ground: The "Virtual Attribute" Pattern

If you want the best of both worlds, use **Virtual Attributes**. Instead of storing one `Health` value, split your data into two concepts:

* **`BaseHealth`**: This is what you calculate in `InitStats`. It represents the "natural" vitality of the character.
* **`ModifierBonus`**: This represents additive/multiplicative bonuses from gear (like the Ring of Strength).
* **`TotalHealth`**: This is a calculated property (not stored) that returns `BaseHealth + (ModifierBonus * Multiplier)`.

# Adding new Attribute

Files necessary to change in ordert to add a new attribute::

```
data/character/classes.json
data/character/races.json
data/system/formulas.json
include/Components/StatsComponent.hpp
include/Core/Contracts/CharacterSheetDto.hpp
include/Core/Model.hpp
src/Core/ConsoleGameView.cpp
src/Core/FormulaProcessor.cpp
src/Main.cpp
```

### Example: File Modification Checklist for "Dexterity"

To fully integrate the **Dexterity** attribute, you must modify the following files to ensure the data propagates through your architecture:

| File Path | Required Action |
| --- | --- |
| **`data/character/classes.json`** | Add or update `"ClassDex"` for each class entry. |
| **`data/character/races.json`** | Add or update `"RaceDex"` for each race entry. |
| **`data/system/formulas.json`** | Add logic to set and calculate `Dexterity` using `ClassDex` and `RaceDex` sources. |
| **`include/Components/StatsComponent.hpp`** | Add `stats.Dexterity = 0.0f` in the initialization/constructor. |
| **`include/Core/Contracts/CharacterSheetDto.hpp`** | Add `int Dexterity` member and update the constructor to accept/initialize `Dexterity(dexterity)`. |
| **`include/Core/Model.hpp`** | Update `EntityStats` struct, `RaceData` struct, `ClassData` struct, and their corresponding `NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE` macros. |
| **`src/Core/ConsoleGameView.cpp`** | Add `<< std::setw(8) << (int)stats.Dexterity` to the display logic. |
| **`src/Core/FormulaProcessor.cpp`** | Update `GetStatRef` to handle `"Dexterity"`, `"RaceDex"`, and `"ClassDex"`, and update `Execute` to assign the result to `stats.Dexterity`. |
| **`src/Main.cpp`** | Update the `statsComp.InitializeStats` call to include the `Dexterity` parameter with initial hardcoded value `1.0f`. |


### Implementation Details

#### 1. Data Definitions (`data/`)

* **`classes.json`** / **`races.json`**: Ensure these files contain the required `"ClassDex"` and `"RaceDex"` keys, as the system reads these directly into the data models.
* **`formulas.json`**: Add the following entries to define how the system derives the final strength value:
    * `{ "Type": "Set", "Stat": "Dexterity", "Source": "ClassDex" }`
    * `{ "Type": "Add", "Stat": "Dexterity", "Source": "RaceDex" }`


#### 2. Models and Headers (`include/`)

* **`Model.hpp`**: Add `float Dexterity` to `EntityStats`, `int RaceDex` to `RaceData`, and `int ClassDex` to `ClassData`. Ensure all these fields are included in the corresponding `NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE` macros.
* **`StatsComponent.hpp`**: Add the line `stats.Dexterity = 0.0f;` to your initialization function.
* **`CharacterSheetDto.hpp`**: Update the struct definition to include `int Dexterity;` and ensure the constructor reflects this addition: `Dexterity(dexterity)`.



#### 3. Processing and Logic (`src/`)

* **`FormulaProcessor.cpp`**: Update the getter and execution logic:
    * `if (name == "Dexterity") return stats.Dexterity;`
    * `if (name == "RaceDex") return static_cast<float>(race.RaceDex);`
    * `if (name == "ClassDex") return static_cast<float>(cls.ClassDex);`
    * In the `Execute` method, include: `if (targetName == "Dexterity") stats.Dexterity = currentVal;`.
* **`Main.cpp`**: Update the initialization call to pass the `Dexterity` value `1.0f` explicitly: `statsComp.InitializeStats(newId, 1.0f, 1.0f, 1.0f, 1.0f, 10.0f, 10.0f);`
* **`ConsoleGameView.cpp`**: Add the output stream operator for the stat: `<< std::setw(8) << (int)stats.Dexterity`.

### Summary Table

| File Category | Purpose | Action |
| --- | --- | --- |
| **JSON Files** | Source Data | Add attribute keys to `races`, `classes`, and `formulas`. |
| **Model Headers** | Data Structures | Add attribute members to `ClassData`, `RaceData`, and `EntityStats`. |
| **Component Headers** | Stat Initialization | Initialize the new attribute in `StatsComponent.hpp`. |
| **DTO Headers** | Data Transfer | Add attribute member and update constructor in `CharacterSheetDto.hpp`. |
| **View/UI Files** | Display Layer | Add the attribute to output logic in `ConsoleGameView.cpp`. |
| **Logic/Driver** | Logic Binding | Register source keys and call `Execute` in `FormulaProcessor.cpp` and `Main.cpp`. |
| **DataLoader** | Data Mapping | Ensure all new fields are correctly read during initialization. |

**Why this many files?** Because you have a **decoupled architecture**, you have to "handshake" the new variable through the system: the file defines it, the struct holds it, and the driver tells the formula processor how to use it.

### Code changes

To add **Dexterity** to your system, follow these specific code modifications.

### 1. Data Files (`data/`)

You must update your JSON files so the loader has values to put into your new struct members.

**`data/character/classes.json`**:

```json
{
  "Warrior": { "ClassStr": 10, "ClassInt": 5, "ClassDex": 8, ... }, // Add ClassDex
  "Wizard": { "ClassStr": 5, "ClassInt": 15, "ClassDex": 10, ... }  // Add RaceDex
}

```

**`data/character/races.json`**:

```json
{
  "Human": { "RaceStr": 2, "RaceInt": 5, "RaceDex": 5 }, // Add RaceDex
  "Orc": { "RaceStr": 10, "RaceInt": 1, "RaceDex": 3 }   // Add RaceDex
}

```

**`data/system/formulas.json`**:

```json
[
  { "Type": "Set", "Target": "Dexterity", "Source": "ClassDex" },
  { "Type": "Add", "Target": "Dexterity", "Source": "RaceDex" }
]

```




### 2. Models and Headers (`include/`)

**`include/Components/StatsComponents.hpp`**:

```cpp
        for (auto& stats : Data) {
            // ... existing ...
            stats.Dexterity = 0.0f; // Add this line
            // ... existing ...
    inline void InitializeStats(int32_t id, float strength, float intelligence, float dexterity, float health, float mana) { // Add dexterity
        auto& stats = Data[id];
        // ... existing ...
        stats.Dexterity = dexterity; // Add this line
        // ... existing ...
```

**`include/Core/Contracts/CharacterSheedDto.hpp`**:

```cpp
struct CharacterSheetDto {
    // ... existing ...
    int Dexterity; // Add this line

    CharacterSheetDto(std::string name, std::string weapon, std::string skill, 
                      int health, int mana, int strength, int intelligence, int dexterity) // Add dexterity
        // ... existing ...
        Dexterity(dexterity), // Add this line
        // ... existing ...
}:
```

**`include/Core/Model.hpp`**:

You must update your structs `ClassData` and `RaceData` so the `DataLoader` can read the new JSON keys. Also, because these use the automatic macro, you must update the macro arguments whenever you add new fields:

**Important:** Because you are using `nlohmann::json`'s automatic mapping (via `NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE` or similar in your code), **ensure you update the macro or the `from_json` function** to include `ClassDex`, `RaceDex`, etc., otherwise, the loader will ignore these new keys in your JSON files.

```cpp
struct ClassData {
    // ... existing ...
    int ClassDex; // Add this line
};
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(ClassData, ClassHealth, ClassMana, ClassStr, ClassInt, ClassDex, ClassPrimarySkill) // Add ClassDex

struct RaceData {
    // ... existing ...
    int RaceDex;  // Add this line
};
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(RaceData, RaceStr, RaceInt, RaceDex) // Add RaceDex

struct EntityStats {
    // ... existing ...
    float Dexterity; // Add this line
    // ... existing ...

    std::unordered_map<std::string, float> GetDynamicAttributes() const {
    return {
        // ... existing ...
        {"Dexterity", Dexterity}, // Add this line
        // ... existing ...
};
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(EntityStats, Health, Mana, Strength, Intelligence, Dexterity, IsDirty) // Add Dexterity
```


### 3. Processing and Logic (`src/`)

**`src/Core/ConsoleGameView.cpp`**:

```cpp
    const auto& activeEntities = registry.GetActiveEntities();
    
    std::cout << "\n" << std::left 
              // ... existing ...
              << std::setw(8)  << "Dex" // Add this line
              // ... existing ...

                      std::cout << std::left << std::setw(5)  << id 
                  // ... existing ...
                  << std::setw(8)  << (int)stats.Dexterity // Add this line
                  // ... existing ...

```
**`src/Core/FormulaProcessor.cpp`**:

```cpp
float FormulaProcessor::GetStatRef(const std::string& name, EntityStats& stats, 
                                    const ClassData& cls, const RaceData& race) {
    // 2. Entity Stats
    if (name == "Dexterity")    return stats.Dexterity; // Add this line
    
    // 3. Class Data (No cast needed, return by value)
    if (name == "ClassDex")     return static_cast<float>(cls.ClassDex); // Add this line
    
    // 4. Race Data (No cast needed, return by value)
    if (name == "RaceDex")      return static_cast<float>(race.RaceDex); // Add this line

void FormulaProcessor::ExecuteUpdateStats(const std::string& formulaName, EntityStats& stats, 
                               const ClassData& cls, const RaceData& race) {

        else if (targetName == "Dexterity")    stats.Dexterity = currentVal; // Add this line
```

**`src/Main.cpp`**:

```cpp
        // Strength: 1.0f, Intelligence: 1.0f, Dexterity: 1.0f, Health: 10.0f, Mana: 10.0f
        statsComp.InitializeStats(newId, 1.0f, 1.0f, 1.0f, 10.0f, 10.0f); // Add 1.0f for Dexterity
```

