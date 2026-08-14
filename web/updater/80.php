<?php
    if ( !defined('IN_UPDATER') )
    {
        die('Do not access this file directly.');
    }

    $dbversion = 80;

    // Perform database schema update notification
    print "Updating database and verion schema numbers.<br />";

    $db->query("UPDATE hlstats_Options SET `value` = '$dbversion' WHERE `keyname` = 'dbversion'");

    $db->query("ALTER TABLE `hlstats_Livestats` MODIFY `cli_state` VARCHAR(128) NOT NULL DEFAULT ''");
    $db->query("ALTER TABLE `hlstats_Livestats` MODIFY `cli_country` VARCHAR(128) NOT NULL DEFAULT ''");
    $db->query("ALTER TABLE `hlstats_Livestats` MODIFY `cli_city` VARCHAR(128) NOT NULL DEFAULT ''");

    $db->query("ALTER TABLE `hlstats_Players` MODIFY `country` VARCHAR(128) NOT NULL DEFAULT ''");
    $db->query("ALTER TABLE `hlstats_Players` MODIFY `state` VARCHAR(128) NOT NULL DEFAULT ''");
    $db->query("ALTER TABLE `hlstats_Players` MODIFY `city` VARCHAR(128) NOT NULL DEFAULT ''");
