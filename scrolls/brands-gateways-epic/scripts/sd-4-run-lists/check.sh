#!/usr/bin/env bash
# Reads each list with the same `while read` and `case` lines run-all.sh uses (w1, w5, ids), and checks counts, files and const names.
set -u
ROOT=/home/brutus-home/projects/assayer; LISTS=$ROOT/tmp/lists; cd "$ROOT" || exit 1
bad=0
n1=0; while read -r c f; do case "$c" in ''|\#*) continue;; esac
  [ -f "$f" ] || { echo "W1 file gone: $f"; bad=1; continue; }
  grep -q "export const $c\b" "$f" || { echo "W1 const $c not in $f"; bad=1; }; n1=$((n1+1)); done < "$LISTS/w1-runs.txt"
n5=0; while read -r c f flags; do case "$c" in ''|\#*) continue;; esac
  [ -f "$f" ] || { echo "W5 file gone: $f"; bad=1; continue; }
  grep -q "export const $c\b" "$f" || { echo "W5 const $c not in $f"; bad=1; }
  [ -n "$flags" ] && echo "W5 flags on $c: $flags"; n5=$((n5+1)); done < "$LISTS/w5-runs.txt"
ids() { local n=0; while read -r args; do case "$args" in ''|\#*) continue;; esac; n=$((n+1)); echo "  $1 would run: --brand=$args" >&2; done < "$2"; echo $n; }
n3=$(ids W3 "$LISTS/w3-runs.txt"); n4=$(ids W4 "$LISTS/w4-runs.txt")
ls "$LISTS"/w2-*.json >/dev/null 2>&1 && echo "w2 files present" || echo "no w2-*.json (run-all.sh notes it and skips W2)"
echo "W1=$n1 (want 22) W5=$n5 (want 24 = 25 value - ContentHash) W3=$n3 (want 0) W4=$n4 (want 3)"
dup=$(awk '$1!~/^#/&&NF{print $1}' "$LISTS/w1-runs.txt" "$LISTS/w5-runs.txt" | sort | uniq -d)
[ -z "$dup" ] || { echo "const in both W1 and W5: $dup"; bad=1; }
grep -q ContentHash "$LISTS/w5-runs.txt" | grep -v '^#' ; grep -v '^#' "$LISTS/w5-runs.txt" | grep -qi contenthash && { echo "ContentHash in W5 run lines"; bad=1; }
grep -v '^#' "$LISTS/w1-runs.txt" | grep -q tree-node-name && echo "TreeNodeName is in W1 (plain, per 2.8)"
grep -v '^#' "$LISTS/w5-runs.txt" | grep -q tree-node-name && { echo "TreeNodeName in W5"; bad=1; }
[ "$n1" = 22 ] && [ "$n5" = 24 ] && [ "$n3" = 0 ] && [ "$n4" = 3 ] && [ $bad = 0 ] && echo VALID || { echo INVALID; exit 1; }
