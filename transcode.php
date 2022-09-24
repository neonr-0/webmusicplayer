<?php
session_start();
header('Content-Type: application/json');

//Config
$ffmpegBin = '/usr/bin/ffmpeg';
$codecOpt = ' -n -c:a libopus -b:a 96k -compression_level 0 '; //Opus
//$codecOpt = ' -n -codec:a libmp3lame -qscale:a 6 '; //MP3
$fileformat = '.ogg'; 
//$fileformat = '.mp3'; // use libmp3lame in $codecOpt for MP3 format

//Includes

require_once dirname(__FILE__).'/.config/config.php'; // database
$dataRAW = json_decode(file_get_contents('php://input'), false);

// Check if we received JSON

if ($dataRAW === null) 

{

	$dataAnsw = array('error' => 'unknown'); // default answer

	echo json_encode($dataAnsw, JSON_PRETTY_PRINT); //Send JSON

	exit();

}
$dataAnsw = array('error' => 'input data unknown'); // default answer

//Check JSON
foreach($dataRAW as $key => $value) 
{
	//Check playlist
	if($value->playlist_id)
		if($value->song_id)

		$dataAnsw = APITranscode($value->playlist_id,$value->song_id);
}
echo json_encode($dataAnsw, JSON_PRETTY_PRINT); //Send JSON

//Check and Delete old transcoded files
function CheckTranscodeTempFiles($playlist_id)
{
	$conn = new mysqli(DBSERVER, DBUSER, DBPASSWORD, DBASE);
	$stmt = $conn->prepare("CALL getTranscodedFiles(?);");	
	if($stmt)

	{
		$stmt->bind_param("i",$playlist_id);
		$stmt->execute();
		$result = $stmt->get_result();
		if($result)	
		{

			$dataAnsw = $result->fetch_all(MYSQLI_ASSOC);

			$stmt->close();

			$conn->close();

		}
	}
	if($dataAnsw==null)
		$dataAnsw = array('error' => 'no data');
	else //parse and check if lifetime ended
	{
	$dateNow = date('Y-m-d H:i:s');

	foreach ($dataAnsw as $curIndex)

		{

			if($curIndex['transcoded_lifetime'] < $dateNow)

			{

				if($curIndex['transcoded_file'])

				unlink(dirname(__FILE__).$outFile.$curIndex['transcoded_file']); //delete file

				//Clear file from database

				DBSetSongTranscodeInfo($playlist_id,$curIndex['playlist_item'],'NULL','0');

			}



		}

	}
	return $dataAnsw;

}
function APITranscode($playlist_id,$song_id)
{
	//Check for old tmp files
	@CheckTranscodeTempFiles($playlist_id);
	// Get real path, duration and offset for transcoding
	$conn = new mysqli(DBSERVER, DBUSER, DBPASSWORD, DBASE);
	$stmt = $conn->prepare("CALL getSongPath(?,?);");	
	if($stmt)

	{

		$stmt->bind_param("ii",$playlist_id,$song_id);

		$stmt->execute();

		$result = $stmt->get_result();

		if($result)

		{

			$dataAnsw = $result->fetch_all(MYSQLI_ASSOC);

			$stmt->close();

			$conn->close();

		}

	}
	if($dataAnsw==null)
		$dataAnsw = array('error' => 'no data');
	else 

	{

		//Check if file already exist

		$needTranscode = 0;

		$outFile = '';

		if($dataAnsw[0]['transcoded_file'] && $dataAnsw[0]['transcoded_lifetime'])

		{

			if($dataAnsw[0]['transcoded_lifetime'] < date('Y-m-d H:i:s')) //just need to update lifetime

			$needTranscode = 1; //!!!!!!!!  1 !!!!!!!!!!!!!!

		}

		else

			$needTranscode = 1;



		//add to database tmp file location;

		$current_date_time = date('Y-m-d H:i:s');



		$lifetime = substr($dataAnsw[0]['length'], -5,2)+1;

		$curDate = date(DateTime::ISO8601, strtotime($current_date_time."+".$lifetime." minutes"));

		//Set path
		global $fileformat;
		if($needTranscode==1)

			$outFile = '/tmp/tmp_'.bin2hex(random_bytes(32)).$fileformat;

		else

			$outFile = $dataAnsw[0]['transcoded_file'];
		//Update data
		DBSetSongTranscodeInfo($playlist_id,$song_id,$outFile,$curDate);



		//Transcode
		if($dataAnsw[0]['directoryname'] && $dataAnsw[0]['referenced_file'] && $dataAnsw[0]['length'] && $needTranscode == 1)
		{
			//ffmpeg section
			$output=null;
			$start = '';
			if($dataAnsw[0]['referenced_offset'])
			$start = ' -ss ' . $dataAnsw[0]['referenced_offset'];
			else
			$start = ' -ss ' . '00:00:00';
			if($dataAnsw[0]['length_offset'])
			{

				$end = ' -to ' . $dataAnsw[0]['length_offset'];

			}
			else
			{
				$end = ' -to ' . $dataAnsw[0]['length'];

			}
			$dataAnsw[0]['directoryname'] = substr($dataAnsw[0]['directoryname'], 1);

			global $ffmpegBin,$codecOpt;

			$ffmpeg = $ffmpegBin.' -i "' . dirname(__FILE__).$dataAnsw[0]['directoryname']."/".$dataAnsw[0]['referenced_file'] .'"' . $start . $end . $codecOpt . dirname(__FILE__).$outFile. ' &'; //use '2>/dev/null >/dev/null &' for async execution

			

			// Just in case we have some problems with UTF-8 files

			$locale='en_US.UTF-8';

			setlocale(LC_ALL,$locale);

			putenv('LC_ALL='.$locale);



			$output = shell_exec($ffmpeg); //this works

			//print_r($output); // DEBUG output

			//end of ffmpeg section

		}
		$outFile ='.'.$outFile;

		$dataAnsw = array('path' => $outFile);

	}
	return $dataAnsw;
}
//Set lifetime for temporary transcoded file
function DBSetSongTranscodeInfo($in_playlistid,$in_song_id,$in_filePath,$in_date)
{
		$conn = new mysqli(DBSERVER, DBUSER, DBPASSWORD, DBASE);
		$stmt = $conn->prepare("CALL setSongTranscode(?,?,?,?)");	
		if($stmt)

		{

			$stmt->bind_param("iiss",$in_playlistid,$in_song_id,$in_filePath,$in_date);

			$stmt->execute();

			$result = $stmt->get_result();

			if($result)

			{

				$dataRet = $result->fetch_all(MYSQLI_ASSOC);

				$stmt->close();

				$conn->close();

			}

			else

			{

			if($stmt)

				$stmt->close();

			$conn->close();

			}

		}
	return $dataRet;

}
?>