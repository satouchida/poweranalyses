# PowerAnalyses for Local Environments

## Important Note
This is a modified fork of the original poweranalyses.org web application. The core application was created by the original developers, and this repository adapts it into a native macOS application using Tauri. These modifications were co-authored with the Gemini 3.1 Pro for personal use. In accordance with the GNU General Public License v2.0 (GPL-2.0), this modified version and its source code are distributed under the same license terms.

**DISCLAIMER**
> DO NOT CONTACT THE ORIGINAL DEVELOPER FOR ANY ISSUES REGARDING TO THIS FORK.
> If you have any issues with this fork, please submit a pull request on this repository.
## Why this app?

[G*Power](https://www.psychologie.hhu.de/arbeitsgruppen/allgemeine-psychologie-und-arbeitspsychologie/gpower) is a powerful and widely used tool for power analyses, but it is outdated and not supported on newer models with Apple Silicon. This app is a native macOS application that is built on top of [poweranalyses.org](https://poweranalyses.org). 
I also added support for arm64 Windows machines (Snapdragon X series processor) and android devices/Chromebooks. It is open-source and free to use while making all powerful stats available without internet access.

## macOS Installation

macOS may display a warning that the app "is damaged and can't be opened" because the app is not signed with an Apple Developer certificate, which costs 99 USD per year. To resolve this, either:

1. **Download the `.dmg.zip`** from the [Releases](../../releases) page instead of the raw `.dmg`. Extracting the zip removes the quarantine flag.
2. Or **remove the quarantine attribute manually** after mounting the `.dmg`:
   ```sh
   xattr -cr /Applications/poweranalyses.app
   ```

## poweranalyses.org

Developed by [Rik Huijzer](https://github.com/rikhuijzer), and repository available on [GitHub Organization Repo](https://github.com/tla-org/poweranalyses).

Statistical power analyses in the browser via R's nmath library and WebAssembly.

## License

The favicon is obtained from Flaticon (https://www.flaticon.com/free-icon/statistics_4064965).

## Developer notes

> **This work is a fork of the original poweranalyses.org web application. The core application was created by [Rik Huijzer](https://github.com/rikhuijzer), and repository available on [GitHub Organization Repo](https://github.com/tla-org/poweranalyses). Without their work, this project would not exist.**

Going via emscripten because we link a C library.

A big thanks to https://github.com/rustwasm/team/issues/291#issuecomment-644946504 for writing down how to build a C library to WebAssembly via Rust.

For local development, checkout the `justfile`.

To see the changes live, run
```sh
$ just serve
```

To only build the site, run
```sh
$ just build
```

To run the backend tests (Rust), run

```sh
$ cargo test
```

Or use `cargo watch` to run the tests automatically when you make changes.

```sh
$ cargo watch -x "test"
```

### ✅ Completed Features
- [ ] **Add Exact tests:** Add Fisher's exact test, etc.
- [x] **Material 3 UI Migration:** Sleek, modern interface with consistent design tokens.
- [x] **Interactive Power Curves:** Dynamic visualizations using Chart.js.
- [x] **Monte Carlo Simulation:** Robust simulation engine for empirical power analysis.
- [x] **Built-in Effect Size Calculator:** Tools for converting various statistics to Cohen's d, f, etc.
- [x] **Export & Reporting:** CSV/TSV export and "Copy Table" functionality.
- [x] **Accessibility:** WCAG compliant structure and keyboard navigation.

### 🟡 Future Plans (Medium/Low Priority)
- [ ] **Dark Mode & Theming:** Support for dark mode with system preference detection.
- [ ] **Internationalization (i18n):** Multi-language support.
- [ ] **Advanced Models:** Support for multi-factor mixed models.

