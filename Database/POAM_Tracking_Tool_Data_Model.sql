/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/


CREATE TABLE `poamtracking`.`user` (
   `userId` int NOT NULL AUTO_INCREMENT,
   `userName` varchar(20) NOT NULL,
   `userEmail` varchar(100) NOT NULL,
   `firstName` varchar(50) NOT NULL,
   `lastName` varchar(50) NOT NULL,
   `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `lastAccess` datetime DEFAULT NULL,
   `lastCollectionAccessedId` int NOT NULL DEFAULT '0',
   `accountStatus` varchar(25) NOT NULL DEFAULT 'Pending',
   `fullName` varchar(100) DEFAULT NULL,
   `defaultTheme` varchar(20) DEFAULT 'dark',
   `isAdmin` int NOT NULL DEFAULT '0',
   PRIMARY KEY (`userId`),
   UNIQUE KEY `userEmail_UNIQUE` (`userEmail`) USING BTREE,
   UNIQUE KEY `userName_UNIQUE` (`userName`)
 )

CREATE TABLE `poamtracking`.`asset` (
  `assetId` INT NOT NULL AUTO_INCREMENT,
  `assetName` VARCHAR(255) NOT NULL,
  `fullyQualifiedDomainName` VARCHAR(255) DEFAULT NULL,
  `collectionId` INT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `ipAddress` VARCHAR(50) DEFAULT NULL,
  `macAddress` VARCHAR(50) DEFAULT NULL,
  `nonComputing` TINYINT(1) DEFAULT '0',
  `metadata` JSON,
  `state` ENUM('enabled', 'disabled'),
  `assetOrigin` VARCHAR(15) NULL DEFAULT 'C-PAT',
  `stateDate` DATETIME,
  `stateUserId` INT,
  `isEnabled` TINYINT GENERATED ALWAYS AS (case when `state` = 'enabled' then 1 else NULL end),
   PRIMARY KEY (`assetId`),
   UNIQUE KEY `assetId_UNIQUE` (`assetId`) /*!80000 INVISIBLE */,
   UNIQUE KEY `assetName_UNIQUE` (`assetName`) /*!80000 INVISIBLE */,
   KEY `CollectionId` (`collectionId`)
 )

CREATE TABLE `poamtracking`.`poamassets` (
   `poamId` int NOT NULL,
   `assetId` int NOT NULL,
   PRIMARY KEY (`poamId`,`assetId`),
   KEY `poamAssetsAssetId` (`assetId`) /*!80000 INVISIBLE */,
   KEY `poamAssetPoamId` (`poamId`)
 )
  
CREATE TABLE `poamtracking`.`poamassignees` (
   `poamId` int NOT NULL,
   `userId` int NOT NULL,
   PRIMARY KEY (`poamId`,`userId`),
   KEY `poamAssigneesPoamId` (`poamId`) /*!80000 INVISIBLE */,
   KEY `poamAssigneesUserId` (`userId`)
 )
  
CREATE TABLE `poamtracking`.`assetlabels` (
   `assetId` int NOT NULL,
   `labelId` int NOT NULL,
   PRIMARY KEY (`assetId`,`labelId`)
 )

CREATE TABLE `poamtracking`.`label` (
   `labelId` int NOT NULL AUTO_INCREMENT,
   `description` varchar(255) DEFAULT NULL,
   `labelName` varchar(50) NOT NULL,
   `poamCount` int NOT NULL DEFAULT '0',
   PRIMARY KEY (`labelId`),
   UNIQUE KEY `labelName_UNIQUE` (`labelName`)
 );
  
CREATE TABLE `poamtracking`.`collectionpermissions` (
   `userId` int NOT NULL,
   `collectionId` int NOT NULL,
   `canOwn` tinyint NOT NULL DEFAULT '0',
   `canMaintain` tinyint NOT NULL DEFAULT '0',
   `canApprove` tinyint NOT NULL DEFAULT '0',
   `canView` tinyint NOT NULL DEFAULT '1',
   PRIMARY KEY (`userId`,`collectionId`),
   KEY `userId` (`userId`),
   KEY `collectionId` (`collectionId`)
 );

CREATE TABLE `poamtracking`.`poamapprovers` (
  `poamId` int NOT NULL,
  `userId` int NOT NULL,
  `approved` varchar(12) NOT NULL DEFAULT 'Not Reviewed',
  `approvedDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `comments` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`poamId`,`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `poamtracking`.`poammilestones` (
  `milestoneId` INT NOT NULL AUTO_INCREMENT,
  `poamId` int NOT NULL,
  `milestoneDate` date DEFAULT NULL,
  `milestoneComments` varchar(2000) DEFAULT '',
  `milestoneStatus` varchar(10) DEFAULT 'Pending',
  PRIMARY KEY (`milestoneId`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  
CREATE TABLE `poamtracking`.`collection` (
  `collectionId` INT NOT NULL AUTO_INCREMENT,
  `collectionName` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `created` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `grantCount` INT DEFAULT '0',
  `assetCount` INT DEFAULT '0',
  `poamCount` INT DEFAULT '0',
  `settings` JSON DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `state` ENUM('enabled', 'disabled', 'cloning'),
  `createdUserId` INT DEFAULT NULL,
  `stateDate` DATETIME DEFAULT NULL,
  `collectionOrigin` VARCHAR(15) NULL DEFAULT 'C-PAT',
  `stateUserId` INT DEFAULT NULL,
  `isEnabled` TINYINT GENERATED ALWAYS AS (case when `state` = 'enabled' then 1 else NULL end),
  `isNameUnavailable` TINYINT GENERATED ALWAYS AS (case when ((`state` = 'cloning') or (`state` = 'enabled')) then 1 else NULL end),
   PRIMARY KEY (`collectionId`));
  
CREATE TABLE `poamtracking`.`poam` (
  `poamId` int NOT NULL AUTO_INCREMENT,
  `collectionId` int DEFAULT '0',
  `vulnerabilitySource` varchar(255) DEFAULT '',
  `stigTitle` varchar(255) DEFAULT '',
  `iavmNumber` varchar(25) DEFAULT '',
  `aaPackage` varchar(50) DEFAULT '',
  `vulnerabilityId` varchar(255) DEFAULT '',
  `description` varchar(2000) DEFAULT '',
  `rawSeverity` varchar(25) DEFAULT '',
  `adjSeverity` varchar(25) DEFAULT '',
  `scheduledCompletionDate` date DEFAULT '1900-01-01',
  `ownerId` int NOT NULL DEFAULT '0',
  `mitigations` TEXT,
  `requiredResources` TEXT,
  `residualRisk` TEXT,
  `notes` TEXT,
  `status` char(10) NOT NULL DEFAULT 'Draft',
  `poamType` CHAR(10) NOT NULL DEFAULT 'Standard',
  `vulnIdRestricted` varchar(255) DEFAULT '',
  `submittedDate` date DEFAULT '1900-01-01',
  `poamitemid` varchar(20) NOT NULL DEFAULT '0',
  `securityControlNumber` varchar(25) DEFAULT '',
  `officeOrg` varchar(100) DEFAULT '',
  `emassStatus` varchar(15) DEFAULT 'Ongoing',
  `predisposingConditions` varchar(2000) DEFAULT '',
  `severity` varchar(25) NOT NULL DEFAULT '',
  `relevanceOfThreat` varchar(15) NOT NULL DEFAULT '',
  `threatDescription` varchar(255) DEFAULT '',
  `likelihood` varchar(15) NOT NULL DEFAULT '',
  `recommendations` varchar(2000) DEFAULT '',
  `devicesAffected` varchar(255) NOT NULL DEFAULT '',
  `businessImpactRating` varchar(25) DEFAULT '',
  `businessImpactDescription` varchar(2000) DEFAULT '',
  `extensionTimeAllowed` INT NULL DEFAULT '0',
  `extensionJustification` varchar(2000) DEFAULT '',
  PRIMARY KEY (`poamId`),
  UNIQUE KEY `poamID_UNIQUE` (`poamId`) /*!80000 INVISIBLE */,
  KEY `collectionId` (`collectionId`) /*!80000 INVISIBLE */,
  KEY `ownerId` (`ownerId`) /*!80000 INVISIBLE */
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `poamtracking`.`adminpermissions` (
  `userId` INT NOT NULL,
  `userName` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`userId`));

CREATE TABLE `poamtracking`.`usertokens` (
  `userName` VARCHAR(20) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expiration` DATETIME NOT NULL,
  PRIMARY KEY (`userName`));
  

  
DELIMITER $$
CREATE PROCEDURE daily_poam_status_update()
BEGIN
    UPDATE poam 
    SET status = 'Expired'
    WHERE
        status IN ('Submitted', 'Rejected') AND
        scheduledCompletionDate + INTERVAL extensionTimeAllowed DAY < CURDATE() AND
        poamId > 0;
END $$

DELIMITER $$
CREATE EVENT poam_expiration_check
ON SCHEDULE EVERY 1 DAY 
STARTS DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 0 HOUR
DO
CALL daily_poam_status_update();
END $$

DELIMITER $$
CREATE TRIGGER `after_asset_insert` 
AFTER INSERT ON `asset` 
FOR EACH ROW 
BEGIN
    UPDATE `collection`
    SET `assetCount` = `assetCount` + 1
    WHERE `collectionId` = NEW.`collectionId`;
END $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `after_asset_delete` 
AFTER DELETE ON `asset` 
FOR EACH ROW 
BEGIN
    UPDATE `collection`
    SET `assetCount` = `assetCount` - 1
    WHERE `collectionId` = OLD.`collectionId`;
END $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `after_asset_update` 
AFTER UPDATE ON `asset` 
FOR EACH ROW 
BEGIN
    IF OLD.`collectionId` != NEW.`collectionId` THEN
        UPDATE `collection`
        SET `assetCount` = `assetCount` - 1
        WHERE `collectionId` = OLD.`collectionId`;

        UPDATE `collection`
        SET `assetCount` = `assetCount` + 1
        WHERE `collectionId` = NEW.`collectionId`;
    END IF;
END $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `after_poamasset_insert`
AFTER INSERT ON `poamtracking`.`poamassets`
FOR EACH ROW
BEGIN
    UPDATE `label` 
    JOIN `assetlabels` ON `label`.`labelId` = `assetlabels`.`labelId`
    SET `label`.`poamCount` = (
        SELECT COUNT(DISTINCT `pa`.`poamId`)
        FROM `poamassets` `pa`
        JOIN `assetlabels` `al` ON `pa`.`assetId` = `al`.`assetId`
        WHERE `al`.`labelId` = `label`.`labelId`
    )
    WHERE `assetlabels`.`assetId` = NEW.`assetId`;
END $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `after_poamasset_delete`
AFTER DELETE ON `poamtracking`.`poamassets`
FOR EACH ROW
BEGIN
    UPDATE `label` 
    JOIN `assetlabels` ON `label`.`labelId` = `assetlabels`.`labelId`
    SET `label`.`poamCount` = (
        SELECT COUNT(DISTINCT `pa`.`poamId`)
        FROM `poamassets` `pa`
        JOIN `assetlabels` `al` ON `pa`.`assetId` = `al`.`assetId`
        WHERE `al`.`labelId` = `label`.`labelId`
    )
    WHERE `assetlabels`.`assetId` = OLD.`assetId`;
END $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `after_poam_insert` 
AFTER INSERT ON `POAM` 
FOR EACH ROW 
BEGIN
    UPDATE `collection`
    SET `poamCount` = `poamCount` + 1
    WHERE `collectionId` = NEW.`collectionId`;
END $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `after_poam_delete` 
AFTER DELETE ON `POAM` 
FOR EACH ROW 
BEGIN
    UPDATE `collection`
    SET `poamCount` = `poamCount` - 1
    WHERE `collectionId` = OLD.`collectionId`;
END $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `after_poam_update` 
AFTER UPDATE ON `POAM` 
FOR EACH ROW 
BEGIN
    IF OLD.`collectionId` != NEW.`collectionId` THEN
        UPDATE `collection` c
        SET c.`poamCount` = c.`poamCount` - 1
        WHERE c.`collectionId` = OLD.`collectionId`;
        
        UPDATE `collection` c
        SET c.`poamCount` = c.`poamCount` + 1
        WHERE c.`collectionId` = NEW.`collectionId`;
    END IF;
END $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER after_collectionpermissions_insert
AFTER INSERT ON collectionpermissions
FOR EACH ROW
BEGIN
    UPDATE collection c
    SET c.grantCount = (SELECT COUNT(*) FROM collectionpermissions WHERE collectionId = NEW.collectionId)
    WHERE c.collectionId = NEW.collectionId;
END $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER after_collectionpermissions_delete
AFTER DELETE ON collectionpermissions
FOR EACH ROW
BEGIN
    UPDATE collection c
    SET c.grantCount = (SELECT COUNT(*) FROM collectionpermissions WHERE collectionId = OLD.collectionId)
    WHERE c.collectionId = OLD.collectionId;
END $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `after_collectionpermissions_update` 
AFTER UPDATE ON `collectionpermissions` 
FOR EACH ROW 
BEGIN
    IF OLD.`collectionId` != NEW.`collectionId` THEN
        UPDATE `collection` c
        SET c.`grantCount` = c.`grantCount` - 1
        WHERE c.`collectionId` = OLD.`collectionId`;
        
        UPDATE `collection` c
        SET c.`grantCount` = c.`grantCount` + 1
        WHERE c.`collectionId` = NEW.`collectionId`;
    END IF;
END $$
DELIMITER ;