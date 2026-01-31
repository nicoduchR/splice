use sqlx::SqlitePool;
use splice::domain::entities::VideoProject;
use splice::domain::repositories::VideoRepository;
use splice::infrastructure::adapters::SqliteVideoRepository;

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
