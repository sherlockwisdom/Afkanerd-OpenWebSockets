-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 21, 2020 at 09:13 PM
-- Server version: 5.7.29-0ubuntu0.18.04.1
-- PHP Version: 7.2.24-0ubuntu0.18.04.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `__DEKU__`
--
CREATE DATABASE IF NOT EXISTS `__DEKU__` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `__DEKU__`;

-- --------------------------------------------------------

--
-- Table structure for table `__CLIENTS__`
--

CREATE TABLE `__CLIENTS__` (
  `__ID__` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `__TOKEN__` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `__DATE__` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `__REQUEST__`
--

CREATE TABLE `__REQUEST__` (
  `__ID__` int(11) NOT NULL,
  `REQ_ID` int(11) NOT NULL,
  `__MESSAGE__` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `__PHONENUMBER__` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `__DATE__` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `__STATUS__` enum('sent','not_sent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_sent'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `__REQUEST__`
--
ALTER TABLE `__REQUEST__`
  ADD PRIMARY KEY (`__ID__`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `__REQUEST__`
--
ALTER TABLE `__REQUEST__`
  MODIFY `__ID__` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
