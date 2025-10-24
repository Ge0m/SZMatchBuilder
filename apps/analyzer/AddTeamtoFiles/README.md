wrapBattleResultsWithTeam.js
=================================

This small Node.js script wraps existing BattleResult JSON files under a top-level `TeamBattleResults` object and adds a `teams` array.

Usage
-----

Run the script with Node.js. Provide a single JSON file or a directory containing JSON files.


Examples:

node wrapBattleResultsWithTeam.js D:/path/to/BattleResultFiles/file.json

node wrapBattleResultsWithTeam.js D:/path/to/BattleResultFiles --teams="Budokai,Cinema"

Overwrite originals:

node wrapBattleResultsWithTeam.js --teams="Budokai,Cinema" --inplace

node "d:/DBZL/SZLeague/GitHub/SZMatchBuilder/apps/analyzer/AddTeamtoFiles/wrapBattleResultsWithTeam.js" --teams="Master and Student,No Team" --inplace

Behavior
--------
- If the input JSON already has a top-level `TeamBattleResults`, the script will set/overwrite its `teams` property.
- Otherwise the script will produce a new JSON that looks like:

{
  "TeamBattleResults": {
    "teams": ["Sentai", "Malevolant Souls"],
    "battleResults": { ... original file contents ... }
  }
}

By default the script writes `.wrapped.json` files alongside the inputs. Use `--inplace` to overwrite the original JSON files.

Notes
-----
- Requires Node.js. No external dependencies.
- This is intentionally small and safe: original files are not overwritten.
