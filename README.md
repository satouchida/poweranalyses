# poweranalyses for Apple Silicon

## Important Note
This is a modified fork of the original poweranalyses.org web application. The core application was created by the original developers, and this repository adapts it into a native macOS application using Tauri. These modifications were made with the assistance of an AI tool (Gemini) for personal use. In accordance with the GNU General Public License v2.0 (GPL-2.0), this modified version and its source code are distributed under the same license terms.

**DISCLAIMER**
> DO NOT CONTACT TO ORIGINAL DEVELOPERS FOR ANY ISSUES WITH THIS FORK.
> If you have any issues with this fork, please open an issue in this repository.

# poweranalyses.org

Statistical power analyses in the browser via R's nmath library and WebAssembly.

## License

The favicon is obtained from Flaticon (https://www.flaticon.com/free-icon/statistics_4064965).

## Developer notes

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
