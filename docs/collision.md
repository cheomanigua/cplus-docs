# Collision System Architecture

The game utilizes a **Hybrid Physics Strategy**, balancing performance-critical high-throughput dynamics with high-fidelity engine-based constraints.

## 1. Physics Engine Architecture

* **Custom C++ Collision System (Fast Path)**: A high-performance, data-oriented physics layer designed to handle thousands of entities per frame. It operates outside of the Godot SceneTree to eliminate object instantiation and node-traversal overhead.
* **Godot PhysicsServer2D** & **PhysicsDirectSpaceState2D (Reliable Path)**: Used for complex, edge-case interactions and static environment collisions. While `PhysicsServer2D` manages the world state, we access its `PhysicsDirectSpaceState2D` interface to perform high-performance, headless geometric queries (raycasts, shape-casts). This allows for precise geometric resolution without the memory overhead of `PhysicsBody` nodes."

## 2. Custom C++ System: Dynamics

The custom system is designed for massive scale, targeting objects that require simple collision volume checks rather than complex physical constraints:

* **Hordes**: Character units that need to maintain separation to prevent overlap.
* **Projectiles**: High-speed entities that require per-frame position checking and immediate removal upon impact.
* **Particles**: Short-lived entities that need to react to the environment or each other without triggering expensive engine callbacks.

For that , the math models use **Circle** collision and **AABB** collision.

## 3. Collision Math Models

To ensure throughput, we utilize two primary geometric primitives chosen for their computational efficiency:

* **Circle Collision**: The primary model for dynamic entities. Calculated via `DistanceSquared` vs. `CombinedRadiusSquared`. It is the fastest collision detection method as it avoids square root calculations.
1. If `Distance < RadiusA + RadiusB`: The circles are overlapping.
2. If `Distance == RadiusA + RadiusB`: The circles are perfectly touching (kissing).
3. If `Distance > RadiusA + RadiusB`: The circles are separated.


* **AABB (Axis-Aligned Bounding Box) Collision**: Utilized for static or non-rotating assets. It compares the minimum and maximum X/Y coordinates of two rectangles, offering extremely high performance for axis-aligned geometry.
1. If the rectangles overlap on both the X axis and the Y axis: The AABBs are overlapping.
2. If the rectangles touch exactly along an edge or corner: The AABBs are perfectly touching.
3. If the rectangles are separated on either the X axis or the Y axis: The AABBs are separated.



### Code implementation

If we have this helper class with overloaded methods:

```cpp
#include <glm/glm.hpp> // Assuming GLM for Vector2 support
#include <algorithm>

namespace Source::Core::Math {

class CollisionMath {
public:
    // Circle-Circle Test: Fast squared distance comparison
    static inline bool IsOverlapping(glm::vec2 posA, float radiusA, glm::vec2 posB, float radiusB) {
        float dx = posA.x - posB.x;
        float dy = posA.y - posB.y;
        float distanceSquared = dx * dx + dy * dy;
        float radiusSum = radiusA + radiusB;
        
        return distanceSquared < (radiusSum * radiusSum);
    }

    // AABB-AABB Test: Classic overlap check for rectangular bounds
    static inline bool IsOverlapping(glm::vec2 posA, glm::vec2 halfSizeA, glm::vec2 posB, glm::vec2 halfSizeB) {
        return
            std::abs(posA.x - posB.x) < (halfSizeA.x + halfSizeB.x) &&
            std::abs(posA.y - posB.y) < (halfSizeA.y + halfSizeB.y);
    }

    // Circle vs AABB Test
    static inline bool IsOverlapping(glm::vec2 circlePos, float radius, glm::vec2 boxPos, glm::vec2 halfSize) {
        float dx = std::max(std::abs(circlePos.x - boxPos.x) - halfSize.x, 0.0f);
        float dy = std::max(std::abs(circlePos.y - boxPos.y) - halfSize.y, 0.0f);
    
        return (dx * dx + dy * dy) <= (radius * radius);
    }

    // Point-in-Circle Test: Checks if a point (posA) is within range of a circle center (posB)
    static inline bool IsPointInCircle(glm::vec2 posA, glm::vec2 posB, float radiusB) {
        float dx = posA.x - posB.x;
        float dy = posA.y - posB.y;
        float distanceSquared = dx * dx + dy * dy;
        
        return distanceSquared < (radiusB * radiusB);
    }
};

}

```

The implementation would be:

#### Circle vs Circle

```cpp
bool colliding = CollisionMath::IsOverlapping(
    transforms[i].Origin, Radius,
    transforms[j].Origin, Radius);

```

#### AABB vs AABB

```cpp
bool colliding = CollisionMath::IsOverlapping(
    transforms[i].Origin, halfSize,
    transforms[j].Origin, halfSize);

```

#### Circle vs AABB

```cpp
bool colliding = CollisionMath::IsOverlapping(
    transforms[i].Origin, Radius,
    transforms[j].Origin, halfSize);

```

#### Point in Circle

```cpp
bool inRange = CollisionMath::IsPointInCircle(
    transforms[i].Origin,           // The target (point being checked)
    transforms[j].Origin,           // The sensor (center of the radar)
    Radius);                        // The range of the sensor

```

The four implementations are not mutually exclusive. They can be used together at the same time.

### Collision Methodology Reference

| Method | Speed | Complexity | Use Case |
| --- | --- | --- | --- |
| **Circle Check** | Extremely Fast | Very Simple | High-performance dynamic objects, units, projectiles. |
| **AABB Check** | Extremely Fast | Very Simple | Static world geometry, simple trigger zones. |

## 4. Performance Optimization Techniques

The system leverages data-oriented design patterns to ensure the CPU remains cache-friendly and free of unmanaged allocation spikes:

* **Spatial Grid**: A partitioning system that divides the world into a grid of cells. Entities register their position in cells, allowing each entity to query only the 8 adjacent cells for potential collisions, reducing complexity from O(N^2) to near O(N).
* **`std::vector`** & **Custom Pools**: We utilize pre-allocated memory pools and contiguous buffers to avoid heap fragmentation and unpredictable latency.
* **Active Masking (`activeMask`)**: A bitmask or boolean array used to flag entities as active or inactive. This allows the system to skip processing for despawned or idle entities, drastically reducing the number of loop iterations per frame.

## 5. Configuration and Tuning

To maintain system stability, the following balancing factors must be monitored:

* **Grid Granularity (Cell Size)**: Must be tuned according to the average density of entities. If cells are too large, the number of checks per cell becomes a bottleneck. If cells are too small, memory overhead increases.
* **Memory Reuse (Buffer Size)**: The memory pool size must be sufficient to hold the maximum density of entities found in any 9-cell neighborhood.
* **The "Power of Two" Rule**: Ideally, `CellSize` and the memory buffer size should be powers of two to align with memory allocation patterns, optimizing both hardware cache line utilization and memory alignment.

## 6. Synchronization Strategy

To ensure your hybrid system functions as a cohesive unit, you must manage the "handshake" between the Fast Path (C++ Custom System) and the Reliable Path (PhysicsServer2D).

The bridge between your custom system and the engine's physics server should be **unidirectional for performance**:

1. **Fast Path Ownership:** Your custom system is the "Source of Truth" for dynamic entity positions during the frame.
2. **Server Update (The Bridge):** At the end of your custom physics tick, only entities that have interacted with the static world or complex assets need to be updated in the `PhysicsServer2D`.
3. **State Mapping:** Use the unique Entity ID as a key to map your C++ `Transform2D` data to the engine's body handles.

### Implementing the Synchronization Flow

To keep the two systems integrated without introducing performance bottlenecks, follow this logic flow:

* **Step 1: Custom Resolution:** Run your `CollisionSystem.Update` loop first to resolve horde and projectile movement.
* **Step 2: World Interaction Check:** After internal collisions are settled, perform a simple raycast or shape-cast using the `PhysicsServer2D` for entities that moved into proximity of static environmental geometry.
* **Step 3: State Sync:** Only for those specific entities that triggered a complex interaction, call `PhysicsServer2D.BodySetState` to force the engine to acknowledge the new position. This prevents the "ghosting" issue where the C++ system moves an entity but the engine’s static collision logic remains unaware.

### Architectural Best Practices

* **Batch Updates:** Do not update the `PhysicsServer2D` inside the `CollisionSystem` loop. Instead, collect a list of "Dirty Entities" during the collision loop and process the `PhysicsServer2D` updates in a single batch after the loop completes to minimize interop overhead.
* **Avoid Bi-directional Sync:** Never read back positions from `PhysicsServer2D` into your C++ system unless absolutely necessary. Reading from the Physics Server is an expensive operation; treat your C++ data as the master record.
* **Spatial Alignment:** Ensure your `SpatialGrid` cell dimensions align with or are multiples of any grid-based logic used by the static environment's collision shapes to minimize the number of lookups required when bridging the two systems.

By following this "Fast Path-first, bridge-later" approach, you keep the bulk of your 5000+ entities within the high-performance C++ domain, only calling upon the engine's robust but heavier physics server when the complexity of the interaction demands it.

## 7. Entity Identification Policy

The system uses a **Direct Addressing (Index-based)** pattern for `EntityId`.

### ID Allocation and Partitioning

To ensure stability at scale, `EntityId` values must be generated via a central `IdGenerator` or `IDProvider` rather than hardcoded. IDs are partitioned using **Power-of-Two** ranges to improve cache alignment and simplify entity categorization:

| Category | ID Range | Hex Offset |
| --- | --- | --- |
| **Items** | 0 – 127 | `0x000` |
| **NPCs** | 128 – 255 | `0x080` |
| **Projectiles** | 256 – 1023 | `0x100` |

#### Why the `IDProvider`?

* **Separation of Concerns:** The `Controller` should focus on *game logic* (spawning, moving, interacting). The `IDProvider` focuses on *data integrity* (guaranteeing unique, valid indices).
* **Partition Enforcement:** By using an `IDProvider`, you can cleanly enforce the Power-of-Two boundaries we discussed.
* **Testability:** You can easily swap an `IDProvider` with a "Mock" version for testing.

```cpp
class IDProvider {
private:
    int _itemPointer = 0;        // 0 to 127
    int _npcPointer = 128;       // 128 to 255
    int _projectilePointer = 256;// 256 to 1023

public:
    int GetNextItemId() { return _itemPointer++; }
    int GetNextNpcId() { return _npcPointer++; }
    int GetNextProjectileId() { return _projectilePointer++; }
};

```

#### Why Power-of-Two?

* **Bitwise Efficiency**: Modern CPUs and compilers are extremely fast with bitwise operations. Determining an entity's category becomes a simple bit-shift or bitwise AND operation.
* **Memory Alignment & Cache Locality**: Your systems are built on contiguous memory and fixed-size arrays. If your NPC data starts exactly at index 256 and your projectile data starts exactly at index 512, you ensure that your data blocks are memory-aligned.

#### Why this is a "High Performance" Choice:

* **O(1) Access**: Since `EntityId` acts as a direct index into fixed-size arrays, access is instantaneous.
* **Type Partitioning**: By partitioning ranges, we avoid ID collisions between disparate systems.
* **Cache Locality**: Power-of-two alignment ensures that data segments stay aligned with CPU cache lines, minimizing cache misses during high-throughput iterations.

### How the ID system works:

In your architecture, the `int entityId` is **not a random UUID or unique database key**; it is a **direct index** into fixed-size arrays.

* **Fixed Capacity:** You have `EngineConfig::MaxEntityCapacity` (e.g., 1024).
* **Array Mapping:** Your systems use the `entityId` as a direct array index to access component data:
* `EntityRegistry::_stats[entityId]`
* `MetadataRegistry::_metadata[entityId]`

### How to synchronize with Godot PhysicsServer2D

Since you have a predictable ID system, you can use your `entityId` as the key to your bridge:

1. **Allocate RIDs once:** When your engine starts, maintain an array `RID* _entityToRid = new RID[1024];`.
2. **Create on Demand:** When a C++ entity is "spawned", create the corresponding Godot body and store the `RID` at the index matching its `entityId`.

```cpp
// Inside your Godot Service
void RegisterEntity(int entityId, glm::vec2 position) {
    RID body = PhysicsServer2D::get_singleton()->body_create();
    PhysicsServer2D::get_singleton()->body_set_state(body, PhysicsServer2D::BODY_STATE_TRANSFORM, Transform2D(0, position));
    _entityToRid[entityId] = body; 
}

```

3. **Sync:** When your `CollisionSystem` finishes its tick, iterate over the active entities:

```cpp
// Sync only the moved entities
PhysicsServer2D::get_singleton()->body_set_state(_entityToRid[entityId], PhysicsServer2D::BODY_STATE_TRANSFORM, Transform2D(0, transforms[entityId].Origin));

```

## 8. Godot Integration

* Godot Documentation:
* [Transform2D](https://docs.godotengine.org/en/stable/classes/class_transform2d.html)
* [PhysicsServer2D](https://docs.godotengine.org/en/stable/classes/class_physicsserver2d.html)
* [PhysicsDirectSpaceState2D](https://docs.godotengine.org/en/stable/classes/class_physicsdirectspacestate2d.html)



### 8.1. Custom Dynamic Collision + Physics Queries

Dynamic collisions are entirely owned by your C++ simulation. `PhysicsServer2D` is used only for static-world queries.

### 8.2. Spatial Grid Broadphase + PhysicsDirectSpaceState2D Narrowphase

Dynamic entities are owned by your C++ simulation, but `PhysicsDirectSpaceState2D` acts as a high-performance native geometry engine for precise intersection tests.

### 8.3. Mixed Narrowphase (Custom + PhysicsDirectSpaceState2D)

The recommended default: simple entities (bullets, mobs) use custom C++ math; complex entities (bosses, complex hitboxes) delegate to `PhysicsDirectSpaceState2D`.

### Comparison

| Feature | 8.1 | 8.2 | 8.3 |
| --- | --- | --- | --- |
| Broadphase | Spatial Grid | Spatial Grid | Spatial Grid |
| Narrowphase | Custom C++ | `PhysicsDirectSpaceState2D` | Mixed (Custom + `PhysicsDirectSpaceState2D`) |
| Performance | Fastest | Slightly slower | Near 8.1 |
| Flexibility | Moderate | High | Highest |

### Cheatsheet: When to use each

| Architecture | Dynamic Collision | Static Collision |
| --- | --- | --- |
| **8.1** | All custom C++ | PhysicsServer2D |
| **8.2** | All PhysicsDirectSpaceState2D | PhysicsServer2D |
| **8.3** | Custom C++ (simple), `PhysicsDirectSpaceState2D` (complex) | PhysicsServer2D |
