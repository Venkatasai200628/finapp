#!/usr/bin/env python3
"""
Copies the trading bot's SQLite log to a machine running the fin backend.

Use this when the bot and the backend are on different machines (e.g. the bot
runs on a server and the backend runs locally). If both are on the same box,
skip this entirely and just point TRADING_BOT_DB_PATH at logs/trades.db.

Deliberately standalone and read-only: it does not import, modify or restart
any part of the bot, so it cannot disturb live trading. Run it alongside the
bot, not inside it.

Usage:
    python3 bot_bridge.py --db logs/trades.db --dest user@host:/path/to/backend/bot.db

    # or a one-shot integrity-safe copy to a local path:
    python3 bot_bridge.py --db logs/trades.db --out /tmp/bot-snapshot.db
"""
import argparse
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import time
from pathlib import Path


def snapshot(db_path: Path, out_path: Path) -> None:
    """
    Uses SQLite's backup API rather than a file copy. A live bot may be
    mid-write, and copying the file directly can capture a torn page or miss
    the WAL, producing a database that reads as corrupt.
    """
    source = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    try:
        target = sqlite3.connect(str(out_path))
        try:
            source.backup(target)
        finally:
            target.close()
    finally:
        source.close()


def push(local: Path, dest: str) -> None:
    subprocess.run(["scp", "-q", str(local), dest], check=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--db", required=True, type=Path, help="Path to the bot's logs/trades.db")
    parser.add_argument("--out", type=Path, help="Write the snapshot to this local path")
    parser.add_argument("--dest", help="scp destination, e.g. user@host:/path/bot.db")
    parser.add_argument("--interval", type=int, default=0, help="Repeat every N seconds (0 = run once)")
    args = parser.parse_args()

    if not args.out and not args.dest:
        parser.error("give --out, --dest, or both")
    if not args.db.exists():
        print(f"No database at {args.db}", file=sys.stderr)
        return 1

    while True:
        with tempfile.TemporaryDirectory() as tmp:
            staged = Path(tmp) / "bot-snapshot.db"
            snapshot(args.db, staged)

            if args.out:
                args.out.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(staged, args.out)
                print(f"wrote {args.out}")
            if args.dest:
                push(staged, args.dest)
                print(f"pushed to {args.dest}")

        if args.interval <= 0:
            return 0
        time.sleep(args.interval)


if __name__ == "__main__":
    raise SystemExit(main())
