# Design Patterns for Game Development

This documentation breaks down design patterns into two distinct sections: **Classical Design Patterns**—foundational templates derived from Object-Oriented software engineering—and **ECS-Friendly Design Patterns**—re-engineered templates that leverage C++ high-performance low-level memory constructs like `struct`, `reference`, `const`, and `std::span` to maintain continuous memory data locality and eliminate cache misses.

---

# Classical Design Patterns

## 1. Abstract Factory Pattern

* **Best For:** Creating families of related components or objects without tying your execution pipeline to concrete runtime implementation classes.
* **How It Works:** Your execution systems rely entirely on an interface contract (`IWeaponFactory`). This ensures you can seamlessly alter weapon blueprints, configurations, or engine representations dynamically without modifying your core simulation loop.

```cpp
class IWeaponBehavior { public: virtual ~IWeaponBehavior() = default; };
class LaserBehavior : public IWeaponBehavior {};
class MissileBehavior : public IWeaponBehavior {};

class IWeaponFactory {
public:
    virtual ~IWeaponFactory() = default;
    virtual std::unique_ptr<IWeaponBehavior> CreateLaserBehavior() = 0;
    virtual std::unique_ptr<IWeaponBehavior> CreateMissileBehavior() = 0;
};

class GameWeaponFactory : public IWeaponFactory {
public:
    std::unique_ptr<IWeaponBehavior> CreateLaserBehavior() override { return std::make_unique<LaserBehavior>(); }
    std::unique_ptr<IWeaponBehavior> CreateMissileBehavior() override { return std::make_unique<MissileBehavior>(); }
};

```

## 2. Command Pattern

* **Best For:** Encapsulating specific operational behavior rules into standalone, transactional data capsules to eliminate hard-coded function dependencies.
* **How It Works:** Every simulation shift or input action implements a uniform command blueprint. This decouples the system invoking an action from the objects being manipulated, enabling replay recordings, historical fast-forwarding, or immediate single-shot evaluation.

```cpp
struct ShipData { int ShieldHealth; };

class ICommand {
public:
    virtual ~ICommand() = default;
    virtual void Execute(ShipData& ship) = 0;
};

class RepairShieldCommand : public ICommand {
    int _amount;
public:
    RepairShieldCommand(int amount) : _amount(amount) {}
    void Execute(ShipData& ship) override {
        ship.ShieldHealth += _amount;
    }
};

```

## 3. Strategy Pattern

* **Best For:** Varying or swapping an object's operational algorithms or modes at runtime without altering the physical structures using them.
* **How It Works:** You isolate an algorithm into its own execution class interface. The calling context retains a reference pointer to that interface and triggers its functionality polymorphically.

```cpp
class IFireStrategy {
public:
    virtual ~IFireStrategy() = default;
    virtual void Fire(int weaponEntityId) = 0;
};

class LaserFireStrategy : public IFireStrategy {
public:
    void Fire(int weaponEntityId) override { std::cout << "Entity " << weaponEntityId << " fired Lasers!" << std::endl; }
};

class WeaponSubsystem {
    std::unique_ptr<IFireStrategy> activeFireStrategy;
public:
    void SetFireStrategy(std::unique_ptr<IFireStrategy> strategy) { activeFireStrategy = std::move(strategy); }
    void ExecuteAttack(int entityId) { if(activeFireStrategy) activeFireStrategy->Fire(entityId); }
};

```

## 4. Prototype Pattern

* **Best For:** Creating copies or instances of complex configuration archetypes by cloning an existing blueprint rather than recalculating parsing loops from scratch.
* **How It Works:** An object exposes a deep cloning operation. The runtime environment duplicates this configuration template and alters only the distinct properties that are unique to the new instance.

```cpp
template <typename T>
class IPrototype {
public:
    virtual ~IPrototype() = default;
    virtual std::unique_ptr<T> Clone() const = 0;
};

class ShipPreset : public IPrototype<ShipPreset> {
public:
    std::string HullIdentifier;
    int MaxShieldCapacity;
    
    std::unique_ptr<ShipPreset> Clone() const override {
        return std::make_unique<ShipPreset>(*this);
    }
};

```

---

# ECS-Friendly Design Patterns

When building an Entity Component System (ECS), using standard managed polymorphic objects introduces heap fragmentation and pointer indirection that scatter your data randomly, triggering catastrophic CPU cache misses.

To preserve **Data Locality**, components must be written as **plain old data (POD) structures** stored inside sequential, contiguous arrays (e.g., `std::vector`). Systems then iterate across these structures using `std::span<T>` for zero-allocation memory window sub-setting, references (`&`) to mutate sequential structs directly in-place without stack copies, and `const` references to read data at maximum hardware speed safely.

## 1. Flyweight Pattern

* **Best For:** Eliminating memory consumption and performance degradation when processing thousands of active components that share heavy configuration metadata profiles.
* **How It Works:** Component data is divided strictly into **Intrinsic state** (shared, read-only static parameters stored once in a lookup collection) and **Extrinsic state** (lightweight, value-type variables unique to that entity instance).

```cpp
// Intrinsic Data Footprint: Asset cached once globally
struct WeaponDefinition { std::string SpritePath; float BaseCooldown; };

// Extrinsic Data Footprint: Pure POD struct packed continuously inside ECS vectors
struct WeaponComponent {
    int EntityId;
    int DefinitionIndex; // Direct index pointer to the shared Flyweight asset array
    float CurrentCooldownTimer;
};

```

## 2. Observer Pattern (Signals / Events)

* **Best For:** Syncing raw data mutations computed by background simulation systems with rendering frameworks without polluting the data layer with visual dependencies.
* **How It Works:** Instead of heavy observer objects, an ECS-friendly observer registers structural dirty states or queues events inside specialized reactive ring buffers that visual systems process sequentially at the end of a simulation frame.

```cpp
struct ShieldComponent {
    int CurrentShields;
    bool IsDirty; // Structural flag monitored by reactive Viewport systems
};

class VisualSyncSystem {
public:
    void UpdateVisuals(std::span<ShieldComponent> shields, std::span<GodotShieldNode*> viewNodes) {
        for (size_t i = 0; i < shields.size(); i++) {
            // Read by reference, preventing any copy overhead
            const auto& shield = shields[i]; 
            if (shield.IsDirty) {
                viewNodes[i]->UpdateProgressBar(shield.CurrentShields);
            }
        }
    }
};

```

## 3. Component Tag Pattern (The High-Performance "State" Alternative)

* **Best For:** Implementing dynamic entity states, behaviors, or group classifications without introducing processor branch mutations (`if/else` or `switch` blocks) inside execution loops.
* **How It Works:** Instead of using state classes or enum values inside a data component, states are represented by **empty structs (Tags)**. Systems query specific memory chunks containing only entities that possess the required tag struct, ensuring linear execution pipelines across uniform arrays.

```cpp
// Zero-sized structural tags used solely for system filtering boundaries
struct AggressiveTag {};
struct EvadingTag {};

struct AggressiveMovementSystem {
    // This system processes a dense memory span containing ONLY entities with the AggressiveTag
    void Update(std::span<PositionComponent> positions, std::span<AggressiveTag> tags) {
        for (auto& pos : positions) {
            pos.X += 1.5f; // Pure, unbranched stream execution optimized for CPU pipelining
        }
    }
};

```

## 4. Mediator Pattern

* **Best For:** Managing communication pipelines between fully separate simulation managers or job systems while maintaining absolute decoupling across structural data frameworks.
* **How It Works:** Systems do not reference or call into other systems. Instead, systems write simple data structures (events) into native, unmanaged transaction buffers or message queues. A central mediator dispatcher drains these buffers and routes the slices to dependent processing pipelines.

```cpp
struct CollisionEvent {
    int EntityA;
    int EntityB;
};

class SystemMessageMediator {
    std::vector<CollisionEvent> _collisionQueue;
public:
    void BroadcastCollision(const CollisionEvent& evt) { _collisionQueue.push_back(evt); }
    std::span<CollisionEvent> FetchCollisions() { return _collisionQueue; }
    void ClearChannels() { _collisionQueue.clear(); }
};

```

---

### Summary of Performance Architecture Fit

| Pattern | Where it Lives | C++ Implementation Engine | Performance Advantage |
| --- | --- | --- | --- |
| **Flyweight** | Model / Registry | `struct` + `int` indices into arrays | Eliminates dynamic allocation and minimizes memory footprint. |
| **Observer** | Engine Boundaries | `std::span<T>` + dirty bits | Alerts viewports while ensuring model data arrays remain flat and dense. |
| **State** | Behavior Systems | `enum` or Tag components | Maximizes CPU instruction pipelining by grouping identical state behaviors. |
| **Mediator** | System Controllers | `std::vector` transaction buffers | Stops interconnected systems from tangling without pointer/virtual overhead. |
