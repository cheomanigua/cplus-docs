# Formulae and Modifiers

This document outlines the interaction between data files and processor systems for a scalable, high-performance combat architecture.

---

## 1. System Philosophy: Data-Driven Modularity

The engine is divided into three distinct architectural layers to ensure separation of concerns:

* **Data Layer (`.json`)**: Raw definitions for entities, traits, archetypes, and mathematical instructions.
* **Initialization Layer**: The bridge that triggers the setup of an entity's statistics within the `EntityRegistry`.
* **Processor Engine**: Logic handlers (`FormulaProcessor`) that interpret JSON instructions into code, utilizing `ItemEffectContext` for dynamic combat calculations and component iteration for stat resolution.

---

## 2. MagicComponent Metadata Reference

This schema acts as the interface between data and the C++ `EffectSystem`. Every entry is a key-value pair in the `Properties` map.

The primary goal here is **Extreme Modularity**.

* **The Problem**: If you hardcoded `Sword.OnHit()` or `Potion.OnUse()`, you would have hundreds of redundant functions, and adding a new item type would require writing new C++ classes.
* **The Solution**: By using these four classifications, the `EffectSystem` treats *every* item as a generic data packet. You can create a "Poisoned Dagger" (OnHit/Apply/Temporal) or a "Teleport Scroll" (OnUse/Move/Instant) using the exact same C++ code. The logic resides in the engine; the behavior resides in the JSON.

| Classification | Property | Value(s) | Description |
| --- | --- | --- | --- |
| **Timing** | `Trigger` | `OnEquip`, `OnUse`, `OnHit`, `Passive` | Determines *when* the engine executes the logic. |
| **Scope** | `Targeting` | `Self`, `Melee`, `Ranged`, `AOE`,  | Filters recipients before execution. |
| **Action** | `Effect` | `Add`, `Move`, `Apply` | Routes the math to the correct system. |
| **Duration** | `Persistence` | `Instant`, `Temporal`, `Permanent`, `Delayed` | Defines lifespan and lifecycle requirements. |

---

## 3. The Formula Processor (`Formulae System`)

The central "brain" for math, separating persistent stat mutations from transient calculations.

### A. Execution Modes

| Feature | Method | Goal |
| --- | --- | --- |
| **State Update** | `ExecuteUpdateStats` | Persist changes (e.g., leveling). |
| **Combat Math** | `ExecuteAction` | Get transient result (supports `ItemEffectContext`). |
| **Optimization** | `GetAttributeTotal` | Use `DirtyFlag` for `O(1)` stat retrieval. |

### B. Mathematical Execution

By utilizing a linear, distributive property, the engine processes formula operations sequentially.
**Example: `CombatAction` Calculation**

* **Logic**: `BaseWeaponDamage + WeaponBonus + (Stat * 1.5) + (SkillBonus * 2.0)`
* **JSON Definition**:

```json
"CombatAction": {
  "Operations": [
    { "Type": "Set", "Source": "BaseWeaponDamage" },
    { "Type": "Add", "Source": "WeaponBonus" },
    { "Type": "Multiply", "Source": "Stat", "Value": 1.5 },
    { "Type": "Multiply", "Source": "SkillBonus", "Value": 2.0 }
  ]
}

```

---

## 4. Modifier System & Component Architecture

The system uses `GrantedComponents` to inject behavior. Modularity means an "Iron Sword" and a "Sword of Flames" share the same `WeaponComponent` logic, with the latter gaining an additional `MagicComponent` packet.

* **Summation Logic**: Iterates over all `AttributeComponent` tags, parses `Value` strings via `std::stof()`, and adds them to the base total.
* **Weapon Dispatching**: On `OnHit` events, `WeaponAction` loops through components; if a `MagicComponent` with an `OnHit` trigger is found, it routes properties to the `EffectSystem`.

---

## 5. Optimization: The "Dirty Flag" System

To maintain high performance, avoid re-summing modifiers every frame using **Lazy Evaluation**.

* **Logic**: The cache is a nested map: `[EntityId][AttributeName] -> CacheEntry`.
* **Implementation**:

```cpp
float FormulaProcessor::GetAttributeTotal(int entityId, const std::string& attributeName) {
    CacheEntry& entry = _cache[entityId][attributeName];
    if (entry.IsDirty) {
        entry.CachedValue = ResolveTotal(entityId, attributeName);
        entry.IsDirty = false;
    }
    return entry.CachedValue; 
}

```

---

## 6. Weapons Architecture

Weapons are defined as entities holding multiple components, separating physical damage from magical effects to allow complex, stackable items.

### JSON Design (`weapons.json`)

```json
{
  "101": { 
    "Name": "Sword of Flames", 
    "Categories": { "Type": "Weapon", "Execution": "Immediate" },
    "GrantedComponents": [
      { "Tag": "WeaponComponent", "Properties": { "Damage": "10.0", "DamageType": "Physical", "Targeting": "Melee" } },
      { "Tag": "MagicComponent", "Properties": { "Trigger": "OnHit", "Targeting": "Melee", "Persistence": "Instant", "Effect": "Add", "Stat": "Health", "Value": "-15.0", "DamageType": "Fire" } }
    ]
  }
}

```

### Weapon Dispatching Logic (`WeaponAction.cpp`)

```cpp
void WeaponAction::Execute(int attackerId, int targetId) {
    int weaponId = registry.GetWeapon(attackerId);
    auto& components = registry.GetComponents(weaponId);

    // 1. Resolve Physical Damage
    float damage = GetBaseWeaponDamage(weaponId);
    HealthSystem::ApplyDamage(targetId, damage);

    // 2. Resolve Magical Effects
    for (const auto& comp : components) {
        if (comp.Tag == "MagicComponent" && comp.Properties["Trigger"] == "OnHit") {
            EffectSystem::Resolve(targetId, comp.Properties);
        }
    }
}

```

---

## 7. Modular Consumables & Accessories (Rings & Scrolls)

Rings and Scrolls function identically to weapons via `MagicComponent` packets. The engine does not distinguish between an `OnEquip` trigger (ring) and an `OnUse` trigger (scroll/potion).

### JSON Design Example

```json
// accessories.json
{
  "50": {
    "Name": "Ring of Mending",
    "GrantedComponents": [
      { "Tag": "MagicComponent", "Properties": { "Trigger": "OnEquip", "Effect": "Add", "Stat": "Health", "Value": "5.0", "Persistence": "Permanent", "Targeting": "Self" } }
    ]
  }
}

// scrolls.json
{
  "61": {
    "Name": "Scroll of Poison Cloud",
    "GrantedComponents": [
      { "Tag": "MagicComponent", "Properties": { "Trigger": "OnUse", "Effect": "Apply", "Status": "Poisoned", "Persistence": "Temporal", "Targeting": "AOE", "Duration": "10.0" } }
    ]
  }
}

```

### Dispatcher Integration (`EffectSystem.cpp`)

```cpp
void EffectSystem::Resolve(int targetId, const PropertyMap& props) {
    std::string effect = props.at("Effect");
    
    if (effect == "Add") {
        StatSystem::Apply(targetId, props.at("Stat"), std::stof(props.at("Value")));
    } 
    else if (effect == "Move") {
        MovementSystem::Teleport(targetId, props.at("Targeting"));
    }
    else if (effect == "Apply") {
        StatusSystem::Add(targetId, props.at("Status"), std::stof(props.at("Duration")));
    }
    registry.MarkDirty(targetId);
}

```

---

## 8. Status Effect Lifecycle Management

The `StatusEffectSystem` acts as the engine's "garbage collector".

* **Efficiency**: Uses `EntitySieve` (bitmask filtering) to skip healthy entities.
* **Lifecycle**: Iterates through components, subtracting `deltaTime` from `RemainingDuration`.
* **Cleanup**: Once `RemainingDuration <= 0`, the component is removed and `MarkDirty(entityId)` is called, forcing a stat recalculation.

---

## 9. Implementation Notes & Best Practices

* **Property Parsing**: Always rely on `std::stof()` to convert `Properties` strings into floats for arithmetic.
* **Decoupling**: Never hardcode item types in C++. If you need a new item type (e.g., a "Curse"), define it in JSON using standard components. The existing logic will support it automatically.
* **Targeting Scope**: For `AOE` effects (e.g., Fireball, Poison Cloud), the `ActionSystem` must perform a spatial query to populate a list of `targetIds` before calling the `EffectSystem`.
* **Stat-less Effects**: Effects like "Teleport" do not require a `Stat` property. Ensure your `EffectSystem` logic handles optional keys gracefully.
* **Trigger Uniformity**: Keep triggers (`OnHit`, `OnUse`) consistent across all types to maintain clean dispatching.
