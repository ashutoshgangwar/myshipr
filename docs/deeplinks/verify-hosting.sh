#!/usr/bin/env bash
# Verifies the three hosted files for the driver invite link.
#   ./verify-hosting.sh                       # istio-dev.myshipr.com
#   ./verify-hosting.sh link.myshipr.com      # any other host
#
# Exit 0 = every check passed. Anything else and the link will not open the app.

HOST="${1:-istio-dev.myshipr.com}"
FAIL=0

pass() { printf '  \033[32mPASS\033[0m  %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; FAIL=1; }

# $1 url, $2 expected content-type fragment, $3 label
check() {
  # '|' delimited: content_type is empty on a 404, which would shift the fields.
  IFS='|' read -r code ctype redirects < <(
    curl -sS -o /tmp/vh.body -w '%{http_code}|%{content_type}|%{num_redirects}' \
         --max-time 15 -L "$1" 2>/dev/null
  )
  [ "$code" = "200" ]      && pass "$3 → 200"              || fail "$3 → HTTP ${code:-no response}"
  [ "$redirects" = "0" ]   && pass "$3 → no redirect"      || fail "$3 → ${redirects} redirect(s); both OSes follow zero"
  case "$ctype" in
    *"$2"*) pass "$3 → $ctype" ;;
    *)      fail "$3 → content-type is '${ctype:-none}', need $2" ;;
  esac
}

echo
echo "Checking https://$HOST"
echo
echo "1. Android App Links"
check "https://$HOST/.well-known/assetlinks.json" "application/json" "assetlinks.json"
grep -q "com.myshipr" /tmp/vh.body \
  && pass "assetlinks.json → names com.myshipr" \
  || fail "assetlinks.json → package name missing from body"

echo
echo "2. iOS Universal Links"
check "https://$HOST/.well-known/apple-app-site-association" "application/json" "AASA"
grep -q "9852NBYTDU.com.myshipr" /tmp/vh.body \
  && pass "AASA → names 9852NBYTDU.com.myshipr" \
  || fail "AASA → appID missing from body"

echo
echo "3. Landing page"
check "https://$HOST/d/activate?token=test123" "text/html" "/d/activate"
grep -q "Open in app" /tmp/vh.body \
  && pass "/d/activate → serves the landing page" \
  || fail "/d/activate → body is not landing.html"

echo
echo "4. Google's verifier"
LINKED=$(curl -sS --max-time 20 \
  "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://$HOST&relation=delegate_permission/common.handle_all_urls")
case "$LINKED" in
  *com.myshipr*) pass "Google can read the statement" ;;
  *)             fail "Google cannot verify — host may be unreachable from the internet" ;;
esac

echo
[ "$FAIL" = 0 ] \
  && printf '\033[32mAll checks passed — reinstall the app to trigger verification.\033[0m\n\n' \
  || printf '\033[31mSome checks failed. Fix hosting before testing on a device.\033[0m\n\n'
exit $FAIL
