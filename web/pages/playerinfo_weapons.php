<?php
/*
HLstatsX Community Edition - Real-time player and clan rankings and statistics
Copyleft (L) 2008-20XX Nicholas Hastings (nshastings@gmail.com)
http://www.hlxcommunity.com

HLstatsX Community Edition is a continuation of 
ELstatsNEO - Real-time player and clan rankings and statistics
Copyleft (L) 2008-20XX Malte Bayer (steam@neo-soft.org)
http://ovrsized.neo-soft.org/

ELstatsNEO is an very improved & enhanced - so called Ultra-Humongus Edition of HLstatsX
HLstatsX - Real-time player and clan rankings and statistics for Half-Life 2
http://www.hlstatsx.com/
Copyright (C) 2005-2007 Tobias Oetzel (Tobi@hlstatsx.com)

HLstatsX is an enhanced version of HLstats made by Simon Garner
HLstats - Real-time player and clan rankings and statistics for Half-Life
http://sourceforge.net/projects/hlstats/
Copyright (C) 2001  Simon Garner
            
This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.

For support and installation notes visit http://www.hlxcommunity.com
*/
    if (!defined('IN_HLSTATS')) {
        die('Do not access this file directly.');
    }

    $container = require ROOT_PATH . '/bootstrap.php';
    $gameRepo = $container->get(\Repository\GameRepository::class);
    $realgame = $gameRepo->getGameByCode($game, 'realgame');

	$result = $db->query("
		SELECT
			hlstats_Weapons.code,
			hlstats_Weapons.name
		FROM
			hlstats_Weapons
		WHERE
			hlstats_Weapons.game = '$game'
	");

	while ($rowdata = $db->fetch_row($result)) {
		$code = $rowdata[0];
		$fname[strToLower($code)] = htmlspecialchars($rowdata[1]);
	}

	$tblWeapons = new Table
	(
		array
		(
			new TableColumn
			(
				'weapon',
				'Weapon',
				'width=15&type=weaponimg&align=center&link=' . urlencode("mode=weaponinfo&amp;weapon=%k&amp;game=$game"),
				$fname
			),
			new TableColumn
			(
				'modifier',
				'Modifier',
				'width=10&align=right'
			),
			new TableColumn
			(
				'kills',
				'Kills',
				'width=11&align=right'
			),
			new TableColumn
			(
				'kpercent',
				'%',
				'width=5&sort=no&align=right&append=' . urlencode('%')
			),
			new TableColumn
			(
				'kpercent',
				'Ratio',
				'width=18&sort=no&type=bargraph'
			),
			new TableColumn
			(
				'headshots',
				'Headshots',
				'width=8&align=right'
			),
			new TableColumn
			(
				'hpercent',
				'%',
				'width=5&sort=no&align=right&append=' . urlencode('%')
			),
			new TableColumn
			(
				'hpercent',
				'Ratio',
				'width=18&sort=no&type=bargraph'
			),
			new TableColumn
			(
				'hpk',
				'HS:K',
				'width=5&align=right'
			)
		),
		'weapon',
		'kills',
		'weapon',
		true,
		9999,
		'weap_page',
		'weap_sort',
		'weap_sortorder',
		'tabweapons',
		'desc',
		true
	);

	$result = $db->query("
		SELECT
			hlstats_Events_Frags.weapon,
			IFNULL(hlstats_Weapons.modifier, 1.00) AS modifier,
			COUNT(hlstats_Events_Frags.weapon) AS kills,
			ROUND(COUNT(hlstats_Events_Frags.weapon) / $realkills * 100, 2) AS kpercent,
			SUM(hlstats_Events_Frags.headshot = 1) AS headshots,
			ROUND(SUM(hlstats_Events_Frags.headshot = 1) / IF(COUNT(hlstats_Events_Frags.weapon) = 0, 1, COUNT(hlstats_Events_Frags.weapon)), 2) AS hpk,
			ROUND(SUM(hlstats_Events_Frags.headshot = 1) / $realheadshots * 100, 2) AS hpercent
		FROM
			hlstats_Events_Frags
		LEFT JOIN
			hlstats_Weapons
		ON
			hlstats_Weapons.code = hlstats_Events_Frags.weapon
		WHERE
			hlstats_Events_Frags.killerId = $player
			AND
			(
				hlstats_Weapons.game = '$game'
				OR hlstats_Weapons.weaponId IS NULL
			)
		GROUP BY
			hlstats_Events_Frags.weapon
		ORDER BY
			$tblWeapons->sort $tblWeapons->sortorder,
			$tblWeapons->sort2 $tblWeapons->sortorder
	");

	$numitems = $db->num_rows($result);
	if ($numitems > 0) {
		printSectionTitle('Weapon Usage *');
		$tblWeapons->draw($result, $numitems, 95); ?>
		<br /><br />
<?php
	}
?>

<!-- Begin of StatsMe Addon 1.0 by JustinHoMi@aol.com -->
<?php
	flush();

	$tblWeaponstats = new Table
	(
		array
		(
			new TableColumn
			(
				'smweapon',
				'Weapon',
				'width=15&type=weaponimg&align=center&link=' . urlencode("mode=weaponinfo&amp;weapon=%k&amp;game=$game"),
				$fname
			),
			new TableColumn
			(
				'smshots',
				'Shots',
				'width=8&align=right'
			),
			new TableColumn
			(
				'smhits',
				'Hits',
				'width=8&align=right'
			),
			new TableColumn
			(
				'smdamage',
				'Damage',
				'width=8&align=right'
			),
			new TableColumn
			(
				'smheadshots',
				'Headshots',
				'width=8&align=right'
			),
			new TableColumn
			(
				'smkills',
				'Kills',
				'width=7&align=right'
			),
			new TableColumn
			(
				'smkdr',
				'K:D',
				'width=12&align=right'
			),
			new TableColumn
			(
				'smaccuracy',
				'Accuracy',
				'width=8&align=right&append=' . urlencode('%')
			),
			new TableColumn
			(
				'smdhr',
				'Damage per Hit',
				'width=10&align=right'
			),
			new TableColumn(
				'smspk',
				'Shots per Kill',
				'width=11&align=right'
			)
		),
		'smweapon',
		'smkills',
		'smweapon',
		true,
		9999,
		'weap_page',
		'weap_sort',
		'weap_sortorder',
		'tabweapons',
		'desc',
		true
	);

	$result = $db->query("
		SELECT
			hlstats_Events_Statsme.weapon AS smweapon,
			SUM(hlstats_Events_Statsme.kills) AS smkills,
			SUM(hlstats_Events_Statsme.hits) AS smhits,
			SUM(hlstats_Events_Statsme.shots) AS smshots,
			SUM(hlstats_Events_Statsme.headshots) AS smheadshots,
			SUM(hlstats_Events_Statsme.deaths) AS smdeaths,
			SUM(hlstats_Events_Statsme.damage) AS smdamage,
			ROUND((SUM(hlstats_Events_Statsme.damage) / (IF(SUM(hlstats_Events_Statsme.hits) = 0, 1, SUM(hlstats_Events_Statsme.hits) ))), 1) as smdhr,
			SUM(hlstats_Events_Statsme.kills) / IF((SUM(hlstats_Events_Statsme.deaths) = 0), 1, (SUM(hlstats_Events_Statsme.deaths))) AS smkdr,
			ROUND((SUM(hlstats_Events_Statsme.hits) / SUM(hlstats_Events_Statsme.shots) * 100), 1) AS smaccuracy,
			ROUND(((IF(SUM(hlstats_Events_Statsme.kills) = 0, 0, SUM(hlstats_Events_Statsme.shots))) / (IF(SUM(hlstats_Events_Statsme.kills) = 0, 1, SUM(hlstats_Events_Statsme.kills) ))), 1) as smspk
		FROM
			hlstats_Events_Statsme
		WHERE
			hlstats_Events_Statsme.PlayerId = $player
		GROUP BY
			hlstats_Events_Statsme.weapon
		HAVING
			SUM(hlstats_Events_Statsme.shots) > 0
		ORDER BY
			$tblWeaponstats->sort $tblWeaponstats->sortorder,
			$tblWeaponstats->sort2 $tblWeaponstats->sortorder
	");

	$numitems = $db->num_rows($result);
	if ($numitems > 0) {
		printSectionTitle('Weapon Statistics *');
		$tblWeaponstats->draw($result, $numitems, 95); ?>
		<br /><br />
<!-- End of StatsMe Addon 1.0 by JustinHoMi@aol.com -->

<?php
	}
	flush();
	if ($g_options['show_weapon_target_flash'] == 1)
	{
		$tblWeaponstats2 = new Table
		(
			array
			(
				new TableColumn
				(
					'smweapon',
					'Weapon',
					'width=35&type=weaponimg&align=center&link='.urlencode("javascript:switch_weapon('%k');"),
					$fname
				),
				new TableColumn
				(
					'smhits',
					'Hits',
					'width=15&align=right'
				),
				new TableColumn
				(
					'smleft',
					'Left',
					'width=15&align=right&append=' . urlencode('%')
				),
				new TableColumn
				(
					'smmiddle',
					'Middle',
					'width=15&align=right&append=' . urlencode('%')
				),
				new TableColumn
				(
					'smright',
					'Right',
					'width=15&align=right&append=' . urlencode('%')
				)
			),
			'smweapon',
			'smhits',
			'smweapon',
			true,
			9999,
			'weap_page',
			'weap_sort',
			'weap_sortorder',
			'tabweapons',
			'desc',
			true
		);
	}
	else
	{
	$tblWeaponstats2 = new Table
	(
		array(
			new TableColumn
			(
				'smweapon',
				'Weapon',
				'width=15&type=weaponimg&align=center&link=' . urlencode("mode=weaponinfo&amp;weapon=%k&amp;game=$game"),
				$fname
			),
			new TableColumn
			(
				'smhits',
				'Hits',
				'width=7&align=right'
			),
			new TableColumn
			(
				'smhead',
				'Head',
				'width=7&align=right'
			),
			new TableColumn
			(
				'smchest',
				'Chest',
				'width=7&align=right'
			),
			new TableColumn
			(
				'smstomach',
				'Stomach',
				'width=7&align=right'
			),
			new TableColumn
			(
				'smleftarm',
				'Left Arm',
				'width=7&align=right'
			),
			new TableColumn
			(
				'smrightarm',
				'Right Arm',
				'width=7&align=right'
			),
			new TableColumn
			(
				'smleftleg',
				'Left Leg',
				'width=7&align=right'
			),
			new TableColumn
			(
				'smrightleg',
				'Right Leg',
				'width=7&align=right'
			),
			new TableColumn
			(
				'smleft',
				'Left',
				'width=8&align=right&append=' . urlencode('%')
			),
			new TableColumn
			(
				'smmiddle',
				'Middle',
				'width=8&align=right&append=' . urlencode('%')
			),
			new TableColumn
			(
				'smright',
				'Right',
				'width=8&align=right&append=' . urlencode('%')
			)
		),
		'smweapon',
		'smhits',
		'smweapon',
		true,
		9999,
		'weap_page',
		'weap_sort',
		'weap_sortorder',
		'weaponstats2',
		'desc',
		true
		);
	}
	$query = "
		SELECT
			hlstats_Events_Statsme2.weapon AS smweapon,
			SUM(hlstats_Events_Statsme2.head) AS smhead,
			SUM(hlstats_Events_Statsme2.chest) AS smchest,
			SUM(hlstats_Events_Statsme2.stomach) AS smstomach,
			SUM(hlstats_Events_Statsme2.leftarm) AS smleftarm,
			SUM(hlstats_Events_Statsme2.rightarm) AS smrightarm,
			SUM(hlstats_Events_Statsme2.leftleg) AS smleftleg,
			SUM(hlstats_Events_Statsme2.rightleg) AS smrightleg,
			SUM(hlstats_Events_Statsme2.head)
				+ SUM(hlstats_Events_Statsme2.chest)
				+ SUM(hlstats_Events_Statsme2.stomach)
				+ SUM(hlstats_Events_Statsme2.leftarm)
				+ SUM(hlstats_Events_Statsme2.rightarm)
				+ SUM(hlstats_Events_Statsme2.leftleg)
				+ SUM(hlstats_Events_Statsme2.rightleg) AS smhits,
			IFNULL(ROUND((SUM(hlstats_Events_Statsme2.leftarm) + SUM(hlstats_Events_Statsme2.leftleg)) / (SUM(hlstats_Events_Statsme2.head) + SUM(hlstats_Events_Statsme2.chest) + SUM(hlstats_Events_Statsme2.stomach) + SUM(hlstats_Events_Statsme2.leftarm ) + SUM(hlstats_Events_Statsme2.rightarm) + SUM(hlstats_Events_Statsme2.leftleg) + SUM(hlstats_Events_Statsme2.rightleg)) * 100, 1), 0.0) AS smleft,
			IFNULL(ROUND((SUM(hlstats_Events_Statsme2.rightarm) + SUM(hlstats_Events_Statsme2.rightleg)) / (SUM(hlstats_Events_Statsme2.head) + SUM(hlstats_Events_Statsme2.chest) + SUM(hlstats_Events_Statsme2.stomach) + SUM(hlstats_Events_Statsme2.leftarm ) + SUM(hlstats_Events_Statsme2.rightarm) + SUM(hlstats_Events_Statsme2.leftleg) + SUM(hlstats_Events_Statsme2.rightleg)) * 100, 1), 0.0) AS smright,
			IFNULL(ROUND((SUM(hlstats_Events_Statsme2.head) + SUM(hlstats_Events_Statsme2.chest) + SUM(hlstats_Events_Statsme2.stomach)) / (SUM(hlstats_Events_Statsme2.head) + SUM(hlstats_Events_Statsme2.chest) + SUM(hlstats_Events_Statsme2.stomach) + SUM(hlstats_Events_Statsme2.leftarm ) + SUM(hlstats_Events_Statsme2.rightarm) + SUM(hlstats_Events_Statsme2.leftleg) + SUM(hlstats_Events_Statsme2.rightleg)) * 100, 1), 0.0) AS smmiddle
		FROM
			hlstats_Events_Statsme2
		WHERE
			hlstats_Events_Statsme2.PlayerId = $player
		GROUP BY
			hlstats_Events_Statsme2.weapon
		HAVING
			smhits > 0
		ORDER BY
			$tblWeaponstats2->sort $tblWeaponstats2->sortorder,
			$tblWeaponstats2->sort2 $tblWeaponstats2->sortorder
	";
	$result = $db->query($query);
	if ($db->num_rows($result) != 0)
	{
		printSectionTitle('Weapon Targets *');
		if ($g_options['show_weapon_target_flash'] == 1)
		{
?>
	<div class="subblock">
		<div style="float:left;vertical-align:top;width:52%;">
			<script type="text/javascript">
			/* <![CDATA[ */
			<?php
			$weapon_data = array ();
			$css_models = array ('ct', 'ct2', 'ct3', 'ct4', 'ts', 'ts2', 'ts3', 'ts4');
			$css_ct_weapons = array ('usp', 'tmp', 'm4a1', 'aug', 'famas', 'sig550');
			$css_ts_weapons = array ('glock', 'elite', 'mac10', 'ak47', 'sg552', 'galil', 'g3sg1');
			$css_random_weapons = array ('knife', 'deagle', 'p228', 'm3', 'xm1014', 'mp5navy', 'p90', 'scout', 'awp', 'm249', 'hegrenade', 'flashbang', 'ump45', 'smokegrenade_projectile');
			$dods_models = array ('allies', 'axis');
			$dods_allies_weapons = array ('thompson', 'colt', 'spring', 'garand', 'riflegren_us', 'm1carbine', 'bar', 'amerknife', '30cal', 'bazooka', 'frag_us', 'riflegren_us', 'smoke_us');
			$dods_axis_weapons = array ('spade', 'riflegren_ger', 'k98', 'mp40', 'p38', 'frag_ger', 'smoke_ger', 'mp44', 'k98_scoped', 'mg42', 'pschreck', 'c96');
			$l4d_models = array ('zombie1', 'zombie2', 'zombie3');
			$insmod_models = array ('insmod1', 'insmod2');
			$fof_models = array ('fof1', 'fof2');
			$ges_models = array ('ges-bond', 'ges-boris');
			$dinodday_models			= array('ddd_allies', 'ddd_axis');
			$dinodday_allies_weapons	= array('garand', 'greasegun', 'thompson', 'shotgun', 'sten', 'carbine', 'bar', 'mosin', 'p38', 'piat', 'nagant', 'flechette', 'pistol', 'trigger');
			$dinodday_axis_weapons		= array('mp40', 'k98', 'mp44', 'k98sniper', 'luger', 'stygimoloch', 'mg42', 'trex');
			while ($rowdata = $db->fetch_array())
			{
				$weapon_data['total']['head'] += $rowdata['smhead'];
				$weapon_data['total']['leftarm'] += $rowdata['smleftarm'];
				$weapon_data['total']['rightarm'] += $rowdata['smrightarm'];
				$weapon_data['total']['chest'] += $rowdata['smchest'];
				$weapon_data['total']['stomach'] += $rowdata['smstomach'];
				$weapon_data['total']['leftleg'] += $rowdata['smleftleg'];
				$weapon_data['total']['rightleg'] += $rowdata['smrightleg'];
				$weapon_data[$rowdata['smweapon']]['head'] = $rowdata['smhead'];
				$weapon_data[$rowdata['smweapon']]['leftarm'] = $rowdata['smleftarm'];
				$weapon_data[$rowdata['smweapon']]['rightarm'] = $rowdata['smrightarm'];
				$weapon_data[$rowdata['smweapon']]['chest'] = $rowdata['smchest'];
				$weapon_data[$rowdata['smweapon']]['stomach'] = $rowdata['smstomach'];
				$weapon_data[$rowdata['smweapon']]['leftleg'] = $rowdata['smleftleg'];
				$weapon_data[$rowdata['smweapon']]['rightleg'] = $rowdata['smrightleg'];
				switch ($realgame)
				{
					case 'dods':
						$weapon_data[$rowdata['smweapon']]['model'] = 'allies';
						break;
					case 'l4d':
						$weapon_data[$rowdata['smweapon']]['model'] = 'zombie1';
						break;
					case 'hl2mp':
						$weapon_data[$rowdata["smweapon"]]['model'] = 'alyx';
						break;
					case 'insmod':
						$weapon_data[$rowdata['smweapon']]['model'] = 'insmod1';
						break;
					case 'zps':
						$weapon_data[$rowdata["smweapon"]]['model'] = 'zps1';
						break;
					case 'ges':
						$weapon_data[$rowdata['smweapon']]['model'] = 'ges-bond';
						break;
					case 'tfc':
						$weapon_data[$rowdata["smweapon"]]['model'] = 'pyro';
						break;
					case 'fof':
						$weapon_data[$rowdata['smweapon']]['model'] = 'fof1';
						break;
					case 'dinodday':
						$weapon_data[$rowdata['smweapon']]['model'] = 'ddd_allies';
						break;
					default:
						$weapon_data[$rowdata['smweapon']]['model'] = 'ct';
				}
				if ($realgame == 'css' || $realgame == 'cstrike')
				{
					if (in_array($rowdata['smweapon'], $css_random_weapons))
					{
						$weapon_data[$rowdata['smweapon']]['model'] = $css_models[array_rand($css_models)];
					}
					elseif (in_array($rowdata['smweapon'], $css_ct_weapons))
					{
						$weapon_data[$rowdata['smweapon']]['model'] = $css_models[rand(0, 2) + 3];
					}
					elseif (in_array($rowdata['smweapon'], $css_ts_weapons))
					{
						$weapon_data[$rowdata['smweapon']]['model'] = $css_models[rand(0, 2)];
					}
				}
				elseif ($realgame == 'dods')
				{
					if (in_array($rowdata['smweapon'], $dods_allies_weapons))
					{
						$weapon_data[$rowdata['smweapon']]['model'] = $dods_models[1];
					}
					elseif (in_array($rowdata['smweapon'], $dods_axis_weapons))
					{
						$weapon_data[$rowdata['smweapon']]['model'] = $dods_models[0];
					}
				}
				elseif ($realgame == 'dinodday')
				{
					if (in_array($rowdata['smweapon'], $dinodday_allies_weapons))
					{
						$weapon_data[$rowdata['smweapon']]['model'] = $dinodday_models[1];
					}
					elseif (in_array($rowdata['smweapon'], $dinodday_axis_weapons))
					{
						$weapon_data[$rowdata['smweapon']]['model'] = $dinodday_models[0];
					}
				}
			}
			switch ($realgame)
			{
				case 'dods':
					$start_model = $dods_models[array_rand($dods_models)];
					break;
				case 'l4d':
					$start_model = $l4d_models[array_rand($l4d_models)];
					break;
				case 'hl2mp':
					$start_model = 'alyx';
					break;
				case 'insmod':
					$start_model = $insmod_models[array_rand($insmod_models)];
					break;
				case 'zps':
					$start_model = 'zps1';
					break;
				case 'ges':
					$start_model = $ges_models[array_rand($ges_models)];
					break;
				case 'tfc':
					$start_model = 'pyro';
					break;
				case 'fof':
					$start_model = $fof_models[array_rand($fof_models)];
					break;
				case 'dinodday':
					$start_model = $dinodday_models[array_rand($dinoday_models)];
					break;
				default:
					$start_model   = $css_models[array_rand($css_models)];
			}
			$weapon_data['total']['model'] = $start_model;                               
			echo "var data_array = new Array();\n";
			$i = 1;
			foreach ($weapon_data as $key => $entry)
			{
				if ($key == 'total')
					$key = 'All Weapons';
				echo "data_array['$key'] = ['".ucfirst($key)."',".$entry['head'].",".$entry['leftarm'].",".$entry['rightarm'].",".$entry['chest'].",".$entry['stomach'].",".$entry['leftleg'].",".$entry['rightleg'].",'".$entry['model']."'];\n";
				$i++; 
			}
			$result = $db->query($query);
			?>
			function hlx_hitbox_ensure(cb) {
				if (window.HLXHitboxModern) { cb(); return; }
				if (window.__hlxHitboxLoading) {
					window.__hlxHitboxLoading.push(cb);
					return;
				}
				window.__hlxHitboxLoading = [cb];
				var s = document.createElement('script');
				s.src = '<?php echo INCLUDE_PATH; ?>/js/hitbox-modern.js';
				s.onload = function () {
					var queue = window.__hlxHitboxLoading || [];
					window.__hlxHitboxLoading = null;
					for (var i = 0; i < queue.length; i++) {
						try { queue[i](); } catch (e) {}
					}
				};
				s.onerror = function () { window.__hlxHitboxLoading = null; };
				(document.head || document.getElementsByTagName('head')[0] || document.documentElement).appendChild(s);
			}
			function switch_weapon(weapon)
				{
					if (!data_array[weapon]) {
						return;
					}
					hlx_hitbox_ensure(function () {
						var data = data_array[weapon];
						window.HLXHitboxModern.render('hitbox-modern', {
							wname: data[0],
							head: data[1],
							leftarm: data[3],
							rightarm: data[2],
							chest: data[4],
							stomach: data[5],
							leftleg: data[7],
							rightleg: data[6],
							model: data[8]
						}, {
							imageBase: '<?php echo IMAGE_PATH; ?>',
							numcolor_num: '#<?php echo $g_options['graphtxt_load']; ?>',
							numcolor_pct: '#<?php echo $g_options['graphtxt_load']; ?>',
							linecolor: '#<?php echo $g_options['graphtxt_load']; ?>',
							barcolor: '#FFFFFF',
							barbackground: '#000000',
							textcolor: '#FFFFFF',
							captioncolor: '#FFFFFF',
							textcolor_total: '#FFFFFF'
						});
					});
				}
			function init_hitbox() {
				switch_weapon('All Weapons');
			}
			if (document.getElementById('hitbox-modern')) {
				init_hitbox();
			} else if (window.addEventListener) {
				window.addEventListener('load', init_hitbox, false);
			} else if (window.attachEvent) {
				window.attachEvent('onload', init_hitbox);
			}
			/* ]]> */
		</script>
<?php
			$tblWeaponstats2->draw($result, $db->num_rows($result), 100);
?>
	</div>
	<div style="float:right;vertical-align:top;width:480px;">
		<table class="data-table">
			<tr class="data-table-head">
				<td style="text-align:center;">Targets</td>
			</tr>
			<tr class="bg1">
				<td style="text-align:center;">
					<div id="hitbox-modern" style="width:470px;height:360px;margin:0 auto;background:#<?php echo $g_options['graphbg_load']; ?>;"></div>
				</td>
			</tr>
			<tr class="bg2">
				<td style="text-align:center;">
					<a href="javascript:switch_weapon('All Weapons');">Show total target statistics</a>
				</td>
			</tr>
		</table>
	</div>
<?php
		}
		else
		{
			$tblWeaponstats2->draw($result, $db->num_rows($result), 95);
		}
?>
	<br /><br />

<?php
	}
?>
