# Setup

# Project structure

```
root/
├── build/
│   └── Makefile
├── include/
├── src/
└── CMakeList.txt
```

# Makefile

```Makefile
CXX = g++
TARGET = MyApp

CXXFLAGS = -O2 -Wall -std=c++20 -g
LIBS = -lraylib -lm -lpthread -ldl -lrt

SRCS = main.cpp

$(TARGET): $(SRCS)
	$(CXX) $(CXXFLAGS) $(SRCS) -o $(TARGET) $(LIBS)

clean:
	rm -f $(TARGET)
```

# CMakeLists.txt

```Makefile
cmake_minimum_required(VERSION 3.10)

# Project name
project(DataDrivenEngine VERSION 1.0)

# C++ Standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

#  # Optimization Flags for Performance
#  if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
#      # -O3: Enables aggressive optimization
#      # -march=native: Optimizes for your specific CPU
#      # -fopt-info-vec-optimized: Triggers reports on vectorization
#      set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -march=native -fopt-info-vec-optimized")
#  endif()

# 1. Define include directories
# This allows you to include headers like #include "Engine/EntityRegistry.hpp"
include_directories(include)
include_directories(include/Core)
include_directories(include/Engine)
include_directories(external)

# 2. Gather all source files recursively from the src folder
file(GLOB_RECURSE SOURCES "src/*.cpp")

# 3. Create the executable
add_executable(${PROJECT_NAME} ${SOURCES})

# 4. Link Raylib
# This assumes Raylib is installed on your system.
# If you built Raylib manually, you may need to use target_link_libraries 
# with the path to the library file.
find_package(raylib REQUIRED)
target_link_libraries(${PROJECT_NAME} PRIVATE raylib)

#  # On Linux, you often need these extra system libraries to support Raylib
#  if(UNIX AND NOT APPLE)
#      target_link_libraries(${PROJECT_NAME} PRIVATE m pthread dl rt X11)
#  endif()
```

# gdb debugger

If you compiled with the `-g` flag, your executable contains debug symbols, which allows a debugger like **GDB** to show source code, variable names, and line numbers.

Also, it is recommended to compile with the `-O0` flag for better debugging.

#### Source Code Example

```cpp
#include <iostream>

void printFoo(int foo)
{
    std::cout << foo << '\n';
}

int main()
{
    printFoo(5);

    return 0;
}
```

#### Compiling

```bash
g++ -g -O0 -Wall -std=c++20 main.cpp -o MyApp
```

#### Start GDB

```bash
gdb ./MyApp
```

#### Debugging Worflow Example

```bash
(gdb) break main    // Set up a break point in main()
(gdb) run           // Run the program. It will stop in the next break (in this case main())
(gdb) step          // Step into main()
(gdb) print foo     // Print value of foo
(gbd) next          // continue stepping
(gdb) finish        // stop stepping
```

#### Quit

```bash
(gdb) quit
```

### If the program crashes

Simply run it under GDB:

```bash
gdb ./MyApp
(gdb) run
```

When it crashes:

```bash
(gdb) bt
```

The backtrace often immediately identifies where the crash occurred.

### Useful compilation flags

For the best debugging experience, compile with optimizations disabled:

```bash
g++ -g -O0 -o MyApp *.cpp
```

Using `-O0` prevents the compiler from optimizing away variables or rearranging code, making stepping through the program much more intuitive.

### Common GDB commands

| Command               | Purpose                                         |
| ------------------    | ------------------------                        |
| `run ./MyApp`         | Start the program                               |
| `break main`          | Set breakpoint at `main`                        |
| `break func`          | Break at function                               |
| `break myfile.cpp:42` | Break at source line                            |
| `watch <var>`         | Break when `var` changes                        |
| `print <var>`         | Print variable                                  |
| `display <var>`       | Display variable automatically after every stop |
| `next` (`n`)          | Step over function                              |
| `step` (`s`)          | Step into function                              |
| `continue` (`c`)      | Continue execution                              |
| `backtrace` (`bt`)    | Show call stack                                 |
| `frame 2`             | Inspect a particular frame                      |
| `info locals`         | Show local variables                            |
| `info args`           | Show function arguments                         |
| `info threads`        | Examine threads                                 |
| `thread 2`            | Switch to another thread                        |
| `list` (`l`)          | List source code                                |
| `quit`                | Exit GDB                                        |

If you're using an IDE such as VS Code, CLion, or Visual Studio, they typically use GDB (or LLDB) under the hood and provide a graphical interface for breakpoints, stepping, and variable inspection.

# NeoVim

Click [here](https://drive.google.com/file/d/1FS6qQY4SxiBH6DO-X9lQQG2sbQMyQPuO/view?usp=drive_link) to get a full `init.lua` file.

If you want to use a language server, you must follow the steps below.

### 1. Install `clangd`
```bash
sudo apt install clangd
```

### 2. Generate `compile_commands.json`

- You must have a `CMakeList.txt` in your project's root directory
- You must have a `build/` directory

```bash
cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
ln -sf build/compile_commands.json .
```

### 3. Edit `.config/nvim/init.lua`

Add this block:

```lua
-- ============================================================================
-- C/C++ LSP (clangd)
-- ============================================================================
vim.api.nvim_create_autocmd("FileType", {
    pattern = { "c", "cpp", "h", "hpp" },
    callback = function(args)
        if vim.lsp.get_clients({ bufnr = args.buf })[1] then
            return
        end

        local root = vim.fs.root(args.buf, {
            "compile_commands.json",
            ".git",
        })

        if not root then
            return
        end

        vim.lsp.start({
            name = "clangd",
            cmd = { "clangd" },
            root_dir = root,
        })
    end,
})
```
