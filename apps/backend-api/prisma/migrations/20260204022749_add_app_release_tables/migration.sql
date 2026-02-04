-- CreateTable
CREATE TABLE "app_releases" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "release_date" TIMESTAMP(3) NOT NULL,
    "release_notes" TEXT,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_releases" (
    "id" TEXT NOT NULL,
    "release_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "download_url" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_releases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_releases_version_key" ON "app_releases"("version");

-- CreateIndex
CREATE INDEX "app_releases_version_idx" ON "app_releases"("version");

-- CreateIndex
CREATE INDEX "platform_releases_platform_idx" ON "platform_releases"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "platform_releases_release_id_platform_key" ON "platform_releases"("release_id", "platform");

-- AddForeignKey
ALTER TABLE "platform_releases" ADD CONSTRAINT "platform_releases_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "app_releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
