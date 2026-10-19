## HLstatsX Community Edition

### 📌 Requirements

- **PHP:** version 7.4 or higher required (recommended 8.0 – 8.4).
- **MySQL / MariaDB:** version 5.7 or higher required (recommended 8.0).
---
HLstatsX Community Edition is an open-source project licensed
under GNU General Public License v2 and is a real-time stats
and ranking for Source engine based games. HLstatsX Community
Edition uses a Perl daemon to parse the log streamed from the
game server. The data is stored in a MySQL Database and has
a PHP frontend.


#### :loudspeaker: Important changes
| Date  | Description | Additional information |
| ------------- | ------------- | ------------- |
| 07.01.2020  | [#45](https://github.com/NomisCZ/hlstatsx-community-edition/issues/45) GeoIP2 Linux script updated, GeoLite2 MaxMind database (GDPR and CCPA) | https://blog.maxmind.com/2019/12/18/significant-changes-to-accessing-and-using-geolite2-databases/ |

> Date format: DD.MM.YYYY
---

### Opposing Force legacy player identities

For a custom Opposing Force game registered as `gearbox` (real game `valve`),
some game DLLs log the obsolete WON-ID `4294967295` for both humans and bots.
The daemon resolves that sentinel using the configured server's authenticated
RCON `status` roster, matching connection userid and current nickname.
Configure working RCON access, use standard SteamID (`Normal`) tracking and keep
`IgnoreBots=1` to exclude bot kills without discarding verified human activity.

The roster is cached per server for five seconds. Unresolved, pending or
mismatched identities are untrackable and produce a rate-limited `AUTH` notice;
activity can be missed briefly after a join or rename until the next refresh.
Native Steam/BOT identities and other games are unchanged. This does not add
an Opposing Force game definition, assets, weapons or a database migration.
Untracked enter-game notifications take the existing `NOPLAYERINFO` path before
the handler dereferences a player; they never become fake player objects.
Untracked suicide notifications also require a safe missing-player path.
The upstream suicide handler already checks this; standalone regressions cover
17 event handlers for unresolved, pending and disconnected players, followed by
verified human scoring and unchanged bot/minimum-player/bonus-round filters.
Run `prove scripts/t/opfor-identity.t scripts/t/enter-game.t scripts/t/missing-player.t`
for core-Perl parser and event-handler regressions.

### :book: Documentation
* https://github.com/NomisCZ/hlstatsx-community-edition/wiki 🚧 Wiki - work in progress 🚧
### :speech_balloon: Help
*  https://forums.alliedmods.net/forumdisplay.php?f=156
---
