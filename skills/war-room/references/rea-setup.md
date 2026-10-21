# REA setup — the `run.evidence` walkthrough

Read this when the operator opts into `run.evidence` in `/war-room` step 2 (the ADR 0042 pointer
on that row). It covers the install, the providers, the env rule per shell, the verification
command, and the presence check. The evidence lens is offered only when `run.evidence` is on AND
the presence check passes (plan `2026-10-20-rea-artifact-evidence` D20, G1). Walk the operator
through the sections in order; stop at the first one they cannot complete and record REA as
absent for this run.

## Install

1. Register REA with the agent client: `npx rea-agents setup --client <id>`. `<id>` is the client
   id (for example `claude_code`); repeat `--client` for more than one client. The registration
   carries the provider env (`GHIDRA_INSTALL_DIR`, `JAVA_HOME`, `REA_JADX_MCP_JAR`,
   `REA_ADB_PATH`) inside the MCP server entry, so the MCP path never depends on the shell's env.
2. Confirm the CLI answers: `rea --version`.

## Providers

Install only the providers the plan's artifacts need. The `provider` field of each
`**Target artifacts**` row names it.

- **Ghidra** (native binaries): Ghidra 12.1.x plus a JDK ≥ 21. Export `GHIDRA_INSTALL_DIR` to the
  install directory and `JAVA_HOME` to the JDK. macOS native build step: the macOS download ships
  no decompiler binary, so run `cd "$GHIDRA_INSTALL_DIR/support/gradle" && ./gradlew buildNatives`
  once (the wrapper needs network; a local `gradle buildNatives` works offline). The doctor row
  `ghidra-native_decompiler` turns ok after it.
- **JADX** (Android): the JADX MCP bridge jar 0.7.1 (`jadx-headless-mcp-0.7.1-all.jar`). Export
  `REA_JADX_MCP_JAR` to its absolute path. It needs the same JDK.
- **adb** (device inspection): the platform-tools `adb` binary. Export `REA_ADB_PATH` to its
  absolute path. REA 6.5.0's doctor carries no adb row; confirm the binary with
  `"$REA_ADB_PATH" version`.

## The env rule per shell

The seat shells and the presence check are non-interactive. An export that lives only in an
interactive rc file is invisible there: the `rea` CLI fallback fails in a seat shell while the
MCP path still works, because the registration carries its own env. Put the exports where every
shell reads them:

- **zsh**: `~/.zshenv`, never only `~/.zshrc` (zsh reads `~/.zshrc` for interactive shells only).
- **bash**: `~/.bashrc`, sourced from `~/.bash_profile` for login shells, plus
  `export BASH_ENV=~/.bashrc` so a non-interactive `bash -c` reads it too.
- **fish**: `set -gx NAME value` lines in `~/.config/fish/conf.d/rea.fish`.

The four exports are `GHIDRA_INSTALL_DIR`, `JAVA_HOME`, `REA_JADX_MCP_JAR` and `REA_ADB_PATH`.
Export only the ones the installed providers need.

## Verify

Run the doctor in a non-interactive shell on purpose, the same way a seat shell would:

```bash
zsh -c 'rea doctor --json'
# or
bash -c 'rea doctor --json'
```

Read the `checks` array. Every provider the plan needs must report `"ok": true` on its rows:

- Ghidra: `ghidra`, `ghidra-version` (12.1.x), `ghidra-headless`, `ghidra-native_decompiler`
  and `ghidra-java` (a 64-bit JDK 21 or newer).
- JADX: `jadx` (`JADX MCP bridge JAR validated at <path>`).

A provider the plan does not need may stay `"ok": false` (`hopper`, `ida-registration`). The
`registration:<client>` rows report config drift for clients you did not register; they are not
providers. The top-level `healthy` flag is audit-wide and goes false on any unneeded provider, so
read the per-provider rows, never the flag.

## The presence check

Presence holds when either is true:

1. the tool registry carries the presence tool `mcp__rea__binary_session` (the client registered
   the `rea` MCP server), or
2. `zsh -c 'rea doctor --json'` (or `bash -c 'rea doctor --json'`) reports every provider the
   plan's artifacts need as ok, per the rows above.

With `run.evidence` on and presence failing, `/war-room` does not offer the evidence lens and the
`/war` Lead skips the seat with one loud line (`artifact-evidence-lead.md`). The run proceeds
without it.
