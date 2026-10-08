# Vulnerability triage: `linkbox-api` runtime image

Scan: `trivy image -q --severity HIGH,CRITICAL linkbox-api:local` on 2026-10-08.
Result: **61 HIGH, 0 CRITICAL**, from three sources:

| Source | Findings | Where |
|---|---|---|
| TypeScript compiler (Go binary) | 10 | `/app/node_modules/@typescript/typescript-linux-arm64/lib/tsc` |
| npm's own bundled packages | 8 | `/usr/local/lib/node_modules/npm/...` |
| Debian base packages | 43 | OS packages of `node:24-trixie-slim` |

Neither of the first two is used by the running app: the tsc binary is a devDependency, and the app is started with `node`, never `npm`.

## Top 10

| # | CVE | Package | Severity | Fixed in | OS or npm | Decision | Reason |
|---|---|---|---|---|---|---|---|
| 1 | CVE-2026-56853, -56858, -56862 and 6 more | Go `stdlib` inside `tsc` | HIGH | Go 1.26.6 | npm (Go binary) | **Fix** | `typescript` is a devDependency that only `npm run build` needs. `prod-deps` ran `npm ci` without `--omit=dev`, so the compiler shipped in the runtime image. Use `npm ci --omit=dev`. |
| 2 | CVE-2026-56852 | `golang.org/x/text` inside `tsc` | HIGH | 0.39.0 | npm (Go binary) | **Fix** | Same binary as #1; removed by the same change. |
| 3 | CVE-2026-102276, -102278, -14257, -69152 | `brace-expansion` 5.0.7 (bundled in npm) | HIGH | 5.0.11 | npm | **Fix** | npm is never run in production (`CMD ["node", ...]`). Delete npm from the runtime stage. |
| 4 | CVE-2026-73566 | `tar` 7.5.19 (bundled in npm) | HIGH | 7.5.21 | npm | **Fix** | Same as #3. |
| 5 | CVE-2026-19534 | `undici` 6.27.0 (bundled in npm) | HIGH | 6.28.1 | npm | **Fix** | Same as #3. Node's built-in `fetch` has its own copy, which is not affected. |
| 6 | CVE-2026-69192 | `ip-address` 10.2.0 (bundled in npm) | HIGH | 10.3.1 | npm | **Fix** | Same as #3. |
| 7 | CVE-2026-93748 | `http-cache-semantics` 4.2.0 (bundled in npm) | HIGH | none | npm | **Fix** | No upstream fix, but removing npm removes it too. |
| 8 | CVE-2026-76642, -78408, -78409, -78410 | util-linux family (`mount`, `login`, `libmount1`, `libblkid1`, ... 9 packages) | HIGH | none | OS | **Accept** (review 2026-11-08) | No Debian fix yet. All four need mounting, `nsenter` or login, which require root or `CAP_SYS_ADMIN`. The container runs as UID 1000 with `cap_drop: ALL`, `no-new-privileges` and a read-only rootfs, so they are not reachable. |
| 9 | CVE-2026-54369, CVE-2026-16742, CVE-2025-69720, CVE-2026-9538 | `libacl1`, `libsystemd0`/`libudev1`, `ncurses`, `perl-base` | HIGH | none | OS | **Accept** (review 2026-11-08) | No Debian fix. The vulnerable code paths (ACL tools, systemd-homed, terminal handling, Perl) are never executed by a Node server in a container without a shell session. |
| 10 | all 43 OS findings | Debian base image | HIGH | — | OS | **Defer** (by 2026-11-30) | The real fix is a runtime base without these packages. `node:24-alpine` scans at **0** OS findings. Switching needs testing (musl instead of glibc) and an Alpine-compatible healthcheck. Distroless or hardened images are the long-term option. |

## Expected result after the fixes

- Rows 1–7 fixed: **61 → 43**, and every remaining finding has no upstream fix.
- Row 10 done as well (Alpine runtime): **0 OS findings**.

## Policy

- CI gate: fail only on **fixable** HIGH/CRITICAL (`trivy image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1`).
- Rebuild with `--pull` at least weekly, so base-image patches arrive without code changes.
- Revisit every **Accept** row on its review date.
