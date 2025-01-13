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
INSERT INTO `themes` VALUES (1,'carbide','Carbon Copy Security','For when your POAMs need military-grade encryption and a dash of industrial chic. So secure, even your cursor needs two-factor authentication.',100),(2,'tungsten','Tungsten Firewall','Harder than your last pentest, smoother than your incident response plan. Warning: May cause excessive confidence in security posture.',100),(3,'darksmooth','Dark SOC','Like your Security Operations Center at 3 AM - smooth, focused, and running on pure caffeine.',100),(4,'graygreen','Zero Day Gray','The color of unpatched vulnerabilities and that queasy feeling when reviewing audit logs.',100),(5,'dusk','Blue Team Blues','For defenders who know that sunset means the start of another security update marathon.',150),(6,'alpine','Alpine Access Control','As pristine as an air-gapped network, as refreshing as a clean vulnerability scan.',150),(7,'mauve','Malware Mauve','The exact color of your face when discovering that one unpatched server.',200),(8,'dustyrose','Legacy Code Rose','For those POAMs that have been aging like fine wine since Windows XP.',200),(9,'dustyzinc','Compliance Crisis','The perfect shade of \"I have 72 hours to complete these POAMs before the auditor arrives\". Pairs well with stress-induced productivity.',200);
/*!40000 ALTER TABLE `themes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-13  9:21:44
