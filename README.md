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

### :book: Documentation
* https://github.com/NomisCZ/hlstatsx-community-edition/wiki 🚧 Wiki - work in progress 🚧
### Daemon timestamp validation

Invalid calendar/time fields are reported as `E998 MALFORMED TIMESTAMP` and
discarded without terminating the daemon. Valid timestamp behavior is unchanged.
Run the standalone core-Perl regressions with `prove scripts/t/timestamp.t`;
no database or running game server is required.

Log dates remain `MM/DD/YYYY` by default. For a day-first server, set its
`LogDateFormat` parameter in `hlstats_Servers_Config` to `DD/MM/YYYY` and reload
the daemon. `MM/DD/YYYY` is also accepted explicitly. This is per server:
ambiguous dates are never guessed and other servers keep their existing format.
Invalid format settings are reported and their packets rejected. No database
schema change is required.

### :speech_balloon: Help
*  https://forums.alliedmods.net/forumdisplay.php?f=156
---
