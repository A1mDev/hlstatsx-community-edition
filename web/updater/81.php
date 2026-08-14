<?php
    if ( !defined('IN_UPDATER') )
    {
        die('Do not access this file directly.');
    }

    $dbversion = 81;

    // Perform database schema update notification
    print "Updating database and verion schema numbers.<br />";

    $db->query("UPDATE hlstats_Options SET `value` = '$dbversion' WHERE `keyname` = 'dbversion'");

    // Fix the format before adding the index
    $db->query("ALTER TABLE `hlstats_Events_Chat` MODIFY `eventTime` datetime NULL DEFAULT NULL");

    $db->query("ALTER TABLE `hlstats_Events_Chat` ADD INDEX `idx_player_time` (`playerId`, `eventTime`)");
