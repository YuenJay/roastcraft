[Roastcraft](https://roastcraft.app/)
==========

Roastcraft is a cross-platform software to log and analyze coffee roasting, much like the amazing [Artisan](https://artisan-scope.org/), but implemented in modern Web Technology

![](https://raw.githubusercontent.com/chihpingkuo/roastcraft/main/web_assets/screen_shot_2024_01_16_104349.png)

# Instruction
## Windows, using TASI TA612C thermometer for example
1. download "roastcraft.exe"
2. download /machines/tasi/ta612c.toml, put it in the same folder with "roastcraft.exe"
3. rename "ta612c.toml" to "roastcraft.toml"
4. change port setting in "roastcraft.toml", and other settings, if necessary
5. double click "roastcraft.exe" to execute

# Features
## small footprint (~10mb)
  - single, standalone executable
  - config with [TOML](https://toml.io/) 

## interactive roast chart
  - move mouse cursor to show data (Bean temp, ROR, etc.) in specific time

## supported roaster
  - Kapok K501

## supported meter 
  - TASI TA612C thermometer

## supported microcontroller unit (developing)
  - Raspberry Pi Pico W with max6675

## cross-platform
  - Windows
  - Linux (developing)
  - MacOS (developing)

# Web stack
- [Tauri](https://tauri.app/)
- [Solid.js](https://www.solidjs.com/)
- [D3.js](https://d3js.org/)
- [TailwindCSS](https://tailwindcss.com/)


