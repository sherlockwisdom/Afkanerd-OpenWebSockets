-- phpMyAdmin SQL Dump
-- version 5.0.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Apr 01, 2020 at 11:58 AM
-- Server version: 10.4.11-MariaDB
-- PHP Version: 7.4.2

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `__DEKU_SERVER__`
--
CREATE DATABASE IF NOT EXISTS `__DEKU_SERVER__` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `__DEKU_SERVER__`;

-- --------------------------------------------------------

--
-- Table structure for table `MODEMS`
--

DROP TABLE IF EXISTS `MODEMS`;
CREATE TABLE `MODEMS` (
  `IMEI` int(11) NOT NULL,
  `PHONENUMBER` int(11) NOT NULL,
  `TYPE` enum('ssh','mmcli') COLLATE utf8mb4_unicode_ci NOT NULL,
  `CLIENT_TOKEN` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `CLIENT_ID` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `REQUEST`
--

DROP TABLE IF EXISTS `REQUEST`;
CREATE TABLE `REQUEST` (
  `ID` bigint(20) NOT NULL,
  `CLIENT_TOKEN` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `CLIENT_ID` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `__NUMBER__` int(11) NOT NULL,
  `__STATUS__` enum('sent','not_sent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_sent',
  `DATE` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `__CLIENTS__`
--

DROP TABLE IF EXISTS `__CLIENTS__`;
CREATE TABLE `__CLIENTS__` (
  `__ID__` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `__TOKEN__` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `__DATE__` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `__REQUEST__`
--

DROP TABLE IF EXISTS `__REQUEST__`;
CREATE TABLE `__REQUEST__` (
  `__ID__` int(11) NOT NULL,
  `REQ_ID` bigint(255) NOT NULL,
  `__MESSAGE__` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `__PHONENUMBER__` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `__DATE__` timestamp NOT NULL DEFAULT current_timestamp(),
  `__STATUS__` enum('sent','not_sent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_sent'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `REQUEST`
--
ALTER TABLE `REQUEST`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `__REQUEST__`
--
ALTER TABLE `__REQUEST__`
  ADD PRIMARY KEY (`__ID__`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `REQUEST`
--
ALTER TABLE `REQUEST`
  MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `__REQUEST__`
--
ALTER TABLE `__REQUEST__`
  MODIFY `__ID__` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
