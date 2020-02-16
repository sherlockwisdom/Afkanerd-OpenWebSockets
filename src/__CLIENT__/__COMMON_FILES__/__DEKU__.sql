-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Feb 11, 2020 at 11:13 AM
-- Server version: 10.4.11-MariaDB
-- PHP Version: 7.4.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
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
  `__DATE__` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `__CLIENTS__`
--

INSERT INTO `__CLIENTS__` (`__ID__`, `__TOKEN__`, `__DATE__`) VALUES
('DEVELOPER_ID', 'DEVELOPER_TOKEN', '2020-02-11 02:41:26');

-- --------------------------------------------------------

--
-- Table structure for table `__REQUEST__`
--

CREATE TABLE `__REQUEST__` (
  `__ID__` int(11) NOT NULL,
  `__USER_ID__` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `__MESSAGE__` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `__PHONENUMBER__` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `__DATE__` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `__REQUEST__`
--

INSERT INTO `__REQUEST__` (`__ID__`, `__USER_ID__`, `__MESSAGE__`, `__PHONENUMBER__`, `__DATE__`) VALUES
(1, 'DEVELOPER_ID', 'DEVELOPER_MESSAGE', 'DEVELOPER_PHONENUMBER', '2020-02-11 10:51:43'),
(2, 'DEVELOPER_ID', 'DEVELOPER_MESSAGE', 'DEVELOPER_PHONENUMBER', '2020-02-11 10:59:22'),
(3, 'DEVELOPER_ID', 'DEVELOPER_MESSAGE', 'DEVELOPER_PHONENUMBER', '2020-02-11 11:12:10');

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
  MODIFY `__ID__` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
