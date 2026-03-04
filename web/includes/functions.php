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

function checkValidGame(string $gameStr, array $allowedGames, ?string &$retError) : bool
{
	// Not object and array
	if (!is_string($gameStr)) {
		$retError = 'Invalid game parameter.';
		return false;
	}

	$gameStr = trim($gameStr);
	if ($gameStr === '') {
		$retError = 'Game parameter missing.';
		return false;
	}

	// Path traversal and XSS fixes
	if (!preg_match('/^[a-zA-Z0-9_]+$/', $gameStr)) {
		$retError = 'Invalid game code.';
		return false;
	}

	if (!is_array($allowedGames) || empty($allowedGames)) {
		$retError = 'Failed to get list of allowed games.';
		return false;
	}

	if (!in_array($gameStr, $allowedGames, true)) {
		$retError = 'This game is not allowed.';
		return false;
	}

	return true;
}

function buildSearchSqlSafe($db, $search)
{
	$search = trim($search);
	if ($search === '') {
		return "";
	}

	$len = mb_strlen($search, 'UTF-8');
	$like_filter = $db->escape(addcslashes($search, '%_'));
	$match_filter = $db->escape($search);

	// 'MATCH' - doesn't work for text shorter than 4 characters. Fixed without editing the mysql cfg.
	if ($len <= 3) {
		if ($len == 1) {
			return " AND hlstats_Events_Chat.message LIKE '%{$like_filter}%'";
		}

		return " AND (
			hlstats_Events_Chat.message = '{$like_filter}'
			OR hlstats_Events_Chat.message LIKE '{$like_filter} %'
			OR hlstats_Events_Chat.message LIKE '% {$like_filter}'
			OR hlstats_Events_Chat.message LIKE '% {$like_filter} %'
		)";
	}

	return " AND MATCH (hlstats_Events_Chat.message) AGAINST ('{$match_filter}' IN BOOLEAN MODE)";
}

// Support for legacy code, it used array $_REQUEST, for _GET, and _POST?
// Filter arrays
function getChatFilterParam()
{
	$retFilter = '';

	$postFilter = filter_input(INPUT_POST, 'filter', FILTER_UNSAFE_RAW);
	$getFilter = filter_input(INPUT_GET, 'filter', FILTER_UNSAFE_RAW);

	if ($postFilter !== null && $postFilter !== false) {
		$retFilter = $postFilter;
	} elseif ($getFilter !== null && $getFilter !== false) {
		$retFilter = $getFilter;
	}

	$retFilter = (string)$retFilter;
	return trim($retFilter);
}

function eHtml($str)
{
    return htmlspecialchars($str, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

// Test if flags exists
/**
 * getFlag()
 * 
 * @param string $flag
 * @param string $type
 * @return string Either the flag or default flag if none exists
 */
function getFlag($flag, $type='url')
{
	$image = getImage('/flags/'.strtolower($flag));
	if ($image)
		return $image[$type];
	else
		return IMAGE_PATH.'/flags/0.gif';
}

/**
 * valid_request()
 * 
 * @param string $str
 * @param boolean $numeric
 * @return mixed request
 */
function valid_request($str, $numeric = false)
{
	$search_pattern = array("/[^A-Za-z0-9\[\]*.,=()!\"$%&^`ґ':;ЯІі#+~_\-|<>\/\\\\@{}дцьДЦЬ ]/");
	$replace_pattern = array('');
	$str = preg_replace($search_pattern, $replace_pattern, $str);

	if (!$numeric) {
		return htmlspecialchars($str, ENT_QUOTES);
	}

	if (is_numeric($str)) {
		return intval($str);
	}

	return -1;
}

/**
 * timestamp_to_str()
 * 
 * @param integer $timestamp
 * @return string Formatted Timestamp
 */
function timestamp_to_str($seconds)
{
    // We allow passing an empty parameter, for output in html
	if (empty($seconds)) {
		return '---';
	}

    // If something other than int or float is passed here, then return 'Undefined'
	if (!is_numeric($seconds)) {
		return "Undefined";
	}

    // DateTime class doesn't work with float type,
    // doesn't matter we don't need microsecond precision :D
	$seconds = round($seconds);

	$dtF = new \DateTime('@0');
	$dtT = new \DateTime("@$seconds");

	return $dtF->diff($dtT)->format('%ad&nbsp;%H:%I:%Sh');
}

/**
 * error()
 * Formats and outputs the given error message. Optionally terminates script
 * processing.
 * 
 * @param mixed $message
 * @param bool $exit
 * @return void
 */
function error(string $message, bool $exit = true) : void
{
    $html = '<table style="border:1px solid red;padding:1em;margin:1em;background:#fee;">';

    $html .= '<thead style="text-align:center; color:#673636;">';
    $html .= '<tr>';
    $html .= '<td class="errorhead">ERROR</td>';
    $html .= '</tr>';
    $html .= '</thead>';

    $html .= '<tbody>';
    $html .= '<tr>';
    $html .= '<td class="errortext">' . eHtml($message) . '</td>';
    $html .= '</tr>';
    $html .= '</tbody>';

    $html .= '</table>';

    echo $html;

    if ($exit) {
        exit;
    }
}

//
// string makeQueryString (string key, string value, [array notkeys])
//
// Generates an HTTP GET query string from the current HTTP GET variables,
// plus the given 'key' and 'value' pair. Any current HTTP GET variables
// whose keys appear in the 'notkeys' array, or are the same as 'key', will
// be excluded from the returned query string.
//

/**
 * makeQueryString()
 * 
 * @param mixed $key
 * @param mixed $value
 * @param mixed $notkeys
 * @return
 */
function makeQueryString($key, $value, $notkeys = array())
{
	$params = $_GET;
	$params[$key] = $value;

	// We remove disabled keys (for example, "page" when changing sorting)
	foreach ($notkeys as $remove) {
		unset($params[$remove]);
	}

	// Building a query string
	return http_build_query($params);
}

//
// void pageHeader (array title, array location)
//
// Prints the page heading.
//

/**
 * pageHeader()
 * 
 * @param mixed $title
 * @param mixed $location
 * @return
 */
function pageHeader($title = '', $location = '')
{
	global $db, $g_options;
	if ( defined('PAGE') && PAGE == 'HLSTATS' )
		include (PAGE_PATH . '/header.php');
	elseif ( defined('PAGE') && PAGE == 'INGAME' )
		include (PAGE_PATH . '/ingame/header.php');
}


//
// void pageFooter (void)
//
// Prints the page footer.
//

/**
 * pageFooter()
 * 
 * @return
 */
function pageFooter()
{
	global $g_options;
	if ( defined('PAGE') && PAGE == 'HLSTATS' )
		include (PAGE_PATH . '/footer.php');
	elseif ( defined('PAGE') && PAGE == 'INGAME' )
		include (PAGE_PATH . '/ingame/footer.php');
}

/**
 * getSortArrow()
 * 
 * @param mixed $sort
 * @param mixed $sortorder
 * @param mixed $name
 * @param mixed $longname
 * @param string $var_sort
 * @param string $var_sortorder
 * @param string $sorthash
 * @return string Returns the code for a sort arrow <IMG> tag.
 */
function getSortArrow($sort, $sortorder, $name, $longname, $var_sort = 'sort', $var_sortorder =
	'sortorder', $sorthash = '', $ajax = false)
{
	global $g_options;

	if ($sortorder == 'asc')
	{
		$sortimg = 'sort-ascending.gif';
		$othersortorder = 'desc';
	}
	else
	{
		$sortimg = 'sort-descending.gif';
		$othersortorder = 'asc';
	}
	
	$arrowstring = '<a href="' . $g_options['scripturl'] . '?' . makeQueryString($var_sort, $name,
		array($var_sortorder));

	if ($sort == $name)
	{
		$arrowstring .= "&amp;$var_sortorder=$othersortorder";
		$jsarrow = "'" . $var_sortorder . "': '" . $othersortorder . "'";
	}
	else
	{
		$arrowstring .= "&amp;$var_sortorder=$sortorder";
		$jsarrow = "'" . $var_sortorder . "': '" . $sortorder . "'";
	}

	if ($sorthash)
	{
		$arrowstring .= "#$sorthash";
	}

	$arrowstring .= '" class="head"';
	
	if ( $ajax )
	{
		$arrowstring .= " onclick=\"Tabs.refreshTab({'$var_sort': '$name', $jsarrow}); return false;\"";
	}
	
	$arrowstring .= ' title="Change sorting order">' . "$longname</a>";

	if ($sort == $name)
	{
		$arrowstring .= '&nbsp;<img src="' . IMAGE_PATH . "/$sortimg\"" .
			" style=\"padding-left:4px;padding-right:4px;\" alt=\"$sortimg\" />";
	}


	return $arrowstring;
}

/**
 * getSelect()
 * Returns the HTML for a SELECT box, generated using the 'values' array.
 * Each key in the array should be a OPTION VALUE, while each value in the
 * array should be a corresponding descriptive name for the OPTION.
 * 
 * @param mixed $name
 * @param mixed $values
 * @param string $currentvalue
 * @return The 'currentvalue' will be given the SELECTED attribute.
 */
function getSelect($name, $values, $currentvalue = '')
{
	$select = "<select name=\"$name\" style=\"width:300px;\">\n";

	$gotcval = false;

	foreach ($values as $k => $v)
	{
		$select .= "\t<option value=\"$k\"";

		if ($k == $currentvalue)
		{
			$select .= ' selected="selected"';
			$gotcval = true;
		}

		$select .= ">$v</option>\n";
	}

	if ($currentvalue && !$gotcval)
	{
		$select .= "\t<option value=\"$currentvalue\" selected=\"selected\">$currentvalue</option>\n";
	}

	$select .= '</select>';

	return $select;
}

/**
 * getLink()
 * 
 * @param mixed $url
 * @param integer $maxlength
 * @param string $type
 * @param string $target
 * @return
 */
 
function getLink($url, $type = 'http://', $target = '_blank')
{
	$urld=parse_url($url);

	if(!isset($urld['scheme']) && (!isset($urld['host']) && isset($urld['path'])))
	{
			$urld['scheme']=str_replace('://', '', $type);
			$urld['host']=$urld['path'];
			unset($urld['path']);
	}

	if($urld['scheme']!='http' && $urld['scheme']!='https')
	{
			return 'Invalid Url :(';
	}

	if(!isset($urld['path']))
	{
			$urld['path']='';
	}

	if(!isset($urld['query']))
	{
			$urld['query']='';
	}
	else
	{
			$urld['query']='?' . urlencode($urld['query']);
	}

	if(!isset($urld['fragment']))
	{
			$urld['fragment']='';
	}
	else
	{
			$urld['fragment']='#' . urlencode($urld['fragment']);
	}

	$uri=sprintf("%s%s%s", $urld['path'], $urld['query'], $urld['fragment']);
	$host_uri=$urld['host'] . $uri;
	return sprintf('<a href="%s://%s%s" target="%s">%s</a>',$urld['scheme'], $urld['host'], $uri, $target, htmlspecialchars($host_uri, ENT_COMPAT));
}

/**
 * Generate a safe mailto link for an email address.
 * Validates the email, trims it, blocks dangerous characters,
 * converts to lowercase, and safely truncates display text.
 *
 * Note: does not support ASCII characters.
 *
 * @param string|null $email The email address to link
 * @param int $maxLength Maximum length of the displayed email
 * @return string HTML link or empty string if invalid
 */
function getEmailLink(?string $email, int $maxLength = 40) : string
{
	// 1. Return empty string if email is null or empty
	if (!$email) {
		return '';
	}

	// 2. Remove leading/trailing whitespace
	$email = trim($email);

	// 3. Validate email format using PHP filter
	if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
		return '';
	}

	// 4. Block dangerous characters for mailto and HTML
	// Disallow: double/single quotes, <, >, ?, and whitespace
	if (preg_match('/[?"\'<>\s]/', $email)) {
		return '';
	}

	// 5. Normalize email to lowercase for consistent display
	$email = mb_strtolower($email, 'UTF-8');

	// 6. Trim the email for display if it exceeds max length
	// mb_strimwidth ensures multibyte safe truncation
	$display = mb_strimwidth($email, 0, $maxLength, '...', 'UTF-8');

	// 7. Construct the mailto URL
	$url = 'mailto:' . $email;

	// 8. Return safe HTML link
	// eHtml should escape HTML special characters to prevent XSS
	return sprintf('<a href="%s">%s</a>', eHtml($url), eHtml($display));
}

/**
 * getImage()
 * 
 * @param string $filename
 * @return mixed Either the image if exists, or false otherwise
 */
function getImage($filename)
{
	preg_match('/^(.*\/)(.+)$/', $filename, $matches);
	$relpath = $matches[1];
	$realfilename = $matches[2];
	
	$path = IMAGE_PATH . $filename;
	$url = IMAGE_PATH . $relpath . rawurlencode($realfilename);

	// check if image exists
	if (file_exists($path . '.png'))
	{
		$ext = 'png';
	} elseif (file_exists($path . '.gif'))
	{
		$ext = 'gif';
	} elseif (file_exists($path . '.jpg'))
	{
		$ext = 'jpg';
	}
	else
	{
		$ext = '';
	}

	if ($ext)
	{
		$size = getImageSize("$path.$ext");

		return array('url' => "$url.$ext", 'path' => "$path.$ext", 'width' => $size[0], 'height' => $size[1],
			'size' => $size[3]);
	}

    return false;
}

function printSectionTitle($title, $echo = true)
{
	$html = '<span class="fHeading">';
	$html .= '&nbsp;<img src="' . TITLE_IMAGE . '" alt="">';
	$html .= '&nbsp;' . eHtml($title);
	$html .= '</span>';
	$html .= '<br><br>';

	if (!$echo) {
		return $html;
	}

	echo $html;
}

/**
 * Convert hex color to RGB array.
 *
 * @param string $hexVal Color in hex format (e.g. "FF00CC" or "#FF00CC").
 * @return array{red: int, green: int, blue: int}|null Associative array or null on failure.
 */
function tryHexToRgb($hexVal = '') : ?array
{
	$hexVal = ltrim($hexVal, '#');

	if (!preg_match('/^[0-9A-F]{6}$/i', $hexVal)) {
		return null;
	}

	$parts = str_split($hexVal, 2);
	$rgb = array_map('hexdec', $parts);

	return [
		'red'   => $rgb[0],
		'green' => $rgb[1],
		'blue'  => $rgb[2],
	];
}

// Deprecated function
function hex2rgb($hexVal = '')
{
	$hexVal = preg_replace('[^a-fA-F0-9]', '', $hexVal);
	if (strlen($hexVal) != 6)
	{
		return 'ERR: Incorrect colorcode, expecting 6 chars (a-f, 0-9)';
	}
	$arrTmp = explode(' ', chunk_split($hexVal, 2, ' '));
	$arrTmp = array_map('hexdec', $arrTmp);
	return array('red' => $arrTmp[0], 'green' => $arrTmp[1], 'blue' => $arrTmp[2]);
}
