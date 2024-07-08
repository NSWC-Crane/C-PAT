-- MySQL dump 10.13  Distrib 8.0.35, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: cpat
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `_migrations`
--

LOCK TABLES `_migrations` WRITE;
/*!40000 ALTER TABLE `_migrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `themes`
--

LOCK TABLES `themes` WRITE;
/*!40000 ALTER TABLE `themes` DISABLE KEYS */;
INSERT INTO `themes` VALUES (1,'material-dark','Material Dark','A sleek and modern dark theme with a wild pink twist. It’s like a coffee break for your eyes without the caffeine jitters.',100),(2,'material-light','Material Light','Why work in a bland office when you can have the boldness of a grape soda-can right in front of you? These purple hues will have you conquering your POAMs with a majestic flair.',100),(3,'aquamarine','Aquamarine','Designed to be a calming theme inspired by the ocean, offering a serene and relaxing visual experience while you endlessly grind away at POAMs.',100),(4,'amber','Amber','A spin on the Slate theme with a touch of color. This theme\'s dark elegance and mysterious aura will make you feel like a secret agent hacking into the mainframe.',50),(5,'breeze','Breeze','Imagine working POAMs on a crisp, sunny day with a gentle breeze ruffling your hair. This theme’s light blue accents on a gray background will make you feel like you’re working on a beachside balcony. ',50),(6,'danger','Danger','Feeling adventurous? The Danger theme’s red accents on a gray background will make every POAM feel like defusing a bomb.',50),(7,'forrest','Forrest','With green accents on a gray background, it’s like working from a cozy cabin in the woods. Just don\'t let the squirrels distract you from your POAMs!',50);
/*!40000 ALTER TABLE `themes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `collection`
--

LOCK TABLES `collection` WRITE;
/*!40000 ALTER TABLE `collection` DISABLE KEYS */;
INSERT IGNORE INTO `collection` VALUES (1,'eMASS','eMASS Imports',CURRENT_TIMESTAMP,0,0,'C-PAT');
/*!40000 ALTER TABLE `collection` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-06-07 15:22:02
