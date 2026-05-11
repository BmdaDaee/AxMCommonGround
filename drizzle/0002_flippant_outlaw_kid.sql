CREATE TABLE `astrology_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`zodiac1` varchar(20) NOT NULL,
	`zodiac2` varchar(20) NOT NULL,
	`mode` enum('common','deeply') NOT NULL DEFAULT 'common',
	`reading` text NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `astrology_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bently_interventions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`userId` int NOT NULL,
	`interventionType` varchar(30) NOT NULL,
	`overlayType` varchar(20) NOT NULL DEFAULT 'common',
	`interventionText` text NOT NULL,
	`userResponse` text,
	`xpAwarded` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bently_interventions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`eventDate` timestamp NOT NULL,
	`category` varchar(50) NOT NULL DEFAULT 'Date',
	`isRecurring` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_question_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`userId` int NOT NULL,
	`questionIndex` int NOT NULL,
	`answer` text NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_question_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `desire_map` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(50) NOT NULL,
	`item` varchar(200) NOT NULL,
	`status` enum('green','yellow','red') NOT NULL DEFAULT 'yellow',
	`isShared` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `desire_map_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercise_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` varchar(50) NOT NULL,
	`xpAwarded` int NOT NULL DEFAULT 0,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercise_completions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `growth_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`userId` int NOT NULL,
	`moduleId` varchar(50) NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `growth_completions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intimate_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`bentlyResponse` text,
	`escalationLevel` int NOT NULL DEFAULT 1,
	`isDisappearing` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `intimate_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`aiAnalysis` text,
	`mood` varchar(30),
	`isSharedWithPartner` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journal_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`chosenOption` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relational_state_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`userId` int NOT NULL,
	`availability` enum('LOW','MEDIUM','HIGH') NOT NULL,
	`alignment` enum('LOW','MEDIUM','HIGH') NOT NULL,
	`activation` enum('LOW','MEDIUM','HIGH') NOT NULL,
	`trust` enum('LOW','MEDIUM','HIGH') NOT NULL,
	`derivedState` varchar(30) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `relational_state_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shared_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`listType` varchar(50) NOT NULL,
	`title` varchar(200) NOT NULL,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`addedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shared_lists_id` PRIMARY KEY(`id`)
);
