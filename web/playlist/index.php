<?php

session_start();

header('Content-Type: application/json');

//Includes

require_once dirname(__FILE__).'/../.config/config.php'; // database

$dataRAW = json_decode(file_get_contents('php://input'), false);

if ($dataRAW === null)

{

	$dataAnsw = array('error' => 'unknown'); // default answer

	echo json_encode($dataAnsw, JSON_PRETTY_PRINT); //Send JSON

	exit();

}



$dataAnsw = array('error' => 'input data unknown'); // default answer



foreach($dataRAW as $key => $value) 

{

	// Getting playlist selector

	if($value->getplaylists == 1)

		$dataAnsw = APIgetPlaylists();

	// Getting playlist

	if($value->getplaylist)

		$dataAnsw = APIgetPlaylist($value->getplaylist,$value->limit,$value->offset);

	// Getting maximum amount of songs in playlist

	if($value->getplaylistSongsCount)

		$dataAnsw = APIgetPlaylistSongsCount($value->getplaylistSongsCount);

}



echo json_encode($dataAnsw, JSON_PRETTY_PRINT); //Send JSON



// Getting playlist selector

function APIgetPlaylists()

{

	$conn = new mysqli(DBSERVER, DBUSER, DBPASSWORD, DBASE);

	$stmt = $conn->prepare("SELECT playlists.id, playlists.name, playlists.path FROM playlists");	

	$stmt->execute();

	$result = $stmt->get_result();

	if($result)	

	$dataAnsw = $result->fetch_all(MYSQLI_ASSOC);

	$stmt->close();

	$conn->close();

	if($dataAnsw==null)

		$dataAnsw = array('error' => 'no data');

	return $dataAnsw;

}

// Getting maximum amount of songs in playlist

function APIgetPlaylistSongsCount($id)

{

	$conn = new mysqli(DBSERVER, DBUSER, DBPASSWORD, DBASE);

	$stmt = $conn->prepare("CALL getPlaylistSongCount(?);");	

	if($stmt)

	{

		$stmt->bind_param("i",$id);

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

	return $dataAnsw;

}

// Getting playlist

function APIgetPlaylist($id,$limit,$offset)

{

	$conn = new mysqli(DBSERVER, DBUSER, DBPASSWORD, DBASE);

	$stmt = $conn->prepare("CALL getPlaylist(?,?,?);");

	if($stmt)

	{

		$stmt->bind_param("iii",$id,$limit,$offset);

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

	return $dataAnsw;

}

?>