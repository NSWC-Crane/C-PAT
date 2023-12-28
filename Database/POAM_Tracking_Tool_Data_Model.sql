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
   `phoneNumber` varchar(15) DEFAULT NULL,
   `password` varchar(255) NOT NULL,
   `accountStatus` varchar(45) NOT NULL DEFAULT 'Pending',
   `fullName` varchar(225) DEFAULT NULL,
   `defaultTheme` varchar(20) DEFAULT 'default',
   `isAdmin` int NOT NULL DEFAULT '0',
   PRIMARY KEY (`userId`),
   UNIQUE KEY `userEmail_UNIQUE` (`userEmail`) USING BTREE,
   UNIQUE KEY `userName_UNIQUE` (`userName`)
 )

CREATE TABLE `asset` (
   `assetId` int NOT NULL AUTO_INCREMENT,
   `assetName` varchar(100) NOT NULL,
   `fullyQualifiedDomainName` varchar(100) DEFAULT NULL,
   `collectionId` int NOT NULL,
   `description` varchar(75) DEFAULT NULL,
   `ipAddress` varchar(20) NOT NULL,
   `macAddress` varchar(50) NOT NULL,
   `nonComputing` tinyint(1) NOT NULL DEFAULT '0',
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
   `description` varchar(75) DEFAULT NULL,
   `labelName` varchar(30) NOT NULL,
   `poamCount` int NOT NULL DEFAULT '0',
   PRIMARY KEY (`labelId`),
   UNIQUE KEY `labelName_UNIQUE` (`labelName`)
 );
  
CREATE TABLE `collectionpermissions` (
   `userId` int NOT NULL,
   `collectionId` int NOT NULL,
   `canOwn` tinyint NOT NULL DEFAULT '0',
   `canMaintain` tinyint NOT NULL DEFAULT '0',
   `canApprove` tinyint NOT NULL DEFAULT '0',
   PRIMARY KEY (`userId`,`collectionId`),
   KEY `userId` (`userId`),
   KEY `collectionId` (`collectionId`)
 );

CREATE TABLE `poamapprovers` (
  `poamId` int NOT NULL,
  `userId` int NOT NULL,
  `approved` varchar(12) NOT NULL DEFAULT 'Not Reviewed',
  `approvedDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `comments` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`poamId`,`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  
CREATE TABLE `poamtracking`.`collection` (
   `collectionId` int NOT NULL AUTO_INCREMENT,
   `collectionName` varchar(50) NOT NULL,
   `description` varchar(75) DEFAULT NULL,
   `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `grantCount` int NOT NULL DEFAULT '0',
   `assetCount` int NOT NULL DEFAULT '0',
   `poamCount` int NOT NULL DEFAULT '0',
   PRIMARY KEY (`collectionId`));
  
CREATE TABLE `poam` (
  `poamId` int NOT NULL AUTO_INCREMENT,
  `collectionId` int NOT NULL,
  `vulnerabilitySource` char(6) NOT NULL,
  `aaPackage` varchar(50) NOT NULL,
  `vulnerabilityId` varchar(255) DEFAULT NULL,
  `description` varchar(75) DEFAULT NULL,
  `rawSeverity` char(3) NOT NULL,
  `adjSeverity` char(6) DEFAULT NULL,
  `scheduledCompletionDate` datetime DEFAULT NULL,
  `ownerId` int NOT NULL,
  `mitigations` varchar(2000) DEFAULT NULL,
  `requiredResources` varchar(2000) DEFAULT NULL,
  `milestones` varchar(2000) DEFAULT NULL,
  `residualRisk` varchar(2000) DEFAULT NULL,
  `businessImpact` varchar(2000) DEFAULT NULL,
  `notes` varchar(2000) DEFAULT NULL,
  `status` char(10) NOT NULL DEFAULT 'Draft',
  `poamType` char(10) NOT NULL,
  `vulnIdRestricted` varchar(255) DEFAULT NULL,
  `submittedDate` datetime DEFAULT NULL,
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
  
  
  
  