-- MySQL dump 10.13  Distrib 9.0.1, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: cpat
-- ------------------------------------------------------
-- Server version	9.0.1

/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_migrations`
--

DROP TABLE IF EXISTS `_migrations`;
CREATE TABLE `_migrations` (
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `name` varchar(128) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `aapackages`
--

DROP TABLE IF EXISTS `aapackages`;
CREATE TABLE `aapackages` (
  `aaPackageId` int NOT NULL AUTO_INCREMENT,
  `aaPackage` varchar(50) NOT NULL,
  PRIMARY KEY (`aaPackageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `asset`
--

DROP TABLE IF EXISTS `asset`;
CREATE TABLE `asset` (
  `assetId` int NOT NULL AUTO_INCREMENT,
  `assetName` varchar(255) NOT NULL,
  `fullyQualifiedDomainName` varchar(255) DEFAULT NULL,
  `collectionId` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `ipAddress` varchar(50) DEFAULT NULL,
  `macAddress` varchar(50) DEFAULT NULL,
  `nonComputing` tinyint(1) DEFAULT '0',
  `assetOrigin` varchar(15) DEFAULT 'C-PAT',
  PRIMARY KEY (`assetId`),
  UNIQUE KEY `assetId_UNIQUE` (`assetId`),
  KEY `idx_asset_collectionId` (`collectionId`),
  KEY `idx_asset_assetName` (`assetName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `assetlabels`
--

DROP TABLE IF EXISTS `assetlabels`;
CREATE TABLE `assetlabels` (
  `assetId` int NOT NULL,
  `collectionId` int NOT NULL,
  `labelId` int NOT NULL,
  PRIMARY KEY (`assetId`,`labelId`),
  KEY `fk_assetlabels_collection` (`collectionId`),
  CONSTRAINT `fk_assetlabels_asset` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`) ON DELETE CASCADE,
  CONSTRAINT `fk_assetlabels_collection` FOREIGN KEY (`collectionId`) REFERENCES `collection` (`collectionId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `collection`
--

DROP TABLE IF EXISTS `collection`;
CREATE TABLE `collection` (
  `collectionId` int NOT NULL AUTO_INCREMENT,
  `collectionName` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `collectionOrigin` varchar(15) DEFAULT 'C-PAT',
  `originCollectionId` int DEFAULT NULL,
  PRIMARY KEY (`collectionId`),
  KEY `idx_collection_collectionName` (`collectionName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `collectionpermissions`
--

DROP TABLE IF EXISTS `collectionpermissions`;
CREATE TABLE `collectionpermissions` (
  `userId` int NOT NULL,
  `collectionId` int NOT NULL,
  `accessLevel` int NOT NULL,
  PRIMARY KEY (`userId`,`collectionId`),
  KEY `idx_collectionpermissions_userId` (`userId`),
  KEY `idx_collectionpermissions_collectionId` (`collectionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
CREATE TABLE `config` (
  `key` varchar(45) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `iav`
--

DROP TABLE IF EXISTS `iav`;
CREATE TABLE `iav` (
  `iav` varchar(25) NOT NULL,
  `status` varchar(25) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `iavCat` tinyint(1) DEFAULT NULL,
  `type` char(1) NOT NULL,
  `releaseDate` date DEFAULT NULL,
  `navyComplyDate` date DEFAULT NULL,
  `supersededBy` varchar(25) DEFAULT NULL,
  `knownExploits` varchar(3) DEFAULT NULL,
  `knownDodIncidents` varchar(3) DEFAULT NULL,
  `nessusPlugins` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`iav`),
  UNIQUE KEY `iav_UNIQUE` (`iav`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `iav_plugin`
--

DROP TABLE IF EXISTS `iav_plugin`;
CREATE TABLE `iav_plugin` (
  `iav` varchar(25) NOT NULL,
  `pluginID` int NOT NULL,
  PRIMARY KEY (`iav`,`pluginID`),
  KEY `idx_pluginID` (`pluginID`),
  CONSTRAINT `iav_plugin_ibfk_1` FOREIGN KEY (`iav`) REFERENCES `iav` (`iav`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `label`
--

DROP TABLE IF EXISTS `label`;
CREATE TABLE `label` (
  `labelId` int NOT NULL AUTO_INCREMENT,
  `collectionId` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `labelName` varchar(50) NOT NULL,
  `stigmanLabelId` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`labelId`),
  UNIQUE KEY `label_collection_UNIQUE` (`labelName`,`collectionId`),
  KEY `idx_label_collectionId` (`collectionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `marketplace`
--

DROP TABLE IF EXISTS `marketplace`;
CREATE TABLE `marketplace` (
  `transactionId` int NOT NULL AUTO_INCREMENT,
  `themeId` int NOT NULL,
  `userId` int NOT NULL,
  `purchaseDate` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transactionId`),
  KEY `themeId` (`themeId`),
  KEY `userId` (`userId`),
  CONSTRAINT `marketplace_ibfk_1` FOREIGN KEY (`themeId`) REFERENCES `themes` (`themeId`),
  CONSTRAINT `marketplace_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
CREATE TABLE `notification` (
  `notificationId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `read` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`notificationId`),
  KEY `idx_notification_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `poam`
--

DROP TABLE IF EXISTS `poam`;
CREATE TABLE `poam` (
  `poamId` int NOT NULL AUTO_INCREMENT,
  `collectionId` int DEFAULT '0',
  `status` char(50) DEFAULT 'Draft',
  `rawSeverity` varchar(25) DEFAULT '',
  `adjSeverity` varchar(25) DEFAULT '',
  `vulnerabilitySource` varchar(255) DEFAULT '',
  `vulnerabilityId` varchar(255) DEFAULT '',
  `aaPackage` varchar(50) DEFAULT '',
  `submittedDate` date DEFAULT NULL,
  `scheduledCompletionDate` date DEFAULT NULL,
  `closedDate` date DEFAULT NULL,
  `iavComplyByDate` date DEFAULT NULL,
  `stigTitle` varchar(255) DEFAULT NULL,
  `stigBenchmarkId` varchar(255) DEFAULT NULL,
  `stigCheckData` text,
  `tenablePluginData` text,
  `iavmNumber` varchar(25) DEFAULT '',
  `description` text,
  `mitigations` text,
  `requiredResources` text,
  `residualRisk` varchar(25) DEFAULT NULL,
  `submitterId` int NOT NULL DEFAULT '0',
  `officeOrg` varchar(100) DEFAULT '',
  `predisposingConditions` varchar(2000) DEFAULT '',
  `severity` varchar(25) DEFAULT '',
  `likelihood` varchar(15) DEFAULT '',
  `impactDescription` varchar(2000) DEFAULT '',
  `extensionTimeAllowed` int DEFAULT '0',
  `extensionJustification` varchar(2000) DEFAULT '',
  `hqs` tinyint(1) NOT NULL DEFAULT '0',
  `created` date NOT NULL DEFAULT (curdate()),
  `lastUpdated` date DEFAULT NULL,
  PRIMARY KEY (`poamId`),
  UNIQUE KEY `poamID_UNIQUE` (`poamId`),
  KEY `idx_poam_collectionId` (`collectionId`),
  KEY `idx_poam_vulnerabilityId` (`vulnerabilityId`),
  KEY `idx_poam_submitterId` (`submitterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `prevent_created_update` BEFORE UPDATE ON `poam` FOR EACH ROW BEGIN
    IF NEW.created != OLD.created THEN
        SET NEW.created = OLD.created;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `poamapprovers`
--

DROP TABLE IF EXISTS `poamapprovers`;
CREATE TABLE `poamapprovers` (
  `poamId` int NOT NULL,
  `userId` int NOT NULL,
  `approvalStatus` varchar(12) NOT NULL DEFAULT 'Not Reviewed',
  `approvedDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `comments` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`poamId`,`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poamapprovers_insert` AFTER INSERT ON `poamapprovers` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = NEW.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poamapprovers_update` AFTER UPDATE ON `poamapprovers` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = NEW.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poamapprovers_delete` AFTER DELETE ON `poamapprovers` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = OLD.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `poamassets`
--

DROP TABLE IF EXISTS `poamassets`;
CREATE TABLE `poamassets` (
  `poamId` int NOT NULL,
  `assetId` int NOT NULL,
  PRIMARY KEY (`poamId`,`assetId`),
  KEY `idx_poamassets_assetId` (`assetId`),
  KEY `idx_poamassets_poamId` (`poamId`),
  CONSTRAINT `fk_poamassets_asset` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poamassets_insert` AFTER INSERT ON `poamassets` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = NEW.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poamassets_delete` AFTER DELETE ON `poamassets` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = OLD.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `poamassignees`
--

DROP TABLE IF EXISTS `poamassignees`;
CREATE TABLE `poamassignees` (
  `poamId` int NOT NULL,
  `userId` int NOT NULL,
  PRIMARY KEY (`poamId`,`userId`),
  KEY `idx_poamassignees_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poamassignees_insert` AFTER INSERT ON `poamassignees` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = NEW.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poamassignees_update` AFTER UPDATE ON `poamassignees` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = NEW.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poamassignees_delete` AFTER DELETE ON `poamassignees` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = OLD.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `poamlabels`
--

DROP TABLE IF EXISTS `poamlabels`;
CREATE TABLE `poamlabels` (
  `poamId` int NOT NULL,
  `labelId` int NOT NULL,
  PRIMARY KEY (`poamId`,`labelId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poamlabels_insert` AFTER INSERT ON `poamlabels` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = NEW.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poamlabels_update` AFTER UPDATE ON `poamlabels` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = NEW.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poamlabels_delete` AFTER DELETE ON `poamlabels` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = OLD.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `poamlogs`
--

DROP TABLE IF EXISTS `poamlogs`;
CREATE TABLE `poamlogs` (
  `poamLogId` int NOT NULL AUTO_INCREMENT,
  `poamId` int NOT NULL,
  `userId` int NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `action` varchar(2000) NOT NULL,
  PRIMARY KEY (`poamLogId`),
  KEY `idx_poamlogs_poamId` (`poamId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poamlogs_insert` AFTER INSERT ON `poamlogs` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = NEW.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `poammilestones`
--

DROP TABLE IF EXISTS `poammilestones`;
CREATE TABLE `poammilestones` (
  `milestoneId` int NOT NULL AUTO_INCREMENT,
  `poamId` int NOT NULL,
  `milestoneDate` date DEFAULT NULL,
  `milestoneComments` varchar(2000) DEFAULT NULL,
  `milestoneStatus` varchar(10) DEFAULT 'Pending',
  `milestoneChangeComments` varchar(2000) DEFAULT NULL,
  `milestoneChangeDate` date DEFAULT NULL,
  `milestoneTeam` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`milestoneId`),
  KEY `idx_poammilestones_poamId` (`poamId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poammilestones_insert` AFTER INSERT ON `poammilestones` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = NEW.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poammilestones_update` AFTER UPDATE ON `poammilestones` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = NEW.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_poammilestones_delete` AFTER DELETE ON `poammilestones` FOR EACH ROW BEGIN
    UPDATE poam
    SET lastUpdated = CURRENT_DATE
    WHERE poamId = OLD.poamId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `themes`
--

DROP TABLE IF EXISTS `themes`;
CREATE TABLE `themes` (
  `themeId` int NOT NULL AUTO_INCREMENT,
  `themeIdentifier` varchar(25) NOT NULL,
  `themeName` varchar(50) NOT NULL,
  `themeDescription` varchar(255) DEFAULT NULL,
  `cost` int NOT NULL,
  PRIMARY KEY (`themeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `userId` int NOT NULL AUTO_INCREMENT,
  `userName` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL DEFAULT ' ',
  `firstName` varchar(50) NOT NULL DEFAULT ' ',
  `lastName` varchar(50) NOT NULL DEFAULT ' ',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastAccess` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastCollectionAccessedId` int NOT NULL DEFAULT '0',
  `accountStatus` varchar(25) NOT NULL DEFAULT 'PENDING',
  `fullName` varchar(100) DEFAULT NULL,
  `officeOrg` varchar(100) DEFAULT 'UNKNOWN',
  `defaultTheme` varchar(50) DEFAULT 'lara-dark-blue',
  `isAdmin` int NOT NULL DEFAULT '0',
  `lastClaims` json DEFAULT (_utf8mb4'{}'),
  `points` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`userId`),
  UNIQUE KEY `userEmail_UNIQUE` (`email`) USING BTREE,
  UNIQUE KEY `userName_UNIQUE` (`userName`),
  KEY `idx_user_userName` (`userName`),
  KEY `idx_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-08-30 11:05:59
