#!/bin/bash
#
# Copy the Hermes dSYM into the archive.
#
# hermes-engine is consumed as a PRE-BUILT binary framework, and the tarball
# CocoaPods downloads (hermes-ios-<v>-hermes-ios-release.tar.gz) contains no
# debug symbols. So every upload gets this from App Store Connect:
#
#   The archive did not include a dSYM for the hermesvm.framework with the
#   UUIDs [...]. Ensure that the archive's dSYM folder includes a DWARF file
#   for hermesvm.framework with the expected UUIDs.
#
# It is only a warning — the build still ships — but without it any native
# crash inside the Hermes VM comes back unsymbolicated, which is exactly the
# class of crash that is hardest to read without symbols.
#
# React Native publishes the matching dSYMs as a SEPARATE Maven artifact
# (hermes-framework-dSYM-<config>). This fetches that once per version, caches
# it next to the tarballs CocoaPods already caches, and drops the iphoneos
# slice into ${DWARF_DSYM_FOLDER_PATH} — the folder Xcode collects into the
# archive's dSYMs directory.
#
# Never fails the build: a missing dSYM is a warning, and a broken network or
# a changed upstream layout must not stop a release from being archived.

set -uo pipefail

# Archives only (`xcodebuild archive` / Xcode's Product > Archive set this).
# A plain Release build would just pay the copy cost for nothing.
if [[ "${ACTION:-}" != "install" ]]; then
  echo "note: not an archive (ACTION='${ACTION:-}') — skipping Hermes dSYM copy"
  exit 0
fi

if [[ -z "${DWARF_DSYM_FOLDER_PATH:-}" ]]; then
  echo "warning: DWARF_DSYM_FOLDER_PATH is unset — skipping Hermes dSYM copy"
  exit 0
fi

PODS_ROOT="${PODS_ROOT:-${SRCROOT}/Pods}"

# Hermes has its own version line, independent of the react-native version.
HERMES_VERSION="$(sed -n -E 's/^  - hermes-engine \(([^)]+)\).*/\1/p' "${SRCROOT}/Podfile.lock" | head -1)"
if [[ -z "${HERMES_VERSION}" ]]; then
  echo "warning: could not read hermes-engine version from Podfile.lock — skipping Hermes dSYM copy"
  exit 0
fi

# The debug and release Hermes binaries have different UUIDs, so the dSYM has
# to match the configuration actually being archived.
BUILD_TYPE="release"
if [[ "${CONFIGURATION:-Release}" == "Debug" ]]; then
  BUILD_TYPE="debug"
fi

CACHE_DIR="${HOME}/Library/Caches/ReactNative"
ARTIFACT="hermes-ios-${HERMES_VERSION}-hermes-framework-dSYM-${BUILD_TYPE}.tar.gz"
TARBALL="${CACHE_DIR}/${ARTIFACT}"
# Keyed by version + config so an RN upgrade cannot silently reuse a stale dSYM.
EXTRACT_DIR="${CACHE_DIR}/hermes-dSYM-${HERMES_VERSION}-${BUILD_TYPE}"
DSYM="${EXTRACT_DIR}/iphoneos/hermesvm.framework.dSYM"
BASE_URL="https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/${HERMES_VERSION}"

if [[ ! -d "${DSYM}" ]]; then
  mkdir -p "${CACHE_DIR}"

  if [[ ! -f "${TARBALL}" ]]; then
    echo "note: downloading Hermes dSYM ${HERMES_VERSION} (${BUILD_TYPE})"
    if ! curl -sSL --fail --max-time 600 -o "${TARBALL}.part" "${BASE_URL}/${ARTIFACT}"; then
      echo "warning: could not download ${ARTIFACT} — archive will be missing the Hermes dSYM"
      rm -f "${TARBALL}.part"
      exit 0
    fi

    # Verify before trusting it: a truncated download would otherwise be cached
    # and silently reused by every later archive.
    EXPECTED="$(curl -sSL --fail --max-time 60 "${BASE_URL}/${ARTIFACT}.sha256" | tr -d '[:space:]')"
    ACTUAL="$(shasum -a 256 "${TARBALL}.part" | cut -d' ' -f1)"
    if [[ -n "${EXPECTED}" && "${EXPECTED}" != "${ACTUAL}" ]]; then
      echo "warning: checksum mismatch for ${ARTIFACT} (expected ${EXPECTED}, got ${ACTUAL}) — skipping Hermes dSYM copy"
      rm -f "${TARBALL}.part"
      exit 0
    fi
    mv "${TARBALL}.part" "${TARBALL}"
  fi

  # Only the iphoneos slice is worth unpacking; the full archive carries tvOS,
  # visionOS, catalyst and simulator symbols too (~890MB vs ~68MB).
  echo "note: extracting Hermes dSYM to ${EXTRACT_DIR}"
  mkdir -p "${EXTRACT_DIR}"
  if ! tar -xzf "${TARBALL}" -C "${EXTRACT_DIR}" iphoneos; then
    echo "warning: could not extract iphoneos slice from ${ARTIFACT} — skipping Hermes dSYM copy"
    exit 0
  fi
fi

if [[ ! -d "${DSYM}" ]]; then
  echo "warning: ${DSYM} not found after extraction — skipping Hermes dSYM copy"
  exit 0
fi

mkdir -p "${DWARF_DSYM_FOLDER_PATH}"
cp -R "${DSYM}" "${DWARF_DSYM_FOLDER_PATH}/"
echo "note: copied hermesvm.framework.dSYM into ${DWARF_DSYM_FOLDER_PATH}"

# Surface a mismatch rather than letting a wrong-UUID dSYM look like success:
# App Store Connect would warn again and the reason would be non-obvious.
FRAMEWORK_BINARY="${TARGET_BUILD_DIR:-}/${FRAMEWORKS_FOLDER_PATH:-}/hermesvm.framework/hermesvm"
if [[ -f "${FRAMEWORK_BINARY}" ]] && command -v dwarfdump >/dev/null 2>&1; then
  BINARY_UUID="$(dwarfdump --uuid "${FRAMEWORK_BINARY}" 2>/dev/null | awk '{print $2}' | head -1)"
  DSYM_UUID="$(dwarfdump --uuid "${DSYM}" 2>/dev/null | awk '{print $2}' | head -1)"
  if [[ -n "${BINARY_UUID}" && -n "${DSYM_UUID}" && "${BINARY_UUID}" != "${DSYM_UUID}" ]]; then
    echo "warning: Hermes dSYM UUID ${DSYM_UUID} does not match the embedded framework ${BINARY_UUID}"
  fi
fi

exit 0
