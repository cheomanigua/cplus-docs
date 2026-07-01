# Raylib Integration

# Movement

## Point and click

### Normalization

```c
// Movement Logic (Moving toward destination)
if (isMoving) {
    Vector2 pos = {ussPasadenaPos.x, ussPasadenaPos.y};
    Vector2 dir = Vector2Subtract(destination, pos);
    float dist = Vector2Length(dir);
    
    if (dist > 2.0f) {
        dir = Vector2Scale(Vector2Normalize(dir), movementSpeed * deltaTime);
        ussPasadenaPos.x += dir.x;
        ussPasadenaPos.y += dir.y;
    } else {
        isMoving = false;
    }
}
```

### Lerp

```c
// Movement Logic (Moving toward destination)
if (isMoving) {
  // 0.1f is the interpolation factor (tweak this for speed)
  // A value of 0.1f means "move 10% of the remaining distance per frame"
  float t = 0.1f - exp(-movementSpeed * deltaTime);
  ussPasadenaPos.x = Lerp(ussPasadenaPos.x, destination.x, t);
  ussPasadenaPos.y = Lerp(ussPasadenaPos.y, destination.y, t);

  // Stop moving if close enough
  if (CheckCollisionPointCircle({ussPasadenaPos.x, ussPasadenaPos.y}, destination, 2.0f)) {
      isMoving = false;
  }
}
```

### Custom

```c
// Movement Logic (Moving toward destination)
if (isMoving) {
    float dx = destination.x - ussPasadenaPos.x;
    float dy = destination.y - ussPasadenaPos.y;
    float distance = std::sqrt(dx * dx + dy * dy);

    if (distance > 2.0f) { // Stop if close enough
        // Normalize and move
        ussPasadenaPos.x += (dx / distance) * movementSpeed * deltaTime;
        ussPasadenaPos.y += (dy / distance) * movementSpeed * deltaTime;

    } else {
        isMoving = false;
    }
}
```

* * *

# Collision

## Point in Circle

### Raylib

```c
class RadarSystem {
    public:
    static bool IsWithinRadarRange(const PositionComp& sourcePos, 
                                   const PositionComp& targetPos, 
                                   const SensorComp& radar) {
        if (!radar.isEnabled) return false;

        return CheckCollisionPointCircle(
            {targetPos.x, targetPos.y}, 
            {sourcePos.x, sourcePos.y}, 
            radar.range
        );
    }
};
```

### Custom

```c
class RadarSystem {
    public:
    static bool IsWithinRadarRange(const PositionComp& sourcePos, 
                                   const PositionComp& targetPos, 
                                   const SensorComp& radar) {
        if (!radar.isEnabled) return false;

        float deltaX = targetPos.x - sourcePos.x;
        float deltaY = targetPos.y - sourcePos.y;
        float distanceSquared = (deltaX * deltaX) + (deltaY * deltaY);
        return distanceSquared <= radar.rangeSquared;
    }
};
```
