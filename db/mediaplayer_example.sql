DROP PROCEDURE IF EXISTS `getPlaylist`;
DELIMITER //
CREATE PROCEDURE `getPlaylist`(
	IN `inid` BIGINT,
	IN `inLimit` INT,
	IN `inOffset` INT
)
    MODIFIES SQL DATA
    DETERMINISTIC
BEGIN
SET @A = (SELECT path FROM playlists WHERE playlists.id=inid);
set @qry1:= concat('select playlist_item,length,artist,album,album_artist,tracknumber,title,path,directoryname,bitrate,date,codec,cuesheet from ',@A,' LIMIT ', inLimit, ' OFFSET ', inOffset);
prepare stmt from @qry1;
execute stmt;
deallocate prepare stmt;
END//
DELIMITER ;

-- Dumping structure for procedure c5f.getPlaylistSongCount
DROP PROCEDURE IF EXISTS `getPlaylistSongCount`;
DELIMITER //
CREATE PROCEDURE `getPlaylistSongCount`(
	IN `inid` INT
)
BEGIN
SET @A = (SELECT path FROM playlists WHERE playlists.id=inid);
set @qry1:= concat('select COUNT(playlist_item) as count from ',@A);
prepare stmt from @qry1;
execute stmt;
deallocate prepare stmt;
END//
DELIMITER ;

-- Dumping structure for procedure c5f.getSongPath
DROP PROCEDURE IF EXISTS `getSongPath`;
DELIMITER //
CREATE PROCEDURE `getSongPath`(
	IN `inid` INT,
	IN `insid` INT
)
BEGIN
SET @A = (SELECT path FROM playlists WHERE playlists.id=inid);
set @qry1:= concat('select directoryname,referenced_file,referenced_offset,ADDTIME(referenced_offset,length) as length_offset,length,transcoded_file,transcoded_lifetime from ',@A,' WHERE playlist_item=', insid);
prepare stmt from @qry1;
execute stmt;
deallocate prepare stmt;
END//
DELIMITER ;

-- Dumping structure for procedure c5f.getTranscodedFiles
DROP PROCEDURE IF EXISTS `getTranscodedFiles`;
DELIMITER //
CREATE PROCEDURE `getTranscodedFiles`(
	IN `inid` INT
)
BEGIN
SET @A = (SELECT path FROM playlists WHERE playlists.id=inid);
set @qry1:= concat('select playlist_item,transcoded_file,transcoded_lifetime from ',@A,' where transcoded_file is not null');
prepare stmt from @qry1;
execute stmt;
deallocate prepare stmt;
END//
DELIMITER ;

-- Dumping structure for table c5f.playlists
DROP TABLE IF EXISTS `playlists`;
CREATE TABLE IF NOT EXISTS `playlists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL DEFAULT '0',
  `path` varchar(255) NOT NULL DEFAULT '0',
  `accesslevel` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

-- Dumping data for table c5f.playlists: ~2 rows (approximately)
INSERT INTO `playlists` (`id`, `name`, `path`, `accesslevel`) VALUES
	(1, 'DEMO', 'playlist_demo', 0);

-- Dumping structure for procedure c5f.setSongTranscode
DROP PROCEDURE IF EXISTS `setSongTranscode`;
DELIMITER //
CREATE PROCEDURE `setSongTranscode`(
	IN `inid` INT,
	IN `songid` INT,
	IN `fpath` TEXT,
	IN `lifetime` DATETIME
)
BEGIN
SET @A = (SELECT path FROM playlists WHERE playlists.id=inid);
set @qry1 ='';
IF (fpath = 'NULL') THEN
set @qry1:= concat('UPDATE ',@A,' SET transcoded_file=NULL, transcoded_lifetime=\'', lifetime , '\' WHERE playlist_item=', songid);
ELSE
set @qry1:= concat('UPDATE ',@A,' SET transcoded_file=\'', fpath, '\', transcoded_lifetime=\'', lifetime , '\' WHERE playlist_item=', songid);
END IF;
prepare stmt from @qry1;
execute stmt;
deallocate prepare stmt;
END//
DELIMITER ;
