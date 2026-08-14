<?php
    if ( !defined('IN_UPDATER') )
    {
        die('Do not access this file directly.');
    }

    $dbversion = 82;

    // Perform database schema update notification
    print "Updating database and verion schema numbers.<br />";

    $db->query("UPDATE hlstats_Options SET `value` = '$dbversion' WHERE `keyname` = 'dbversion'");

    $db->query("ALTER TABLE `hlstats_Players` ADD INDEX `game_hideranking` (`game`, `hideranking`)");
