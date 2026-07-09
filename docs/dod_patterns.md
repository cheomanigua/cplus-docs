# Design Patterns

Most of the "Gang of Four" (GoF) patterns were designed to solve problems specifically created by the constraints of Object-Oriented Programming (OOP): namely, managing complex inheritance hierarchies, object lifetimes, and tightly coupled object interactions.

When you move to **Data-Driven Design (DDD)**, **Data-Oriented Design (DoD)**, and **ECS**, the problems those patterns solve often disappear, or they become "anti-patterns."



### Why GoF Patterns Clash with Your Stack

* **Inheritance vs. Composition:** GoF patterns like *Strategy*, *Decorator*, and *Template Method* rely heavily on inheritance or interface abstraction. In ECS, you don't inherit; you compose by adding components.
* **Encapsulation:** GoF patterns emphasize hiding data inside objects behind methods. DoD explicitly wants data to be exposed, contiguous, and accessible so that systems can transform it efficiently.
* **Method Dispatch:** GoF patterns often involve polymorphism (virtual functions). In DoD, virtual functions are "performance killers" because they break cache locality and prevent the CPU from predicting branches correctly.



### How Patterns Morph in Your Architecture

While you don't apply the GoF patterns *as written*, you will find that the *underlying intent* of those patterns is still necessary, but implemented through data manipulation instead of object interaction.

| GoF Pattern | The OOP Problem | The ECS / DoD Equivalent |
| --- | --- | --- |
| **Strategy** | Swapping object behavior via inheritance. | **Component Selection:** Swap data structures or change which system processes an entity. |
| **Observer** | Objects reacting to state changes. | **State/Flag Polling:** Systems check components (like `DirtyFlags`) during their update tick. |
| **Command** | Encapsulating requests as objects. | **Command Buffers:** An array of structs containing data to be processed by a system later. |
| **Flyweight** | Sharing common state to save memory. | **Data Component Reuse:** The fundamental nature of ECS. |
| **Singleton** | Ensuring one global instance. | **Global Resource Tables:** A static struct or a dedicated "Resource" entity/component. |



### A Different Way to Think About "Patterns"

In your architecture, you aren't looking for "Design Patterns"; you are looking for **"Data Access Patterns."**

1. **The "Pipeline" Pattern:** Instead of the *Chain of Responsibility*, you have a pipeline of systems that transform a specific set of components.
2. **The "SoA" (Structure of Arrays) Pattern:** The core of DoD. Instead of an array of objects, you maintain separate arrays for each component type to maximize cache hits.
3. **The "Double Buffer" Pattern:** Essential for ECS/DoD game loops. You write all state changes to a "Next Frame" buffer and read from the "Current Frame" buffer to ensure thread safety and state consistency.

### When to ignore the GoF

If you find yourself writing a "Factory" to create an entity, or a "Visitor" to traverse your component hierarchy, stop.

* **Factories** in ECS are usually just a simple function that initializes a set of POD (Plain Old Data) structs.
* **Visitors** are usually replaced by simple `for` loops iterating over component arrays.

**The Golden Rule for your stack:** If a design pattern requires a `virtual` keyword, a `base class`, or a `pointer-to-an-object`, it is likely fighting against your Data-Oriented architecture.
