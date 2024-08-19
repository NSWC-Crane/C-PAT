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
INSERT INTO `themes` VALUES (1,'bootstrap4-dark-purple','Bootstrap Dark Purple','Welcome to the Eggplant Colored Extravaganza! This theme is so aubergine, you\'ll be dreaming of ratatouille while managing your POAMs.',150),(2,'bootstrap4-light-purple','Bootstrap Light Purple','Feeling royal? This lavender luxury will have you sipping imaginary Earl Grey tea while conquering your POAMs like a proper monarch.',50),(3,'bootstrap4-dark-blue','Bootstrap Dark Blue','Dive into the Deep Blue Data Sea! This theme is so oceanic, you might need scuba gear to navigate your tasks. Watch out for the occasional digital jellyfish - they sting with extra work!',150),(4,'bootstrap4-light-blue','Bootstrap Light Blue','Welcome to Cloud Nine Computing! This sky-blue theme is so light and airy, your POAMs might just float away. Don\'t forget to tie them down with a virtual paperweight!',50),(5,'soho-dark','Soho Dark','Step into the Soho Speakeasy of Productivity! This sleek, dark theme is so hip, your POAMs will start wearing tiny berets and discussing existential philosophy.',200),(6,'soho-light','Soho Light','Ah, Soho-light - where your POAMs dress in designer labels and sip overpriced lattes. It\'s so trendy, your tasks might start referring to themselves as \'bespoke action items.\' Just remember, even if a POAM asks for avocado toast, it\'s still work!',50),(7,'viva-dark','Viva Dark','Step into the Viva Las Vegas of Productivity! This dark, sleek theme is so alluring, your POAMs might start doing Elvis impersonations.',100),(8,'viva-light','Viva Light','Viva-light, where your POAMs party like it\'s 1999, but it\'s actually Monday morning. This theme is so bright and cheerful, your tasks might start wearing sunglasses indoors and calling everyone \'dude.\' ',50);
/*!40000 ALTER TABLE `themes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-08-19 12:21:32
