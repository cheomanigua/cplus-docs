Understood. Here is a clean **from-scratch installation procedure**, with only the steps and commands.

 # Installing SFML 3.1.0 on Debian 13

 ## 1\. Download SFML 3.1.0

 Download:

```
SFML-3.1.0-linux-gcc-64-bit.tar.gz
```

 Place it in:

```
~/Downloads
```

 Then:

```
cd ~/Downloads
```

 ## 2\. Extract SFML

 Extract the archive:

```
tar -xzf SFML-3.1.0-linux-gcc-64-bit.tar.gz
```

 Move it to `/opt`:

```
sudo mv SFML-3.1.0 /opt/
```

 Verify:

```
ls /opt/SFML-3.1.0
```

 You should see directories such as:

```
doc
examples
include
lib
```

 ## 3\. Verify the version

 Run:

```
grep -E 'SFML_VERSION_(MAJOR|MINOR|PATCH)' \
    /opt/SFML-3.1.0/include/SFML/Config.hpp
```

 You should get:

```
#define SFML_VERSION_MAJOR      3
#define SFML_VERSION_MINOR      1
#define SFML_VERSION_PATCH      0
```

 ## 4\. Configure the runtime library path

 Create the `ldconfig` configuration:

```
echo '/opt/SFML-3.1.0/lib' | sudo tee /etc/ld.so.conf.d/sfml-3.1.0.conf
```

 ## 5\. Create the SFML library symlinks

```
cd /opt/SFML-3.1.0/lib
```

 Run:

```
sudo ln -sf libsfml-window.so.3.1.0 libsfml-window.so.3.1
sudo ln -sf libsfml-system.so.3.1.0 libsfml-system.so.3.1
sudo ln -sf libsfml-graphics.so.3.1.0 libsfml-graphics.so.3.1
sudo ln -sf libsfml-network.so.3.1.0 libsfml-network.so.3.1
sudo ln -sf libsfml-audio.so.3.1.0 libsfml-audio.so.3.1
```

 Update the dynamic linker cache:

```
sudo ldconfig
```

 Verify:

```
/sbin/ldconfig -p | grep sfml
```

 You should see:

```
libsfml-audio.so.3.1
libsfml-graphics.so.3.1
libsfml-network.so.3.1
libsfml-system.so.3.1
libsfml-window.so.3.1
```

 ## 6\. Install the SFML CMake configuration

 Create the CMake directory:

```
sudo mkdir -p /usr/local/lib/cmake
```

 Create the SFML CMake symlink:

```
sudo ln -s \
    /opt/SFML-3.1.0/lib/cmake/SFML \
    /usr/local/lib/cmake/SFML
```

 Verify:

```
ls -l /usr/local/lib/cmake/SFML
```

 ## 7\. Install library symlinks

 Run:

```
sudo ln -s /opt/SFML-3.1.0/lib/libsfml-*.so* /usr/local/lib/
```

 Verify:

```
ls -l /usr/local/lib/libsfml-*
```

 ## 8\. Install the SFML headers

 Create the include directory:

```
sudo mkdir -p /usr/local/include
```

 Create the SFML header symlink:

```
sudo ln -s \
    /opt/SFML-3.1.0/include/SFML \
    /usr/local/include/SFML
```

 Verify:

```
ls -l /usr/local/include/SFML
```

 ## 9\. Create a test project

```
mkdir -p ~/sfml-test
cd ~/sfml-test
```

 Create `CMakeLists.txt`:

```
cat > CMakeLists.txt <<'EOF'
cmake_minimum_required(VERSION 3.16)
project(sfml_test LANGUAGES CXX)

find_package(SFML 3 COMPONENTS Graphics REQUIRED)

add_executable(sfml_test main.cpp)
target_link_libraries(sfml_test PRIVATE SFML::Graphics)
EOF
```

 ## 10\. Create a test program

```
cat > main.cpp <<'EOF'
#include <SFML/Graphics.hpp>

int main()
{
    sf::RenderWindow window(
        sf::VideoMode({800, 600}),
        "SFML 3.1.0 Test"
    );

    while (window.isOpen())
    {
        while (const std::optional event = window.pollEvent())
        {
            if (event->is<sf::Event::Closed>())
                window.close();
        }

        window.clear();
        window.display();
    }
}
EOF
```

 ## 11\. Configure the project

```
cmake -S . -B build
```

 The output should contain:

```
-- Found SFML 3.1.0 in /usr/local/lib/cmake/SFML
```

 ## 12\. Build the project

```
cmake --build build
```

 The output should end with:

```
[100%] Built target sfml_test
```

 ## 13\. Run the test

```
./build/sfml_test
```

 An **800×600 black SFML window** should appear.

 ## 14\. Use SFML in future CMake projects

 For graphics:

```
find_package(SFML 3 COMPONENTS Graphics REQUIRED)

add_executable(MyApp main.cpp)

target_link_libraries(MyApp PRIVATE SFML::Graphics)
```

 For graphics and audio:

```
find_package(SFML 3 COMPONENTS Graphics Audio REQUIRED)

add_executable(MyApp main.cpp)

target_link_libraries(MyApp PRIVATE
    SFML::Graphics
    SFML::Audio
)
```

 For graphics, audio, network, and window:

```
find_package(SFML 3 COMPONENTS
    Graphics
    Audio
    Network
    Window
    REQUIRED
)

target_link_libraries(MyApp PRIVATE
    SFML::Graphics
    SFML::Audio
    SFML::Network
    SFML::Window
)
```

 Then build any future project with:

```
cmake -S . -B build
cmake --build build
```
