-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT,
    "birthYear" INTEGER,
    "gender" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "stage" TEXT,
    "bloodGlucoseTarget" JSONB,
    "bloodPressureTarget" JSONB,
    "medications" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "energyKcal" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "fiberG" DOUBLE PRECISION,
    "sodiumMg" DOUBLE PRECISION,
    "potassiumMg" DOUBLE PRECISION,
    "gi" INTEGER,
    "gl" DOUBLE PRECISION,
    "defaultPortionG" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personaId" TEXT,
    "mealType" TEXT NOT NULL,
    "mealTime" TIMESTAMP(3) NOT NULL,
    "predictedGlucose" DOUBLE PRECISION,
    "predictedGlucoseRange" JSONB,
    "actualGlucose" DOUBLE PRECISION,
    "optimization" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodRecordItem" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "amountG" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "FoodRecordItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceRef" TEXT,
    "durationSec" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Persona_userId_idx" ON "Persona"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Food_name_key" ON "Food"("name");

-- CreateIndex
CREATE INDEX "Food_category_idx" ON "Food"("category");

-- CreateIndex
CREATE INDEX "Food_name_idx" ON "Food"("name");

-- CreateIndex
CREATE INDEX "FoodRecord_userId_idx" ON "FoodRecord"("userId");

-- CreateIndex
CREATE INDEX "FoodRecord_personaId_idx" ON "FoodRecord"("personaId");

-- CreateIndex
CREATE INDEX "FoodRecord_mealTime_idx" ON "FoodRecord"("mealTime");

-- CreateIndex
CREATE INDEX "FoodRecordItem_recordId_idx" ON "FoodRecordItem"("recordId");

-- CreateIndex
CREATE INDEX "FoodRecordItem_foodId_idx" ON "FoodRecordItem"("foodId");

-- CreateIndex
CREATE INDEX "KnowledgeCard_category_idx" ON "KnowledgeCard"("category");

-- CreateIndex
CREATE INDEX "KnowledgeCard_type_idx" ON "KnowledgeCard"("type");

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodRecord" ADD CONSTRAINT "FoodRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodRecord" ADD CONSTRAINT "FoodRecord_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodRecordItem" ADD CONSTRAINT "FoodRecordItem_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "FoodRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodRecordItem" ADD CONSTRAINT "FoodRecordItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
