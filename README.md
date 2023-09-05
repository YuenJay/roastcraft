# Tauri + Solid + Typescript

This template should help get you started developing with Tauri, Solid and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)


# windows setup
## 1. install visual c++ build tools
https://visualstudio.microsoft.com/visual-cpp-build-tools/

ensure "C++ build tools" and the "Windows 10 SDK" are selected.

## 2. install rust
https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe

## 3. install create-tauri-app and tauri-cli
cargo install create-tauri-app --locked
cargo install tauri-cli

# 4. install node
https://nodejs.org/en/download

# 5. install pnpm using powershell
iwr https://get.pnpm.io/install.ps1 -useb | iex

# 6. install node_modules
pnpm install

# 7. run app
cargo tauri dev


