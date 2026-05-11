CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`iconEmoji` varchar(10) DEFAULT '🏆',
	`xpEarned` int NOT NULL DEFAULT 100,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_prompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content` text NOT NULL,
	`xpReward` int NOT NULL DEFAULT 10,
	`activeDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_prompts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deeplyus_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`moodAffection` int NOT NULL DEFAULT 50,
	`moodPassion` int NOT NULL DEFAULT 50,
	`moodCalm` int NOT NULL DEFAULT 50,
	`activatedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deeplyus_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `deeplyus_sessions_pairId_unique` UNIQUE(`pairId`)
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`addedByUserId` int NOT NULL,
	`imageUrl` text,
	`imageKey` text,
	`caption` text,
	`category` varchar(50) DEFAULT 'Moment',
	`xpEarned` int NOT NULL DEFAULT 20,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`isDeeplyUs` boolean NOT NULL DEFAULT false,
	`bentlyRewrite` text,
	`rewriteTone` enum('Gentle','Direct','Collaborative'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int,
	`title` varchar(200) NOT NULL,
	`description` text,
	`category` varchar(50) NOT NULL DEFAULT 'Connection',
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`xpReward` int NOT NULL DEFAULT 50,
	`isGlobal` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pairs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inviteCode` varchar(16) NOT NULL,
	`createdByUserId` int NOT NULL,
	`partnerId` int,
	`coupleNickname` varchar(100),
	`togetherSince` timestamp,
	`deeplyusConsent1` boolean NOT NULL DEFAULT false,
	`deeplyusConsent2` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pairs_id` PRIMARY KEY(`id`),
	CONSTRAINT `pairs_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `playlist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`artist` varchar(200),
	`addedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playlist_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pairId` int,
	`displayName` varchar(100),
	`avatarStyle` enum('Bold','Ethereal','Classic','Fantasy') DEFAULT 'Classic',
	`avatarColor` varchar(20) DEFAULT '#0B6B4F',
	`directness` int NOT NULL DEFAULT 50,
	`empathy` int NOT NULL DEFAULT 50,
	`wit` int NOT NULL DEFAULT 50,
	`warmth` int NOT NULL DEFAULT 50,
	`xp` int NOT NULL DEFAULT 0,
	`rank` enum('SPARK','FLAME','CALIBRATOR','INFERNO','SOVEREIGN') NOT NULL DEFAULT 'SPARK',
	`rankTheme` enum('Pharaoh','Samurai','Celestial','Shadow') DEFAULT 'Pharaoh',
	`streakDays` int NOT NULL DEFAULT 0,
	`lastActiveAt` timestamp DEFAULT (now()),
	`bentlyEnabled` boolean NOT NULL DEFAULT true,
	`reducedMotion` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `prompt_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promptId` int NOT NULL,
	`pairId` int NOT NULL,
	`userId` int NOT NULL,
	`response` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prompt_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sparks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int,
	`type` enum('Would You Rather','2 Truths 1 Lie','Rate Your Day','Tonight Spark','Daily Prompt') NOT NULL,
	`content` text NOT NULL,
	`optionA` text,
	`optionB` text,
	`xpReward` int NOT NULL DEFAULT 10,
	`isGlobal` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sparks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vault_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` int NOT NULL,
	`content` text NOT NULL,
	`addedByUserId` int NOT NULL,
	`isEncrypted` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vault_items_id` PRIMARY KEY(`id`)
);
