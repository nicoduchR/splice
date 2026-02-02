use sqlx::SqlitePool;
use splice::domain::entities::VideoProject;
use splice::domain::repositories::VideoRepository;
use splice::infrastructure::adapters::SqliteVideoRepository;
use splice::infrastructure::ffmpeg::VideoMetadata;

#[tokio::test]
async fn test_save_and_find_project() {
    // Create in-memory database
    let pool = SqlitePool::connect("sqlite::memory:")
        .await
        .unwrap();

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .unwrap();

    let repo = SqliteVideoRepository::new(pool);

    // Create test project
    let project = VideoProject::new(
        "test-123".to_string(),
        "/path/to/video.mp4".to_string(),
        "video.mp4".to_string(),
        120.5,
    ).unwrap();

    // Save project
    let saved = repo.save(project.clone()).unwrap();
    assert_eq!(saved.id, "test-123");

    // Find project
    let found = repo.find_by_id("test-123").unwrap();
    assert!(found.is_some());
    let found_project = found.unwrap();
    assert_eq!(found_project.id, "test-123");
    assert_eq!(found_project.file_name, "video.mp4");
    assert_eq!(found_project.duration_seconds, 120.5);

    // Find all projects
    let all = repo.find_all().unwrap();
    assert_eq!(all.len(), 1);

    // Delete project
    repo.delete("test-123").unwrap();
    let deleted = repo.find_by_id("test-123").unwrap();
    assert!(deleted.is_none());
}

#[tokio::test]
async fn test_find_all_returns_multiple_projects() {
    let pool = SqlitePool::connect("sqlite::memory:")
        .await
        .unwrap();

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .unwrap();

    let repo = SqliteVideoRepository::new(pool);

    // Create multiple projects
    let project1 = VideoProject::new(
        "test-1".to_string(),
        "/path/1.mp4".to_string(),
        "video1.mp4".to_string(),
        100.0,
    ).unwrap();

    let project2 = VideoProject::new(
        "test-2".to_string(),
        "/path/2.mp4".to_string(),
        "video2.mp4".to_string(),
        200.0,
    ).unwrap();

    let project3 = VideoProject::new(
        "test-3".to_string(),
        "/path/3.mp4".to_string(),
        "video3.mp4".to_string(),
        300.0,
    ).unwrap();

    // Save all projects
    repo.save(project1).unwrap();
    repo.save(project2).unwrap();
    repo.save(project3).unwrap();

    // Find all - should return 3 projects
    let all = repo.find_all().unwrap();
    assert_eq!(all.len(), 3);

    // Verify they're ordered by created_at DESC (most recent first)
    // Since created in same second, order might vary, but all should be present
    let ids: Vec<String> = all.iter().map(|p| p.id.clone()).collect();
    assert!(ids.contains(&"test-1".to_string()));
    assert!(ids.contains(&"test-2".to_string()));
    assert!(ids.contains(&"test-3".to_string()));
}

#[tokio::test]
async fn test_migration_idempotence() {
    let pool = SqlitePool::connect("sqlite::memory:")
        .await
        .unwrap();

    // Run migrations twice
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .unwrap();

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .unwrap();

    // Should not error - migrations are idempotent
}

#[tokio::test]
async fn test_update_project() {
    let pool = SqlitePool::connect("sqlite::memory:")
        .await
        .unwrap();

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .unwrap();

    let repo = SqliteVideoRepository::new(pool);

    // Create and save project
    let mut project = VideoProject::new(
        "test-update".to_string(),
        "/path/original.mp4".to_string(),
        "original.mp4".to_string(),
        100.0,
    ).unwrap();

    repo.save(project.clone()).unwrap();

    // Update project
    project.file_name = "updated.mp4".to_string();
    project.duration_seconds = 150.0;

    repo.save(project.clone()).unwrap();

    // Verify update
    let found = repo.find_by_id("test-update").unwrap().unwrap();
    assert_eq!(found.file_name, "updated.mp4");
    assert_eq!(found.duration_seconds, 150.0);

    // Should still only have 1 project (not 2)
    let all = repo.find_all().unwrap();
    assert_eq!(all.len(), 1);
}

#[tokio::test]
async fn test_save_and_retrieve_project_with_metadata() {
    // Story 1.6: Test complete metadata round-trip (save → retrieve → verify)
    let pool = SqlitePool::connect("sqlite::memory:")
        .await
        .unwrap();

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .unwrap();

    let repo = SqliteVideoRepository::new(pool);

    // Create project with complete metadata
    let metadata = VideoMetadata {
        codec_name: "h264".to_string(),
        codec_type: "video".to_string(),
        width: Some(1920),
        height: Some(1080),
        duration: 125.5,
        file_size: 52428800, // 50MB
    };

    let project = VideoProject::new(
        "test-metadata".to_string(),
        "/path/to/video.mp4".to_string(),
        "video.mp4".to_string(),
        125.5,
    )
    .unwrap()
    .with_metadata(&metadata);

    // Verify metadata was set on entity
    assert_eq!(project.width, Some(1920), "Width should be set before save");
    assert_eq!(project.height, Some(1080), "Height should be set before save");
    assert_eq!(project.file_size_bytes, Some(52428800), "File size should be set before save");
    assert_eq!(project.codec, Some("h264".to_string()), "Codec should be set before save");

    // Save to SQLite
    let saved = repo.save(project.clone()).unwrap();
    assert_eq!(saved.width, Some(1920), "Saved project should have width");

    // Retrieve from SQLite
    let retrieved = repo.find_by_id("test-metadata").unwrap().unwrap();

    // CRITICAL: Verify ALL metadata fields persisted correctly
    assert_eq!(retrieved.id, "test-metadata");
    assert_eq!(retrieved.file_name, "video.mp4");
    assert_eq!(retrieved.duration_seconds, 125.5);
    assert_eq!(retrieved.width, Some(1920), "Width should be persisted in SQLite");
    assert_eq!(retrieved.height, Some(1080), "Height should be persisted in SQLite");
    assert_eq!(retrieved.file_size_bytes, Some(52428800), "File size should be persisted in SQLite");
    assert_eq!(retrieved.codec, Some("h264".to_string()), "Codec should be persisted in SQLite");
}

#[tokio::test]
async fn test_save_project_without_metadata_null_values() {
    // Story 1.6: Test backward compatibility - projects without metadata should have NULL
    let pool = SqlitePool::connect("sqlite::memory:")
        .await
        .unwrap();

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .unwrap();

    let repo = SqliteVideoRepository::new(pool);

    // Create project WITHOUT metadata (legacy style)
    let project = VideoProject::new(
        "test-no-metadata".to_string(),
        "/path/to/legacy.mp4".to_string(),
        "legacy.mp4".to_string(),
        100.0,
    ).unwrap();

    // Verify metadata fields are None
    assert!(project.width.is_none(), "Width should be None initially");
    assert!(project.height.is_none(), "Height should be None initially");
    assert!(project.file_size_bytes.is_none(), "File size should be None initially");
    assert!(project.codec.is_none(), "Codec should be None initially");

    // Save to SQLite
    repo.save(project).unwrap();

    // Retrieve and verify NULL values persisted correctly
    let retrieved = repo.find_by_id("test-no-metadata").unwrap().unwrap();
    assert_eq!(retrieved.id, "test-no-metadata");
    assert!(retrieved.width.is_none(), "Width should remain None in database");
    assert!(retrieved.height.is_none(), "Height should remain None in database");
    assert!(retrieved.file_size_bytes.is_none(), "File size should remain None in database");
    assert!(retrieved.codec.is_none(), "Codec should remain None in database");
}
