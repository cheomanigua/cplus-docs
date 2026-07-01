# Event Dispatching System with `std::function`

### Summary of terminology shift

| C# Term | C++ Equivalent/Preferred Term |
| --- | --- |
| **Delegate** | Function Pointer / Callable Object |
| **Event** | Dispatcher / Observer / Callback List |
| **Subscribe** | Register / Bind |
| **Broadcast** | Dispatch / Invoke / Notify |

A common C++ pattern is to return a "Connection" ID or use a registration system. Here is the refactored, production-ready documentation:

## Declaration

In C++, `std::function` is used to store callable objects. Since events often have multiple listeners, we group them into a collection. To support unsubscription, we assign each listener a unique ID.

### Action

An Action-style event (no return value) is represented as a list of functions.

```cpp
// Equivalent to Action<std::string>
struct ActionEvent {
    std::unordered_map<int, std::function<void(std::string)>> listeners;
    int next_id = 0;

    int subscribe(std::function<void(std::string)> callback) {
        listeners[next_id] = callback;
        return next_id++;
    }

    void unsubscribe(int id) { listeners.erase(id); }

    void broadcast(std::string data) {
        for (auto const& [id, callback] : listeners) callback(data);
    }
};

```

### Func

A Func-style event (returns a value) is typically a single slot or a system that aggregates results.

```cpp
// Equivalent to Func<int, bool>
std::function<bool(int)> MyEvent;

```

---

## Event Manager

We create an event manager to handle global events. By using unique IDs for subscriptions, we ensure we can clean up memory and prevent dangling pointers when nodes are destroyed.

`EventManager.h`

```cpp
#include <functional>
#include <unordered_map>
#include <string>

class EventManager
{
public:
    static std::unordered_map<int, std::function<void()>> AttributeChangeListeners;
    static int AttributeChangeCounter;

    static int SubscribeAttributeChange(std::function<void()> callback) {
        AttributeChangeListeners[AttributeChangeCounter] = callback;
        return AttributeChangeCounter++;
    }

    static void UnsubscribeAttributeChange(int id) {
        AttributeChangeListeners.erase(id);
    }

    static void BroadcastAttributeChange() {
        for (auto const& [id, callback] : AttributeChangeListeners) callback();
    }
};

```

`Stats.cpp`

```cpp
class Stats : public godot::Label
{
    int connection_id = -1;

    void _ready() override {
        connection_id = EventManager::SubscribeAttributeChange([this]() { 
            OnAttributeChange(); 
        });
    }

    void _exit_tree() override {
        // Safe removal using our connection ID
        EventManager::UnsubscribeAttributeChange(connection_id);
    }

    void OnAttributeChange() {
        // Implementation logic
    }
};

```

`EventsLabel.cpp`

```cpp
class EventsLabel : public godot::Label
{
    // Implementation following the same subscription ID pattern
};

```

`Player.cpp`

```cpp
void Player::Shoot()
{
    if (Ammo > 0)
    {
        Ammo -= 1;
        EventManager::BroadcastAttributeChange();
    }
    else
    {
        EventManager::BroadcastMessage("Ammo depleted!");
    }
}

```

## Connection Struct Pattern

To simplify managing subscriptions in C++, you can use the **RAII (Resource Acquisition Is Initialization)** pattern. By creating a `Connection` struct that holds the ID and the reference to the manager, you can ensure that unsubscription happens automatically when the object goes out of scope or is destroyed.

Instead of manually keeping track of an `int` ID, you return a `Connection` object. When this object is destroyed (e.g., when the `Stats` class node is freed), its destructor automatically calls the unsubscription method.

#### 1. The Connection Class

This class acts as a handle to the subscription.

```cpp
class Connection {
    int id;
    std::function<void(int)> unsubscribe_func;

public:
    Connection(int id, std::function<void(int)> unsub) : id(id), unsubscribe_func(unsub) {}
    
    // Destructor: Automatically triggers unsubscription when this goes out of scope
    ~Connection() {
        if (unsubscribe_func) {
            unsubscribe_func(id);
        }
    }

    // Prevent accidental copying to avoid double-unsubscription
    Connection(const Connection&) = delete;
    Connection& operator=(const Connection&) = delete;
    
    // Allow moving
    Connection(Connection&&) = default;
};

```

#### 2. Updated Event Manager

The manager now returns a `Connection` object, which encapsulates the lifecycle of the subscription.

```cpp
class EventManager {
public:
    static std::unique_ptr<Connection> SubscribeAttributeChange(std::function<void()> callback) {
        int id = AttributeChangeCounter++;
        AttributeChangeListeners[id] = callback;

        // Return a Connection that knows how to unsubscribe using the ID
        return std::make_unique<Connection>(id, [](int id) {
            EventManager::AttributeChangeListeners.erase(id);
        });
    }
};

```

#### 3. Simplified Implementation in Stats.cpp

By storing the `Connection` as a member variable, you no longer need to write custom logic in `_exit_tree`.

```cpp
class Stats : public godot::Label {
    // When Stats is destroyed, connection is destroyed, 
    // triggering automatic unsubscription.
    std::unique_ptr<Connection> connection;

    void _ready() override {
        connection = EventManager::SubscribeAttributeChange([this]() {
            OnAttributeChange();
        });
    }
    
    // No need to manually call Unsubscribe in _exit_tree!
};

```

### Why this is effective:

* **Safety**: It prevents memory leaks and dangling pointers by ensuring cleanup is tied to the lifetime of the `Stats` object.
* **Readability**: It removes the "bookkeeping" code from your `_ready` and `_exit_tree` methods.
* **Encapsulation**: The logic for "how to unsubscribe" is kept within the `EventManager` or the `Connection` definition, rather than being scattered throughout your UI classes.


## Connection Pattern with Arguments

To adapt the `Connection` pattern for events that pass arguments, you must ensure the `Connection` class remains generic so it can handle any function signature. We do this by using a template or by keeping the `unsubscribe` logic focused on the `id`, while the `std::function` handles the specific payload.

### Adapting the Pattern for Arguments

Since the `Connection`'s job is only to hold an ID and trigger a cleanup, it doesn't need to know about the arguments the event passes. It only needs to know how to call the `EventManager`'s `erase` function.

#### 1. The Generic Connection Class

We keep the `Connection` class as is, but we ensure the `EventManager` provides a specific lambda for each type of event.

```cpp
class Connection {
    int id;
    std::function<void(int)> unsubscribe_func; // This logic remains generic

public:
    Connection(int id, std::function<void(int)> unsub) : id(id), unsubscribe_func(unsub) {}
    ~Connection() { if (unsubscribe_func) unsubscribe_func(id); }

    Connection(const Connection&) = delete;
    Connection& operator=(const Connection&) = delete;
    Connection(Connection&&) = default;
};

```

#### 2. Updated EventManager with Arguments

You can create a specific registration method for events that require arguments (like `std::string`).

```cpp
class EventManager {
public:
    // For events with string arguments
    static std::unordered_map<int, std::function<void(std::string)>> MessageListeners;
    static int MessageCounter;

    static std::unique_ptr<Connection> SubscribeMessageEvent(std::function<void(std::string)> callback) {
        int id = MessageCounter++;
        MessageListeners[id] = callback;

        return std::make_unique<Connection>(id, [](int id) {
            EventManager::MessageListeners.erase(id);
        });
    }

    static void BroadcastMessage(std::string message) {
        for (auto const& [id, callback] : MessageListeners) {
            callback(message);
        }
    }
};

```

#### 3. Simplified Implementation in EventsLabel.cpp

Now, your UI class can subscribe to the `MessageEvent` simply by providing the callback, without worrying about manually cleaning up the subscription.

```cpp
class EventsLabel : public godot::Label {
    std::unique_ptr<Connection> connection;

    void _ready() override {
        // The lambda captures 'this' to access set_text
        connection = EventManager::SubscribeMessageEvent([this](std::string msg) {
            set_text(msg.c_str());
        });
    }
    // Cleanup is automatic!
};

```

### Why this works for arguments:

* **Decoupling**: The `Connection` object does not need to know the signature of the event; it only needs to know how to trigger the `erase` operation.
* **Flexibility**: You can create `Subscribe` methods for any signature (e.g., `void(int)`, `void(float, float)`) by simply providing a unique `std::unordered_map` and a corresponding `MessageCounter`.
* **Safety**: Because each `std::unique_ptr<Connection>` is a member of the class that consumes the event, the subscription is guaranteed to be removed the moment the object (the UI label) is destroyed.
