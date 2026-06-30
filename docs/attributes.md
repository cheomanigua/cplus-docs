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

### How to implement this in your ECS:

You can keep your current `InitStats` as the *Base* calculation, and update your `EntityRegistry` to apply Gear bonuses as **temporary modifiers** rather than permanently altering the `BaseHealth` value.

**Why this is better:**

* You don't need to re-run your `InitStats` formula every time someone equips a ring.
* You preserve the "natural" health (the player knows their base class health).
* Your combat system simply queries the *Total* whenever it needs to check for death.

**Recommendation:**
If your game is complex (with many items), go with the **Dynamic/Dirty Flag approach**. Games like *Diablo* or *World of Warcraft* use this because it prevents bugs where stat initialization logic gets "trapped" in a specific state. It makes the game feel much more responsive to player choices.

Which design feels like it fits the "vibe" of your game better—a world where you build a character up slowly, or one where items are the primary way to define power?

# Adding new Attribute

To add "Dexterity" to your engine, you need to update **5 areas** to ensure the data propagates correctly from your JSON files through to the `EntityStats` struct and your display layer.

### 1. Data Definitions (`data/`)

* **`races.json`**: Add a `RaceDex` key to your existing races.
* **`classes.json`**: Add a `ClassDex` key to your classes.
* **`formulas.json`**: Add the operations to calculate `Dexterity` (e.g., set base and add modifiers).

### 2. Data Structs (`include/Core/Model.hpp`)

You must update your C++ structs so the `DataLoader` can map the JSON fields into memory.

* Update `ClassData` and `RaceData` to include `int ClassDex` and `int RaceDex`.
* Update `EntityStats` to include `float Dexterity`.

### 3. Data Transfer Object (`include/Core/CharacterSheetDto.hpp`)

You must update your DTO to ensure the new stat is available for your UI or summary reports.

* Add `int Dexterity` to the struct members.
* Update the constructor to accept and initialize the new `Dexterity` parameter.

### 4. `DataLoader.cpp`

Because you used `nlohmann::json`'s automatic mapping, adding the fields to the structs is usually enough. However, if you have manual logic, ensure the new fields are being read correctly during the `LoadCharacterFile` process.

### 5. `EngineDriver.cpp`

This is where the manual "wiring" happens for the `FormulaProcessor`. You must add the registration logic for the new attribute:

* Add the `RegisterSource` calls for `"ClassDex"` and `"RaceDex"`.
* Add the `RegisterSource` call for `"Dexterity"` (the current stat).
* Add the execution line: `stats->Dexterity = FormulaProcessor::Execute("UpdateStats", "Dexterity");`.
* Update any `CharacterSheetDto` instantiation to include the newly calculated `stats->Dexterity`.

### Summary Table

| File Category | Purpose | Action |
| --- | --- | --- |
| **JSON Files** | Source Data | Add `Dex` keys to `races`, `classes`, and `formulas`. |
| **Model Headers** | Data Structures | Add `Dex` members to `ClassData`, `RaceData`, and `EntityStats`. |
| **DTO Headers** | Data Transfer | Add `Dexterity` member and update constructor in `CharacterSheetDto`. |
| **EngineDriver** | Logic Binding | Register `"ClassDex"`/`"RaceDex"` and call `Execute` for `"Dexterity"`. |
| **DataLoader** | Data Mapping | Ensure all new fields are correctly read during initialization. |

**Why this many files?** Because you have a **decoupled architecture**, you have to "handshake" the new variable through the system: the file defines it, the struct holds it, and the driver tells the formula processor how to use it.

### Code changes

To add **Dexterity** to your system, follow these specific code modifications.

### 1. Update Models (`include/Core/Model.hpp`)

You must update your structs `ClassData` and `RaceData` so the `DataLoader` can read the new JSON keys. Also, because these use the automatic macro, you must update the macro arguments whenever you add new fields:

```cpp
struct ClassData {
    // ... existing ...
    int ClassDex; // Add this
};
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(ClassData, ClassHealth, ClassMana, ClassStr, ClassInt, ClassDex, PrimarySkill) // Add ClassDex

struct RaceData {
    // ... existing ...
    int RaceDex;  // Add this
};
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(RaceData, RaceStr, RaceInt, RaceDex) // Add RaceDex

struct EntityStats {
    // ... existing ...
    float Dexterity; // Add this
};
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(EntityStats, Health, Mana, Strength, Intelligence, Dexterity, IsDirty) // Add Dexterity
```

### 2. Update `EngineDriver.cpp`

You need to bridge the new data to the `FormulaProcessor`.

```cpp
// 3. Bind new Dexterity data
FormulaProcessor::RegisterSource("ClassDex", [&classData]() -> float { 
    return static_cast<float>(classData.ClassDex); 
});
FormulaProcessor::RegisterSource("RaceDex", [&raceData]() -> float { 
    return static_cast<float>(raceData.RaceDex); 
});
FormulaProcessor::RegisterSource("Dexterity", [stats]() -> float { 
    return stats->Dexterity; 
});

// 4. Run the formula for the new stat
stats->Dexterity = FormulaProcessor::Execute("UpdateStats", "Dexterity");

```

### 3. Update `CharacterSheetDto.hpp`

```cpp
struct CharacterSheetDto {
    // ... existing ...
    int Dexterity; // Add this

    CharacterSheetDto(std::string name, std::string weapon, std::string skill, 
                      int health, int mana, int strength, int intelligence, int dexterity) // Add dexterity
        // ... existing ...
        Intelligence(intelligence),
        Dexterity(dexterity) {} // Add this
}:
```

### 4. Update Data Files (`data/`)

You must update your JSON files so the loader has values to put into your new struct members.

**`data/character/classes.json`**:

```json
{
  "Warrior": { "ClassStr": 10, "ClassInt": 5, "ClassDex": 8, ... },
  "Wizard": { "ClassStr": 5, "ClassInt": 15, "ClassDex": 10, ... }
}

```

**`data/character/races.json`**:

```json
{
  "Human": { "RaceStr": 2, "RaceInt": 5, "RaceDex": 5 },
  "Orc": { "RaceStr": 10, "RaceInt": 1, "RaceDex": 3 }
}

```

**`data/system/formulas.json`**:

```json
[
  { "Type": "Set", "Target": "Dexterity", "Source": "ClassDex" },
  { "Type": "Add", "Target": "Dexterity", "Source": "RaceDex" }
]

```

**Important:** Because you are using `nlohmann::json`'s automatic mapping (via `NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE` or similar in your code), **ensure you update the macro or the `from_json` function** to include `ClassDex`, `RaceDex`, etc., otherwise, the loader will ignore these new keys in your JSON files.

Does your current `from_json` function for `ClassData` and `RaceData` use an automatic macro, or are you manually mapping the fields?
