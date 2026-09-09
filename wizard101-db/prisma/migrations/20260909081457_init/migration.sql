-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT
);

-- CreateTable
CREATE TABLE "worlds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "worldId" TEXT,
    CONSTRAINT "zones_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "worlds" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bosses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "zoneId" TEXT,
    CONSTRAINT "bosses_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rarities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "item_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" TEXT,
    "icon" TEXT
);

-- CreateTable
CREATE TABLE "item_sets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "popularity" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "set_bonuses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "setId" TEXT NOT NULL,
    "piecesRequired" INTEGER NOT NULL,
    "description" TEXT,
    CONSTRAINT "set_bonuses_setId_fkey" FOREIGN KEY ("setId") REFERENCES "item_sets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stat_definitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "unit" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "schoolId" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "stat_definitions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "item_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "statDefinitionId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    CONSTRAINT "item_stats_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_stats_statDefinitionId_fkey" FOREIGN KEY ("statDefinitionId") REFERENCES "stat_definitions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "set_bonus_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "setBonusId" TEXT NOT NULL,
    "statDefinitionId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    CONSTRAINT "set_bonus_stats_setBonusId_fkey" FOREIGN KEY ("setBonusId") REFERENCES "set_bonuses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "set_bonus_stats_statDefinitionId_fkey" FOREIGN KEY ("statDefinitionId") REFERENCES "stat_definitions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "talents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT
);

-- CreateTable
CREATE TABLE "item_talents" (
    "itemId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,

    PRIMARY KEY ("itemId", "talentId"),
    CONSTRAINT "item_talents_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_talents_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "talents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "item_schools" (
    "itemId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,

    PRIMARY KEY ("itemId", "schoolId"),
    CONSTRAINT "item_schools_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_schools_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "levelRequired" INTEGER NOT NULL DEFAULT 1,
    "itemTypeId" TEXT NOT NULL,
    "rarityId" TEXT,
    "worldId" TEXT,
    "zoneId" TEXT,
    "bossId" TEXT,
    "setId" TEXT,
    "sourceText" TEXT,
    "extra" TEXT,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "items_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "item_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "items_rarityId_fkey" FOREIGN KEY ("rarityId") REFERENCES "rarities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "items_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "worlds" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "items_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "items_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "bosses" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "items_setId_fkey" FOREIGN KEY ("setId") REFERENCES "item_sets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "worlds_slug_key" ON "worlds"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "zones_slug_key" ON "zones"("slug");

-- CreateIndex
CREATE INDEX "zones_worldId_idx" ON "zones"("worldId");

-- CreateIndex
CREATE UNIQUE INDEX "bosses_slug_key" ON "bosses"("slug");

-- CreateIndex
CREATE INDEX "bosses_zoneId_idx" ON "bosses"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "rarities_slug_key" ON "rarities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "item_types_slug_key" ON "item_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "item_sets_slug_key" ON "item_sets"("slug");

-- CreateIndex
CREATE INDEX "set_bonuses_setId_idx" ON "set_bonuses"("setId");

-- CreateIndex
CREATE UNIQUE INDEX "stat_definitions_key_key" ON "stat_definitions"("key");

-- CreateIndex
CREATE INDEX "stat_definitions_category_idx" ON "stat_definitions"("category");

-- CreateIndex
CREATE INDEX "item_stats_statDefinitionId_value_idx" ON "item_stats"("statDefinitionId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "item_stats_itemId_statDefinitionId_key" ON "item_stats"("itemId", "statDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "set_bonus_stats_setBonusId_statDefinitionId_key" ON "set_bonus_stats"("setBonusId", "statDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "talents_slug_key" ON "talents"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "items_slug_key" ON "items"("slug");

-- CreateIndex
CREATE INDEX "items_itemTypeId_idx" ON "items"("itemTypeId");

-- CreateIndex
CREATE INDEX "items_levelRequired_idx" ON "items"("levelRequired");

-- CreateIndex
CREATE INDEX "items_setId_idx" ON "items"("setId");

-- CreateIndex
CREATE INDEX "items_worldId_idx" ON "items"("worldId");

-- CreateIndex
CREATE INDEX "items_zoneId_idx" ON "items"("zoneId");

-- CreateIndex
CREATE INDEX "items_bossId_idx" ON "items"("bossId");

-- CreateIndex
CREATE INDEX "items_rarityId_idx" ON "items"("rarityId");
